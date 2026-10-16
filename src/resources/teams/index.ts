import type { BindingPath, Disposable, ListSpec, Scena } from '@softov/scena/types';
import { combineDisposables, translate, type ModusClass } from '@softov/scena';
import { openPalette, PALETTE_SLOT } from '../../shell/CommandPalette.js';
import { hideOverlaidSidebar } from '../sessions/index.js';
import { ahpPaths, hostBridge } from '../../bridges/data.js';
import { HOST_FILTER_ACTION, shownHosts } from '../../bridges/hosts.js';
import { NO_OFFERS, type Offers } from '../../bridges/offers.js';
import { channelScheme, PEOPLE, removePerson, servesPeople } from '../../bridges/people.js';
import { trackServed } from '../../bridges/served.js';
import { confirm, failed } from '../../shell/notify/index.js';
import { readLastHost, startHost } from '../sessions/last-host.js';
import { EMOJIcon } from '../emojis.js';
import { bound, english } from '../../i18n/locales.js';
import { ACTIVE_TEAM, teamTab, TEAMS_SERVED } from './state.js';

/** The display size class the modus backend publishes. */
const MODUS_CLASS = '$/modus/class' as BindingPath;

/** The sidebar section the teams and projects list shows in. */
export const TEAMS_SECTION = 'ahp:teams';

/** The header's + menu: a new team or a new project. */
const NEW_SLOT = 'teams:new';

type Kind = 'teams' | 'projects';

/** Arguments of the commands about one team or project; no `id` is a new one. */
interface NamedArgs {
  host?: string;
  id?: string;
}

