import type { BindingPath, Disposable, Scena } from '@softov/scena/types';
import { combineDisposables, isOverlaid, resolveSurfacePresentation, type ModusClass } from '@softov/scena';
import { PRESENTATION } from '../presentation.js';
import type { SessionSummary } from '@microsoft/agent-host-protocol';
import { ACTIVE_SESSION, AHP_SESSIONS, ahpProvider } from './data.js';
import SessionExplorer from './Explorer.js';
import SessionPage from './Page.js';

/** The display size class the modus backend publishes. */
const MODUS_CLASS = '$/modus/class' as BindingPath;

/** The sidebar section the sessions list shows in. */
export const SESSIONS_SECTION = 'ahp:sessions';

/** Arguments of `ahp.openSession`. */
export interface OpenSessionArgs {
  resource: string;
}

/** The AHP connection, the sessions list and the session page. */
export function registerSessions(scena: Scena): Disposable {
  return combineDisposables(
    scena.store.registerDataProvider(ahpProvider),

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

    scena.commands.register({
      id: 'ahp.openSession',
      title: 'Open session',
      run: (ctx, args) => {
        const resource = (args as OpenSessionArgs | undefined)?.resource;
        if (resource === undefined) return;
        ctx.store.set(ACTIVE_SESSION, resource);
        const title = ctx.store.get<SessionSummary[]>(AHP_SESSIONS)?.find((one) => one.resource === resource)?.title;
        ctx.surfaces.open({
          surface: 'main',
          key: `session:${resource}`,
          resource: { component: 'SessionPage', resource },
          props: { title: title === undefined || title === '' ? 'Untitled' : title },
        });
        const modus = ctx.store.get<ModusClass>(MODUS_CLASS) ?? 'large';
        if (isOverlaid(resolveSurfacePresentation('sidebar:left', modus, PRESENTATION))) {
          const current = ctx.scena.layout.get().surfaces['sidebar:left'];
          ctx.scena.layout.setSurface('sidebar:left', { ...current, visible: false });
        }
      },
    }),

    scena.surfaces.mount({
      surface: 'activitybar',
      key: 'sessions:nav',
      resource: { component: 'ActivityBarItem', icon: 'S', label: 'Sessions', section: SESSIONS_SECTION },
    }),
    scena.surfaces.mount({
      surface: 'sidebar:left',
      key: 'sessions:explorer',
      when: `$/layout/surfaces/sidebar:left/section == "${SESSIONS_SECTION}"`,
      resource: { component: 'SessionExplorer' },
    }),
  );
}
