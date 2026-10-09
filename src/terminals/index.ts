import type { Disposable, Scena } from '@softov/scena/types';
import { combineDisposables } from '@softov/scena';
import { AHP_DEFAULT_DIRECTORY, AHP_DETACHED, AHP_HOST, request, titlePath, type HostFacts } from '../connection/data.js';
import { confirm, failed } from '../notify/index.js';
import { PALETTE_SLOT } from '../view/Palette.js';
import { onPanel, onPanelTab, openInPanel, PANEL, redrawPanel, STRIP_SLOT } from '../panel/index.js';
import { TERMINAL_ICON } from './rows.js';
import { clientClaim, newTerminalUri } from './terminal.js';
import { EMOJIcon } from '../emojis.js';

/** Arguments of the terminal commands; without one, the panel's active tab. */
export interface TerminalArgs {
  uri: string;
}

const PREFIX = 'terminal:';
const keyOf = (uri: string): string => `${PREFIX}${uri}`;
const uriOf = (key: string | undefined): string | undefined => (key?.startsWith(PREFIX) === true ? key.slice(PREFIX.length) : undefined);

/**
 * Terminals on the host, each a tab in the bottom panel after the log. A tab
 * opens for every terminal the host lists, in the background; a tab the user
 * closes stays closed, and the terminal keeps running, until it is opened again.
 */
