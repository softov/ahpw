import { registerComposerCommands } from './composer-commands.js';
import type { BindingPath, Disposable, Scena } from '@softov/scena/types';
import { combineDisposables, isOverlaid, resolveSurfacePresentation, type ModusClass } from '@softov/scena';
import { PRESENTATION } from '../presentation.js';
import type { SessionSummary } from '@microsoft/agent-host-protocol';
import { AHP_SESSIONS, titlePath } from '../connection/data.js';
import { ACTIVE_SESSION } from './state.js';
import SessionExplorer from './Explorer.js';
import SessionPage from './Page.js';
import NewSessionPage from './New.js';
import SessionDetails from './Details.js';
import { PALETTE_SLOT } from '../view/Palette.js';

/** The display size class the modus backend publishes. */
const MODUS_CLASS = '$/modus/class' as BindingPath;

/** The sidebar section the sessions list shows in. */
export const SESSIONS_SECTION = 'ahp:sessions';

/** A sidebar lifted over the page is put away once it has done its job. */
export function hideOverlaidSidebar(scena: Scena, modus: ModusClass, surface: 'sidebar:left' | 'sidebar:right' = 'sidebar:left'): void {
  if (!isOverlaid(resolveSurfacePresentation(surface, modus, PRESENTATION))) return;
  const current = scena.layout.get().surfaces[surface];
  if (current?.visible === false) return;
  scena.layout.setSurface(surface, { ...current, visible: false });
}

/** Arguments of `ahp.openSession`. */
export interface OpenSessionArgs {
  resource: string;
}

/** The sessions list and the session page. */
export function registerSessions(scena: Scena): Disposable {
  return combineDisposables(
    registerComposerCommands(scena),
    scena.components.register({
      component: 'SessionExplorer',
      category: 'page',
      renderer: { kind: 'react', load: async () => ({ default: SessionExplorer as unknown }) },
    }),
    scena.components.register({
      component: 'SessionPage',
      category: 'page',
      renderer: { kind: 'react', load: async () => ({ default: SessionPage as unknown }) },
    }),

    scena.components.register({
      component: 'NewSessionPage',
      category: 'page',
      renderer: { kind: 'react', load: async () => ({ default: NewSessionPage as unknown }) },
    }),
    scena.components.register({
      component: 'SessionDetails',
      category: 'page',
      renderer: { kind: 'react', load: async () => ({ default: SessionDetails as unknown }) },
    }),
    scena.commands.register({
      id: 'ahp.showSessions',
      title: 'Show sessions',
      category: 'Sessions',
      slots: [PALETTE_SLOT],
      run: (ctx) => ctx.commands.execute('sidebar.activate', { section: SESSIONS_SECTION }),
    }),
    scena.commands.register({
      id: 'ahp.newSession',
      title: 'New session',
      category: 'Sessions',
      slots: [PALETTE_SLOT],
      run: (ctx) => {
        ctx.surfaces.open({ surface: 'main', key: 'session:new', resource: { component: 'NewSessionPage' }, props: { title: 'New session' } });
        hideOverlaidSidebar(ctx.scena, ctx.store.get<ModusClass>(MODUS_CLASS) ?? 'large');
      },
    }),
    scena.commands.register({
      id: 'ahp.openSession',
      title: 'Open session',
      run: (ctx, args) => {
        const resource = (args as OpenSessionArgs | undefined)?.resource;
        if (resource === undefined) return;
        ctx.store.set(ACTIVE_SESSION, resource);
        ctx.surfaces.open({
          surface: 'main',
          key: `session:${resource}`,
          resource: { component: 'SessionPage', resource },
          props: { title: { path: titlePath(resource) } },
        });
        hideOverlaidSidebar(ctx.scena, ctx.store.get<ModusClass>(MODUS_CLASS) ?? 'large');
        hideOverlaidSidebar(ctx.scena, ctx.store.get<ModusClass>(MODUS_CLASS) ?? 'large', 'sidebar:right');
      },
    }),

    scena.surfaces.mount({
      surface: 'sidebar:right',
      key: 'session:details',
      resource: { component: 'SessionDetails' },
      props: { title: 'Session' },
    }),
    scena.surfaces.mount({
      surface: 'activitybar',
      key: 'sessions:nav',
      resource: { component: 'ActivityBarItem', icon: '\u{1F4AC}', label: 'Sessions', section: SESSIONS_SECTION },
    }),
    scena.surfaces.mount({
      surface: 'sidebar:left',
      key: 'sessions:explorer',
      when: `$/layout/surfaces/sidebar:left/section == "${SESSIONS_SECTION}"`,
      resource: { component: 'SessionExplorer' },
    }),
  );
}
