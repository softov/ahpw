import type { Disposable, Scena } from '@softov/scena/types';
import { combineDisposables } from '@softov/scena';
import { AHP_DEFAULT_DIRECTORY, AHP_HOST, request, titlePath, type HostFacts } from '../connection/data.js';
import { confirm, failed } from '../notify/index.js';
import { PALETTE_SLOT } from '../view/Palette.js';
import TerminalPage from './TerminalPage.js';
import { TERMINAL_ICON } from './rows.js';
import { clientClaim, newTerminalUri } from './terminal.js';

/** Arguments of `ahp.openTerminal` and `ahp.killTerminal`. */
export interface TerminalArgs {
  uri: string;
}

/** The surface terminals open in, under the page. */
const PANEL = 'panel:bottom';

const keyOf = (uri: string): string => `terminal:${uri}`;

/** Bring the bottom panel up. */
function showPanel(scena: Scena, visible = true): void {
  const current = scena.layout.get().surfaces[PANEL];
  scena.layout.setSurface(PANEL, { ...current, visible });
}

/** Terminals on the host, each a tab in the bottom panel. */
export function registerTerminals(scena: Scena): Disposable {
  const open = (uri: string): void => {
    scena.surfaces.open({
      surface: PANEL,
      key: keyOf(uri),
      resource: { component: 'TerminalPage', uri },
      props: { title: { path: titlePath(uri) }, icon: TERMINAL_ICON },
    });
    showPanel(scena);
  };

  const create = async (): Promise<void> => {
    const host = scena.store.get<HostFacts | null>(AHP_HOST);
    if (host === null || host === undefined) throw new Error('Not connected to the daemon.');
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
    scena.components.register({
      component: 'TerminalPage',
      category: 'page',
      renderer: { kind: 'react', load: async () => ({ default: TerminalPage as unknown }) },
    }),
    scena.commands.register({
      id: 'ahp.openTerminal',
      title: 'Open terminal',
      run: (_ctx, args) => {
        const uri = (args as TerminalArgs | undefined)?.uri;
        if (uri !== undefined) open(uri);
      },
    }),
    scena.commands.register({
      id: 'ahp.newTerminal',
      title: 'New terminal',
      category: 'Terminal',
      icon: TERMINAL_ICON,
      slots: [PALETTE_SLOT],
      run: () => create().catch((error: unknown) => failed('The terminal could not be created', error, { source: 'ahp.newTerminal' })),
    }),
    scena.commands.register({
      id: 'ahp.toggleTerminals',
      title: 'Toggle terminal panel',
      category: 'Terminal',
      slots: [PALETTE_SLOT],
      keys: ['ctrl+`', 'ctrl+j'],
      run: () => {
        const visible = scena.layout.get().surfaces[PANEL]?.visible ?? false;
        if (visible) {
          showPanel(scena, false);
          return;
        }
        if (scena.surfaces.listAt(PANEL).length > 0) {
          showPanel(scena);
          return;
        }
        const first = scena.store.get<HostFacts | null>(AHP_HOST)?.terminals[0];
        if (first !== undefined) open(first.resource);
        else void scena.commands.execute('ahp.newTerminal');
      },
    }),
    scena.commands.register({
      id: 'ahp.killTerminal',
      title: 'Kill terminal',
      run: async (_ctx, args) => {
        const uri = (args as TerminalArgs | undefined)?.uri;
        if (uri === undefined) return;
        const title = scena.store.get<string>(titlePath(uri)) ?? 'Terminal';
        if (!(await confirm({ title: `Kill "${title}"?`, body: 'Its process ends on the host.', confirmLabel: 'Kill', tone: 'danger' }))) return;
        try {
          await request('disposeTerminal', { channel: uri } as never);
          scena.surfaces.close(keyOf(uri));
        } catch (error) {
          failed('The terminal could not be killed', error, { source: 'ahp.killTerminal' });
        }
      },
    }),
    // A terminal tab's menu: kill it. Closing the tab only hides it; the process keeps running.
    scena.mountMenus.register('tab:context', (mount) => {
      const node = mount.component as { component?: unknown; uri?: unknown };
      if (node.component !== 'TerminalPage' || typeof node.uri !== 'string') return [];
      const uri = node.uri;
      return [
        { title: 'New terminal', group: 'Terminal', icon: TERMINAL_ICON, onSelect: (host) => { host.closeMenu(); void scena.commands.execute('ahp.newTerminal'); } },
        { title: 'Kill terminal', group: 'Terminal', color: 'red', onSelect: (host) => { host.closeMenu(); void scena.commands.execute('ahp.killTerminal', { uri }); } },
      ];
    }),
  );
}