/** The teams and projects list, and a page that shows, edits and staffs each. */
export function registerTeams(scena: Scena): Disposable {
  type Opened = Parameters<Scena['surfaces']['open']>[0];
  const open = (key: string, resource: Opened['resource'], title: NonNullable<NonNullable<Opened['props']>['title']>): void => {
    scena.surfaces.open({ surface: 'main', key, resource, props: { title } });
    hideOverlaidSidebar(scena, scena.store.get<ModusClass>(MODUS_CLASS) ?? 'large');
  };
  const offersOf = (host: string): Offers => scena.store.get<Offers>(ahpPaths(host).offers) ?? NO_OFFERS;
  const servingHosts = (): string[] => shownHosts(scena.store).filter((host) => servesPeople(offersOf(host), 'teams'));

  const opener = (kind: Kind) => (_ctx: unknown, args: unknown): void => {
    const target = (args ?? {}) as NamedArgs;
    const host = target.host ?? startHost(servingHosts(), readLastHost());
    if (host === undefined) return;
    if (target.id !== undefined) scena.store.set(ACTIVE_TEAM, { host, domain: kind, id: target.id });
    const title = target.id ?? bound(kind === 'teams' ? 'teams/commands/newTeam' : 'teams/commands/newProject');
    // `person`, not `id`: the page's record id, which scena's own `id` would shadow.
    open(teamTab(kind, host, target.id), { component: 'NamedPage', host, domain: kind, ...(target.id === undefined ? {} : { person: target.id }) }, title);
  };
  const deleter = (kind: Kind) => async (_ctx: unknown, args: unknown): Promise<void> => {
    const target = (args ?? {}) as NamedArgs;
    if (target.host === undefined || target.id === undefined) return;
    const word = kind === 'teams' ? 'team' : 'project';
    if (!(await confirm({
      title: translate(`teams/${word}/deleteTitle`, { id: target.id }),
      body: translate(`teams/${word}/deleteBody`),
      confirmLabel: translate('teams/actions/delete'),
      tone: 'danger',
    }))) return;
    await removePerson(target.host, offersOf(target.host), kind, target.id).then(
      () => scena.surfaces.close(teamTab(kind, target.host!, target.id)),
      (error: unknown) => failed(translate('teams/actions/failed'), error),
    );
  };

  return combineDisposables(
    trackServed(scena, channelScheme('teams'), TEAMS_SERVED),
    scena.components.register({
      component: 'TeamsExplorer',
      category: 'page',
      renderer: { kind: 'react', load: () => import('./Explorer.js') },
      props: {
        title: { t: 'teams/explorer/title' },
        actions: [
          { command: 'teams.new', menu: NEW_SLOT, icon: '+', label: { t: 'teams/commands/new' } },
          { command: 'teams.reload', icon: EMOJIcon.reload, label: { t: 'common/reload' } },
          HOST_FILTER_ACTION,
        ],
      },
    }),
    scena.components.register({ component: 'NamedPage', category: 'page', props: { icon: EMOJIcon.teams }, renderer: { kind: 'react', load: () => import('./NamedPage.js') } }),
    scena.commands.register({
      id: 'teams.new',
      title: () => translate('teams/commands/new'),
      run: (ctx) => {
        const list: ListSpec = { title: translate('teams/commands/new'), query: { slot: NEW_SLOT } };
        if (ctx.host !== undefined) ctx.host.pushList(list);
        else openPalette(ctx.scena, list);
      },
    }),
    // The + menu's two rows; no category, so the menu has no heading over them.
    scena.commands.register({ id: 'teams.new.team', title: () => translate('teams/commands/newTeam'), slots: [NEW_SLOT], run: (ctx) => ctx.commands.execute('ahp.newTeam') }),
    scena.commands.register({ id: 'teams.new.project', title: () => translate('teams/commands/newProject'), slots: [NEW_SLOT], run: (ctx) => ctx.commands.execute('ahp.newProject') }),
    scena.commands.register({
      id: 'ahp.newTeam',
      title: () => translate('teams/commands/newTeam'),
      keywords: [english('teams/commands/newTeam')],
      category: 'Teams',
      slots: [PALETTE_SLOT],
      when: () => scena.store.get<boolean>(TEAMS_SERVED) === true,
      run: (ctx, args) => opener('teams')(ctx, { host: (args as NamedArgs | undefined)?.host }),
    }),
    scena.commands.register({
      id: 'ahp.newProject',
      title: () => translate('teams/commands/newProject'),
      keywords: [english('teams/commands/newProject')],
      category: 'Teams',
      slots: [PALETTE_SLOT],
      when: () => scena.store.get<boolean>(TEAMS_SERVED) === true,
      run: (ctx, args) => opener('projects')(ctx, { host: (args as NamedArgs | undefined)?.host }),
    }),
    scena.commands.register({
      id: 'teams.reload',
      title: () => translate('common/reload'),
      run: () => Promise.all(servingHosts().flatMap((host) => [
        hostBridge(host).refresh(PEOPLE.teams.channel),
        hostBridge(host).refresh(PEOPLE.projects.channel),
        hostBridge(host).refresh(PEOPLE.users.channel),
      ])),
    }),
    scena.commands.register({
      id: 'ahp.showTeams',
      title: () => translate('teams/commands/show'),
      keywords: [english('teams/commands/show')],
      category: 'Teams',
      slots: [PALETTE_SLOT],
      when: () => scena.store.get<boolean>(TEAMS_SERVED) === true,
      run: (ctx) => ctx.commands.execute('sidebar.activate', { section: TEAMS_SECTION }),
    }),
    scena.commands.register({ id: 'ahp.openTeam', title: () => translate('teams/commands/openTeam'), run: opener('teams') }),
    scena.commands.register({ id: 'ahp.openProject', title: () => translate('teams/commands/openProject'), run: opener('projects') }),
    scena.commands.register({ id: 'ahp.deleteTeam', title: () => translate('teams/actions/delete'), run: deleter('teams') }),
    scena.commands.register({ id: 'ahp.deleteProject', title: () => translate('teams/actions/delete'), run: deleter('projects') }),
    scena.surfaces.mount({
      surface: 'sidebar:left',
      key: 'teams:explorer',
      when: `$/layout/surfaces/sidebar:left/section == "${TEAMS_SECTION}"`,
      resource: { component: 'TeamsExplorer' },
    }),
  );
}