export function registerTerminals(scena: Scena): Disposable {
  /** Terminals whose tab the user closed. */
  const dismissed = new Set<string>();
  /** Terminals the host has listed, so a tab is closed only for one the host dropped. */
  const listed = new Set<string>();
  /** Tabs this module is closing itself, which do not count as dismissed. */
  const closing = new Set<string>();

  const open = (uri: string, background = false): void => {
    openInPanel(scena, {
      key: keyOf(uri),
      resource: { component: 'TerminalPage', uri },
      props: { title: { path: titlePath(uri) }, icon: TERMINAL_ICON },
    }, { background });
  };
  const closeTab = (uri: string): void => {
    closing.add(uri);
    scena.surfaces.close(keyOf(uri));
    closing.delete(uri);
  };
  const argOf = (args: unknown): string | undefined =>
    (args as TerminalArgs | undefined)?.uri ?? uriOf(scena.store.get<string>('$/tab/key'));
  const detached = (): string[] => scena.store.get<string[]>(AHP_DETACHED) ?? [];
  const attach = (uri: string, on: boolean): void => {
    const rest = detached().filter((one) => one !== uri);
    scena.store.set(AHP_DETACHED, on ? rest : [...rest, uri]);
    redrawPanel(scena);
  };

  /** Match the panel's terminal tabs to the host's list. */
  const sync = (): void => {
    const host = scena.store.get<HostFacts | null>(AHP_HOST);
    if (host === null || host === undefined) return;
    const live = new Set(host.terminals.map((terminal) => terminal.resource));
    const tabs = new Set(scena.surfaces.listAt(PANEL).map((mount) => uriOf(mount.key)).filter((uri) => uri !== undefined));
    for (const uri of listed) {
      if (live.has(uri)) continue;
      listed.delete(uri);
      dismissed.delete(uri);
      if (tabs.has(uri)) closeTab(uri);
    }
    for (const uri of live) {
      listed.add(uri);
      if (!tabs.has(uri) && !dismissed.has(uri)) open(uri, true);
    }
  };

  const create = async (): Promise<void> => {
    const host = scena.store.get<HostFacts | null>(AHP_HOST);
    if (host === null || host === undefined) throw new Error('Not connected to the server.');
    const cwd = scena.store.get<string | null>(AHP_DEFAULT_DIRECTORY);
    const uri = newTerminalUri();
    await request('createTerminal', {
      channel: uri,
      claim: clientClaim(host.clientId),
      name: 'Terminal',
      ...(cwd === null || cwd === undefined ? {} : { cwd }),
    } as never);
    open(uri);
  };

  return combineDisposables(
    scena.store.subscribe(AHP_HOST, sync),
    // A tab closed by the user, not hidden with the panel and not moved, is dismissed.
    scena.events.on('scena:mount:closed', (payload) => {
      const { key, reason } = payload as { key: string; reason?: string };
      const uri = uriOf(key);
      if (uri === undefined || closing.has(uri) || reason?.startsWith('move:') === true) return;
      queueMicrotask(() => {
        if (scena.surfaces.listAt(PANEL).some((mount) => mount.key === key)) return;
        dismissed.add(uri);
        attach(uri, true);
      });
    }),
    scena.components.register({
      component: 'TerminalPage',
      category: 'page',
      renderer: { kind: 'react', load: () => import('./TerminalPage.js') },
    }),
    scena.commands.register({
      id: 'ahp.openTerminal',
      title: 'Open terminal',
      run: (_ctx, args) => {
        const uri = (args as TerminalArgs | undefined)?.uri;
        if (uri === undefined) return;
        dismissed.delete(uri);
        open(uri);
      },
    }),
    scena.commands.register({
      id: 'ahp.disconnectTerminal',
      title: 'Disconnect terminal',
      icon: EMOJIcon.pause,
      slots: [STRIP_SLOT],
      when: (ctx) => onPanelTab('TerminalPage')(ctx) && !detached().includes(uriOf(ctx['$/tab/key'] as string | undefined) ?? ''),
      run: (_ctx, args) => {
        const uri = argOf(args);
        if (uri !== undefined) attach(uri, false);
      },
    }),
    scena.commands.register({
      id: 'ahp.connectTerminal',
      title: 'Connect terminal',
      icon: EMOJIcon.run,
      slots: [STRIP_SLOT],
      when: (ctx) => onPanelTab('TerminalPage')(ctx) && detached().includes(uriOf(ctx['$/tab/key'] as string | undefined) ?? ''),
      run: (_ctx, args) => {
        const uri = argOf(args);
        if (uri !== undefined) attach(uri, true);
      },
    }),
    scena.commands.register({
      id: 'ahp.killTerminal',
      title: 'Kill terminal',
      icon: EMOJIcon.trash,
      slots: [STRIP_SLOT],
      when: onPanelTab('TerminalPage'),
      run: async (_ctx, args) => {
        const uri = argOf(args);
        if (uri === undefined) return;
        const title = scena.store.get<string>(titlePath(uri)) ?? 'Terminal';
        if (!(await confirm({ title: `Kill "${title}"?`, body: 'Its process ends on the host.', confirmLabel: 'Kill', tone: 'danger' }))) return;
        try {
          await request('disposeTerminal', { channel: uri } as never);
          closeTab(uri);
        } catch (error) {
          failed('The terminal could not be killed', error, { source: 'ahp.killTerminal' });
        }
      },
    }),
    scena.commands.register({
      id: 'ahp.newTerminal',
      title: 'New terminal',
      category: 'Terminal',
      icon: '+',
      slots: [PALETTE_SLOT, STRIP_SLOT],
      when: onPanel,
      run: () => create().catch((error: unknown) => failed('The terminal could not be created', error, { source: 'ahp.newTerminal' })),
    }),
    // A terminal tab's menu. Closing the tab only hides it; the process keeps running.
    scena.mountMenus.register('tab:context', (mount) => {
      const node = mount.component as { component?: unknown; uri?: unknown };
      if (node.component !== 'TerminalPage' || typeof node.uri !== 'string') return [];
      const uri = node.uri;
      return [
        { title: 'New terminal', group: 'Terminal', icon: TERMINAL_ICON, onSelect: (host) => { host.closeMenu(); void scena.commands.execute('ahp.newTerminal'); } },
        detached().includes(uri)
          ? { title: 'Connect terminal', group: 'Terminal', onSelect: (host) => { host.closeMenu(); void scena.commands.execute('ahp.connectTerminal', { uri }); } }
          : { title: 'Disconnect terminal', group: 'Terminal', onSelect: (host) => { host.closeMenu(); void scena.commands.execute('ahp.disconnectTerminal', { uri }); } },
        { title: 'Kill terminal', group: 'Terminal', color: 'red', onSelect: (host) => { host.closeMenu(); void scena.commands.execute('ahp.killTerminal', { uri }); } },
      ];
    }),
  );
}
