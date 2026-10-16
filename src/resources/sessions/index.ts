import { registerComposerCommands } from './composer-commands.js';
import { watchSessions } from './alerts.js';
import type { BindingPath, Disposable, ListSpec, Scena } from '@softov/scena/types';
import { combineDisposables, isOverlaid, resolveSurfacePresentation, translate, type ModusClass } from '@softov/scena';
import { bound, english } from '../../i18n/locales.js';
import { PRESENTATION } from '../../shell/presentation.js';
import type { SessionSummary } from '@microsoft/agent-host-protocol';
import { hostBridge, titlePath, windowHost } from '../../bridges/data.js';
import { HOST_FILTER_ACTION, shownHosts } from '../../bridges/hosts.js';
import { embedMode } from '../../shell/embed/index.js';
import { ACTIVE_SESSION, SESSIONS_ARCHIVED, SESSIONS_GROUPING, SESSIONS_RELOADING, SESSIONS_SHOW, SESSIONS_SORTED, SESSIONS_SORTING, SESSIONS_THEN_BY, type ActiveSession } from './state.js';
import { SESSION_SHOWS } from './status.js';
import { registerChoice } from '../../shell/explorer/choice.js';
import { DEFAULT_SORTING, isDefaultSorting, readSorting, SORT_BYS, writeSorting, type Sorting } from './sorting.js';
import { readPins, SESSIONS_PINS } from './pins.js';
import { GROUPINGS, groupingLabel, readGrouping, readThenBy, writeGrouping, writeThenBy, type Grouping } from './grouping.js';
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
  /** The session's host; the window's host by default. */
  host?: string;
}

/** The groupings, one command each: the header's Group menu and the palette's list; the current one is ticked. */
const GROUPING_SLOT = 'sessions:grouping';

/** The orders, one command each, in the header's Sort menu. */
const SORTING_SLOT = 'sessions:sorting';
/** The menu of the list's Show button: every session, unread, read, or at work. */
const SHOW_SLOT = 'sessions:show';

/** The groupings as a palette list. */
function groupingList(): ListSpec {
  return { title: translate('sessions/explorer/group'), query: { slot: GROUPING_SLOT } };
}

