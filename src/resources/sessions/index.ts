import { registerComposerCommands } from './composer-commands.js';
import { watchSessions } from './alerts.js';
import type { BindingPath, Disposable, Scena } from '@softov/scena/types';
import { combineDisposables, isOverlaid, resolveSurfacePresentation, translate, type ModusClass } from '@softov/scena';
import { bound, english } from '../../i18n/locales.js';
import { PRESENTATION } from '../../shell/presentation.js';
import type { SessionSummary } from '@microsoft/agent-host-protocol';
import { AHP_SESSIONS, titlePath } from '../../bridges/data.js';
import { ACTIVE_SESSION } from './state.js';
import { PALETTE_SLOT } from '../../shell/CommandPalette.js';
import { EMOJIcon } from '../emojis.js';
import { mountRight } from '../../shell/right-sidebar.js';

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
    watchSessions(scena),
    scena.components.register({
      component: 'SessionExplorer',
      category: 'page',
      renderer: { kind: 'react', load: () => import('./Explorer.js') },
    }),
    scena.components.register({
      component: 'SessionPage',
      category: 'page',
      props: { icon: EMOJIcon.sessions },
      renderer: { kind: 'react', load: () => import('./Page.js') },
    }),

    scena.components.register({
      component: 'NewSessionPage',
      category: 'page',
      props: { icon: EMOJIcon.sessions },
      renderer: { kind: 'react', load: () => import('./New.js') },
    }),
    scena.components.register({
      component: 'StartPage',
      category: 'page',
      renderer: { kind: 'react', load: () => import('./Start.js') },
    }),
    // Nothing open in main: the start page, not an empty area.
    scena.surfaces.setEmpty('main', { component: 'StartPage' }),
    scena.components.register({
      component: 'SessionDetails',
      category: 'page',
      renderer: { kind: 'react', load: () => import('./Details.js') },
    }),
    scena.commands.register({
      id: 'ahp.showSessions',
      title: () => translate('sessions/commands/showSessions'),
      keywords: [english('sessions/commands/showSessions')],
      category: 'Sessions',
      slots: [PALETTE_SLOT],
      run: (ctx) => ctx.commands.execute('sidebar.activate', { section: SESSIONS_SECTION }),
    }),
    scena.commands.register({
      id: 'ahp.newSession',
      title: () => translate('sessions/commands/newSession'),
      keywords: [english('sessions/commands/newSession')],
      category: 'Sessions',
      slots: [PALETTE_SLOT],
      run: (ctx, args) => {
        // A page already open keeps its own choices, so one asked for an agent starts afresh.
        const provider = (args as { provider?: string } | undefined)?.provider;
        if (provider !== undefined) ctx.scena.surfaces.close('session:new');
        ctx.surfaces.open({ surface: 'main', key: 'session:new', resource: { component: 'NewSessionPage', ...(provider === undefined ? {} : { provider }) }, props: { title: bound('sessions/commands/newSession') } });
        hideOverlaidSidebar(ctx.scena, ctx.store.get<ModusClass>(MODUS_CLASS) ?? 'large');
      },
    }),
    scena.commands.register({
      id: 'ahp.openSession',
      title: () => translate('sessions/commands/openSession'),
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

    // mountRight takes the title as text, so the tab is named in the language the page opened in.
    mountRight(scena, { key: 'session:details', resource: { component: 'SessionDetails' }, props: { title: { t: 'sessions/details/tab' } } }, EMOJIcon.info),
    scena.surfaces.mount({
      surface: 'sidebar:left',
      key: 'sessions:explorer',
      when: `$/layout/surfaces/sidebar:left/section == "${SESSIONS_SECTION}"`,
      resource: { component: 'SessionExplorer' },
    }),
  );
}
