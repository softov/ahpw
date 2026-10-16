import { registerComposerCommands } from './composer-commands.js';
import { watchSessions } from './alerts.js';
import type { BindingPath, Disposable, ListSpec, PickerAction, Scena } from '@softov/scena/types';
import { combineDisposables, isOverlaid, resolveSurfacePresentation, translate, type ModusClass } from '@softov/scena';
import { bound, english } from '../../i18n/locales.js';
import { PRESENTATION } from '../../shell/presentation.js';
import type { SessionSummary } from '@microsoft/agent-host-protocol';
import { AHP_SESSIONS, reloadSessions, titlePath } from '../../bridges/data.js';
import { ACTIVE_SESSION, SESSIONS_ARCHIVED, SESSIONS_GROUPING, SESSIONS_RELOADING } from './state.js';
import { GROUPINGS, groupingLabel, readGrouping, writeGrouping, type Grouping } from './grouping.js';
import { PALETTE_SLOT, openPalette } from '../../shell/CommandPalette.js';
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

/** The groupings, as a list the palette shows; the current one is ticked. */
function groupingList(scena: Scena): ListSpec {
  const current = scena.store.get<Grouping | null>(SESSIONS_GROUPING) ?? 'none';
  return {
    title: translate('sessions/explorer/group'),
    items: GROUPINGS.map((one): PickerAction => ({
      title: groupingLabel(one),
      active: one === current,
      onSelect: (host) => {
        scena.store.set(SESSIONS_GROUPING, one === 'none' ? null : one);
        writeGrouping(one);
        host.closeMenu();
      },
    })),
  };
}

/** The sessions list and the session page. */
export function registerSessions(scena: Scena): Disposable {
  const grouping = readGrouping();
  scena.store.set(SESSIONS_GROUPING, grouping === 'none' ? null : grouping);
  return combineDisposables(
    registerComposerCommands(scena),
    watchSessions(scena),
    scena.components.register({
      component: 'SessionExplorer',
      category: 'page',
      renderer: { kind: 'react', load: () => import('./Explorer.js') },
      // scena draws the section's header from these.
      props: {
        title: { t: 'sessions/explorer/title' },
        actions: [
          { command: 'ahp.newSession', icon: '+', label: { t: 'sessions/commands/newSession' } },
          { command: 'sessions.reload', icon: EMOJIcon.reload, label: { t: 'sessions/explorer/reload' }, busy: `${SESSIONS_RELOADING} == true` },
          { command: 'sessions.toggleArchived', icon: EMOJIcon.archived, label: { t: 'sessions/explorer/showArchived' }, active: `${SESSIONS_ARCHIVED} == true` },
          { command: 'sessions.group', icon: EMOJIcon.group, label: { t: 'sessions/explorer/group' }, active: `${SESSIONS_GROUPING} != null` },
        ],
      },
    }),
    scena.commands.register({
      id: 'sessions.reload',
      title: () => translate('sessions/explorer/reload'),
      run: async (ctx) => {
        ctx.store.set(SESSIONS_RELOADING, true);
        try {
          await reloadSessions();
        } catch {
          // The connection reports its own failure; the list stays as it was.
        } finally {
          ctx.store.set(SESSIONS_RELOADING, false);
        }
      },
    }),
    scena.commands.register({
      id: 'sessions.toggleArchived',
      title: () => translate(scena.store.get<boolean>(SESSIONS_ARCHIVED) === true ? 'sessions/explorer/hideArchived' : 'sessions/explorer/showArchived'),
      run: (ctx) => ctx.store.set(SESSIONS_ARCHIVED, ctx.store.get<boolean>(SESSIONS_ARCHIVED) !== true),
    }),
    scena.commands.register({
      id: 'sessions.group',
      title: () => translate('sessions/explorer/group'),
      run: (ctx) => {
        if (ctx.host !== undefined) ctx.host.pushList(groupingList(ctx.scena));
        else openPalette(ctx.scena, groupingList(ctx.scena));
      },
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