/** The sessions list and the session page. */
export function registerSessions(scena: Scena): Disposable {
  const grouping = readGrouping();
  scena.store.set(SESSIONS_GROUPING, grouping === 'none' ? null : grouping);
  const thenBy = readThenBy();
  scena.store.set(SESSIONS_THEN_BY, thenBy === 'none' ? null : thenBy);
  const sorting = readSorting();
  scena.store.set(SESSIONS_SORTING, sorting);
  scena.store.set(SESSIONS_SORTED, !isDefaultSorting(sorting));
  scena.store.set(SESSIONS_PINS, readPins());
  const sortBy = (change: Partial<Sorting>): void => {
    const next = { ...(scena.store.get<Sorting>(SESSIONS_SORTING) ?? DEFAULT_SORTING), ...change };
    scena.store.set(SESSIONS_SORTING, next);
    scena.store.set(SESSIONS_SORTED, !isDefaultSorting(next));
    writeSorting(next);
  };
  const sortingNow = (): Sorting => scena.store.get<Sorting>(SESSIONS_SORTING) ?? DEFAULT_SORTING;
  return combineDisposables(
    registerChoice(scena, { resource: 'sessions', name: 'show', slot: SHOW_SLOT, path: SESSIONS_SHOW, values: SESSION_SHOWS, usual: 'all', key: 'ahpd-web.session-show' }),
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
          { command: 'sessions.show', menu: SHOW_SLOT, icon: EMOJIcon.filter, label: { t: 'sessions/explorer/show' }, active: `${SESSIONS_SHOW} != null` },
          { command: 'sessions.toggleArchived', icon: EMOJIcon.archived, label: { t: 'sessions/explorer/showArchived' }, active: `${SESSIONS_ARCHIVED} == true` },
          { command: 'sessions.group', menu: GROUPING_SLOT, icon: EMOJIcon.group, label: { t: 'sessions/explorer/group' }, active: `${SESSIONS_GROUPING} != null` },
          { command: 'sessions.sort', menu: SORTING_SLOT, icon: EMOJIcon.sort, label: { t: 'sessions/explorer/sort' }, active: `${SESSIONS_SORTED} == true` },
          HOST_FILTER_ACTION,
        ],
      },
    }),
    scena.commands.register({
      id: 'sessions.reload',
      title: () => translate('sessions/explorer/reload'),
      run: async (ctx) => {
        ctx.store.set(SESSIONS_RELOADING, true);
        try {
          await Promise.all(shownHosts(ctx.store).map((host) => hostBridge(host).reloadSessions()));
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
        if (ctx.host !== undefined) ctx.host.pushList(groupingList());
        else openPalette(ctx.scena, groupingList());
      },
    }),
    ...GROUPINGS.map((one) => scena.commands.register({
      id: `sessions.groupBy.${one}`,
      title: () => groupingLabel(one),
      category: translate('sessions/explorer/groupBy'),
      slots: [GROUPING_SLOT],
      // Every session is on the one host in mono, so grouping by host is offered with every host only.
      ...(one === 'host' ? { when: () => embedMode() === 'multi' } : {}),
      active: (ctx) => (ctx.store.get<Grouping | null>(SESSIONS_GROUPING) ?? 'none') === one,
      run: (ctx) => {
        ctx.store.set(SESSIONS_GROUPING, one === 'none' ? null : one);
        writeGrouping(one);
      },
    })),
    // Then by: the second key, offered while the list is grouped, never the first key again.
    ...GROUPINGS.map((one) => scena.commands.register({
      id: `sessions.thenBy.${one}`,
      title: () => (one === 'none' ? translate('sessions/grouping/thenNone') : groupingLabel(one)),
      category: translate('sessions/explorer/thenBy'),
      slots: [GROUPING_SLOT],
      when: () => {
        const first = scena.store.get<Grouping | null>(SESSIONS_GROUPING) ?? 'none';
        return first !== 'none' && first !== one && (one !== 'host' || embedMode() === 'multi');
      },
      active: (ctx) => (ctx.store.get<Grouping | null>(SESSIONS_THEN_BY) ?? 'none') === one,
      run: (ctx) => {
        ctx.store.set(SESSIONS_THEN_BY, one === 'none' ? null : one);
        writeThenBy(one);
      },
    })),
    scena.commands.register({
      id: 'sessions.sort',
      title: () => translate('sessions/explorer/sort'),
      run: (ctx) => {
        const list: ListSpec = { title: translate('sessions/explorer/sort'), query: { slot: SORTING_SLOT } };
        if (ctx.host !== undefined) ctx.host.pushList(list);
        else openPalette(ctx.scena, list);
      },
    }),
    ...SORT_BYS.map((one) => scena.commands.register({
      id: `sessions.sortBy.${one}`,
      title: () => translate(`sessions/sorting/${one}`),
      category: translate('sessions/explorer/sortBy'),
      slots: [SORTING_SLOT],
      active: () => sortingNow().by === one,
      run: () => sortBy({ by: one }),
    })),
    ...([true, false] as const).map((newest) => scena.commands.register({
      id: `sessions.sortOrder.${newest ? 'newest' : 'oldest'}`,
      title: () => translate(newest ? 'sessions/sorting/newest' : 'sessions/sorting/oldest'),
      category: translate('sessions/explorer/order'),
      slots: [SORTING_SLOT],
      // A name sorts A to Z; the order is for the dates.
      when: () => sortingNow().by !== 'name',
      active: () => sortingNow().newest === newest,
      run: () => sortBy({ newest }),
    })),
    scena.commands.register({
      id: 'sessions.sortUrgent',
      title: () => translate('sessions/sorting/urgent'),
      category: translate('sessions/explorer/flags'),
      slots: [SORTING_SLOT],
      active: () => sortingNow().urgent,
      run: () => sortBy({ urgent: !sortingNow().urgent }),
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
      // A browser keeps Ctrl+N for a new window, so Alt+N is there too.
      keys: ['ctrl+n', 'alt+n'],
      run: (ctx, args) => {
        const { provider, host } = (args as { provider?: string; host?: string } | undefined) ?? {};
        // A page already open keeps its own choices, so one asked for an agent or a host starts afresh.
        if (provider !== undefined || host !== undefined) ctx.scena.surfaces.close('session:new');
        ctx.surfaces.open({ surface: 'main', key: 'session:new', resource: { component: 'NewSessionPage', ...(provider === undefined ? {} : { provider }), ...(host === undefined ? {} : { host }) }, props: { title: bound('sessions/commands/newSession') } });
        hideOverlaidSidebar(ctx.scena, ctx.store.get<ModusClass>(MODUS_CLASS) ?? 'large');
      },
    }),
    scena.commands.register({
      id: 'ahp.openSession',
      title: () => translate('sessions/commands/openSession'),
      run: (ctx, args) => {
        const target = args as OpenSessionArgs | undefined;
        if (target?.resource === undefined) return;
        const { resource, host = windowHost() } = target;
        ctx.store.set(ACTIVE_SESSION, { host, resource } satisfies ActiveSession);
        ctx.surfaces.open({
          surface: 'main',
          key: `session:${host}:${resource}`,
          resource: { component: 'SessionPage', host, resource },
          props: { title: { path: titlePath(host, resource) } },
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
