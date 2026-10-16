import type { Disposable, ListSpec, Scena } from '@softov/scena/types';
import { combineDisposables, translate } from '@softov/scena';
import { english } from '../../i18n/locales.js';
import { ahpPaths, hostBridge, titlePath, windowHost, type HostFacts } from '../../bridges/data.js';
import { everyHost, hostLabel, hostNameOf, onEachHost } from '../../bridges/hosts.js';
import { confirm, failed } from '../../shell/notify/index.js';
import { openPalette, PALETTE_SLOT } from '../../shell/CommandPalette.js';
import { embedMode } from '../../shell/embed/index.js';
import { onPanel, onPanelTab, openInPanel, PANEL, redrawPanel, STRIP_SLOT } from '../../shell/panel/index.js';
import { TERMINAL_ICON } from './rows.js';
import { clientClaim, newTerminalUri } from './terminal.js';
import { EMOJIcon } from '../emojis.js';
import { folderName } from '../../bridges/words.js';

/** Arguments of the terminal commands; without one, the panel's active tab. */
export interface TerminalArgs {
  uri: string;
  /** The terminal's host; the window's host by default. */
  host?: string;
}

/** A terminal tab: its host and the terminal. */
interface TerminalTab {
  host: string;
  uri: string;
}

const keyOf = (host: string, uri: string): string => `terminal:${host}:${uri}`;
function tabOf(key: string | undefined): TerminalTab | undefined {
  const match = key === undefined ? null : /^terminal:([^:]+):(.+)$/.exec(key);
  return match === null ? undefined : { host: match[1]!, uri: match[2]! };
}

/**
 * Terminals on the host, each a tab in the bottom panel after the log. A tab
 * opens for every terminal the host lists, in the background; a tab the user
 * closes stays closed, and the terminal keeps running, until it is opened again.
 */
export function registerTerminals(scena: Scena): Disposable {
  /** Tabs of terminals the user closed, by tab key. */
  const dismissed = new Set<string>();
  /** The terminals each host has listed, so a tab is closed only for one its host dropped. */
  const listed = new Map<string, Set<string>>();
  /** Tabs this module is closing itself, by tab key, which do not count as dismissed. */
  const closing = new Set<string>();

  const open = ({ host, uri }: TerminalTab, background = false): void => {
    openInPanel(scena, {
      key: keyOf(host, uri),
      resource: { component: 'TerminalPage', host, uri },
      props: { title: { path: titlePath(host, uri) }, icon: TERMINAL_ICON },
    }, { background });
  };
  const closeTab = ({ host, uri }: TerminalTab): void => {
    const key = keyOf(host, uri);
    closing.add(key);
    scena.surfaces.close(key);
    closing.delete(key);
  };
  const argOf = (args: unknown): TerminalTab | undefined => {
    const given = args as TerminalArgs | undefined;
    return given?.uri === undefined ? tabOf(scena.store.get<string>('$/tab/key')) : { host: given.host ?? windowHost(), uri: given.uri };
  };
  const detached = (host: string): string[] => scena.store.get<string[]>(ahpPaths(host).detached) ?? [];
  const isDetached = (key: string | undefined): boolean => {
    const tab = tabOf(key);
    return tab !== undefined && detached(tab.host).includes(tab.uri);
  };
  const attach = ({ host, uri }: TerminalTab, on: boolean): void => {
    const rest = detached(host).filter((one) => one !== uri);
    scena.store.set(ahpPaths(host).detached, on ? rest : [...rest, uri]);
    redrawPanel(scena);
  };

  /** Match the panel's tabs of the host `host` to its list. */
  const sync = (host: string): void => {
    const facts = scena.store.get<HostFacts | null>(ahpPaths(host).host);
    if (facts === null || facts === undefined) return;
    const live = new Set(facts.terminals.map((terminal) => terminal.resource));
    const tabs = new Set(scena.surfaces.listAt(PANEL).map((mount) => mount.key));
    const known = listed.get(host) ?? new Set<string>();
    listed.set(host, known);
    for (const uri of known) {
      if (live.has(uri)) continue;
      known.delete(uri);
      dismissed.delete(keyOf(host, uri));
      if (tabs.has(keyOf(host, uri))) closeTab({ host, uri });
    }
    for (const uri of live) {
      known.add(uri);
      const key = keyOf(host, uri);
      if (!tabs.has(key) && !dismissed.has(key)) open({ host, uri }, true);
    }
  };



  /** A terminal in `folder`, else in the host's default directory, named for that folder. */
  const create = async (host: string, folder?: string): Promise<void> => {
    const facts = scena.store.get<HostFacts | null>(ahpPaths(host).host);
    if (facts === null || facts === undefined) throw new Error(translate('terminals/notConnected'));
    const cwd = folder ?? scena.store.get<string | null>(ahpPaths(host).defaultDirectory);
    const uri = newTerminalUri();
    await hostBridge(host).request('createTerminal', {
      channel: uri,
      claim: clientClaim(facts.clientId),
      name: cwd === null || cwd === undefined ? translate('terminals/terminal') : folderName(cwd),
      ...(cwd === null || cwd === undefined ? {} : { cwd }),
    } as never);
    open({ host, uri });
  };

  return combineDisposables(
    onEachHost(scena, (host) => {
      sync(host);
      return scena.store.subscribe(ahpPaths(host).host, () => sync(host));
    }),
    // A tab closed by the user, not hidden with the panel and not moved, is dismissed.
    scena.events.on('scena:mount:closed', (payload) => {
      const { key, reason } = payload as { key: string; reason?: string };
      const tab = tabOf(key);
      if (tab === undefined || closing.has(key) || reason?.startsWith('move:') === true) return;
      queueMicrotask(() => {
        if (scena.surfaces.listAt(PANEL).some((mount) => mount.key === key)) return;
        dismissed.add(key);
        attach(tab, true);
      });
    }),
    scena.components.register({
      component: 'TerminalPage',
      category: 'page',
      renderer: { kind: 'react', load: () => import('./TerminalPage.js') },
    }),
    scena.commands.register({
      id: 'ahp.openTerminal',
      title: () => translate('terminals/commands/open'),
      run: (_ctx, args) => {
        const given = args as TerminalArgs | undefined;
        if (given?.uri === undefined) return;
        const tab = { host: given.host ?? windowHost(), uri: given.uri };
        dismissed.delete(keyOf(tab.host, tab.uri));
        open(tab);
      },
    }),
    scena.commands.register({
      id: 'ahp.disconnectTerminal',
      title: () => translate('terminals/commands/disconnect'),
      icon: EMOJIcon.pause,
      slots: [STRIP_SLOT],
      when: (ctx) => onPanelTab('TerminalPage')(ctx) && !isDetached(ctx['$/tab/key'] as string | undefined),
      run: (_ctx, args) => {
        const tab = argOf(args);
        if (tab !== undefined) attach(tab, false);
      },
    }),
    scena.commands.register({
      id: 'ahp.connectTerminal',
      title: () => translate('terminals/commands/connect'),
      icon: EMOJIcon.run,
      slots: [STRIP_SLOT],
      when: (ctx) => onPanelTab('TerminalPage')(ctx) && isDetached(ctx['$/tab/key'] as string | undefined),
      run: (_ctx, args) => {
        const tab = argOf(args);
        if (tab !== undefined) attach(tab, true);
      },
    }),
    scena.commands.register({
      id: 'ahp.killTerminal',
      title: () => translate('terminals/commands/kill'),
      icon: EMOJIcon.trash,
      slots: [STRIP_SLOT],
      when: onPanelTab('TerminalPage'),
      run: async (_ctx, args) => {
        const tab = argOf(args);
        if (tab === undefined) return;
        const title = scena.store.get<string>(titlePath(tab.host, tab.uri)) ?? translate('terminals/terminal');
        if (!(await confirm({ title: translate('terminals/kill/title', { title }), body: translate('terminals/kill/body'), confirmLabel: translate('terminals/kill/confirm'), tone: 'danger' }))) return;
        try {
          await hostBridge(tab.host).request('disposeTerminal', { channel: tab.uri } as never);
          closeTab(tab);
        } catch (error) {
          failed(translate('terminals/failed/kill'), error, { source: 'ahp.killTerminal' });
        }
      },
    }),
    scena.commands.register({
      id: 'ahp.newTerminal',
      title: () => translate('terminals/commands/new'),
      keywords: [english('terminals/commands/new')],
      category: 'Terminal',
      icon: '+',
      slots: [PALETTE_SLOT, STRIP_SLOT],
      when: onPanel,
      run: (ctx, args) => {
        const { cwd, host } = (args as { cwd?: string; host?: string } | undefined) ?? {};
        const make = (on: string): void => void create(on, cwd).catch((error: unknown) => failed(translate('terminals/failed/create'), error, { source: 'ahp.newTerminal' }));
        if (host !== undefined || embedMode() !== 'multi') {
          make(host ?? windowHost());
          return;
        }
        // With every host and none named, the person picks the host.
        const list: ListSpec = {
          title: translate('terminals/newOn'),
          items: everyHost(ctx.store).map((one) => ({
            title: hostLabel(ctx.store, one),
            onSelect: (menu) => {
              menu.closeMenu();
              make(one);
            },
          })),
        };
        if (ctx.host !== undefined) ctx.host.pushList(list);
        else openPalette(ctx.scena, list);
      },
    }),
    // A terminal tab's menu. Closing the tab only hides it; the process keeps running.
    scena.mountMenus.register('tab:context', (mount) => {
      const node = mount.component as { component?: unknown; host?: unknown; uri?: unknown };
      if (node.component !== 'TerminalPage' || typeof node.uri !== 'string' || typeof node.host !== 'string') return [];
      const tab = { host: node.host, uri: node.uri };
      const group = translate('terminals/terminal');
      return [
        { title: translate('terminals/commands/new'), group, icon: TERMINAL_ICON, onSelect: (host) => { host.closeMenu(); void scena.commands.execute('ahp.newTerminal'); } },
        detached(tab.host).includes(tab.uri)
          ? { title: translate('terminals/commands/connect'), group, onSelect: (host) => { host.closeMenu(); void scena.commands.execute('ahp.connectTerminal', tab); } }
          : { title: translate('terminals/commands/disconnect'), group, onSelect: (host) => { host.closeMenu(); void scena.commands.execute('ahp.disconnectTerminal', tab); } },
        { title: translate('terminals/commands/kill'), group, color: 'red', onSelect: (host) => { host.closeMenu(); void scena.commands.execute('ahp.killTerminal', tab); } },
      ];
    }),
  );
}
