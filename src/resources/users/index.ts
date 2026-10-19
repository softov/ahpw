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
import { ACTIVE_PERSON, personTab, USERS_SERVED } from './state.js';

/** The display size class the modus backend publishes. */
const MODUS_CLASS = '$/modus/class' as BindingPath;

/** The sidebar section the users and roles list shows in. */
export const USERS_SECTION = 'ahp:users';

/** Arguments of the commands about one user or role; no `id` is a new one. */
export interface PersonArgs {
  host?: string;
  id?: string;
}

/** The header's + menu: a new user or a new role. */
const NEW_SLOT = 'users:new';

type Kind = 'users' | 'roles';
const PAGE: Record<Kind, string> = { users: 'UserPage', roles: 'RolePage' };

/** The users and roles list, and a page that shows and edits each. */
export function registerUsers(scena: Scena): Disposable {
  type Opened = Parameters<Scena['surfaces']['open']>[0];
  const open = (key: string, resource: Opened['resource'], title: NonNullable<NonNullable<Opened['props']>['title']>): void => {
    scena.surfaces.open({ surface: 'main', key, resource, props: { title } });
    hideOverlaidSidebar(scena, scena.store.get<ModusClass>(MODUS_CLASS) ?? 'large');
  };
  const offersOf = (host: string): Offers => scena.store.get<Offers>(ahpPaths(host).offers) ?? NO_OFFERS;
  const servingHosts = (): string[] => shownHosts(scena.store).filter((host) => servesPeople(offersOf(host), 'users'));

  const opener = (kind: Kind) => (_ctx: unknown, args: unknown): void => {
    const target = (args ?? {}) as PersonArgs;
    const host = target.host ?? startHost(servingHosts(), readLastHost());
    if (host === undefined) return;
    if (target.id !== undefined) scena.store.set(ACTIVE_PERSON, { host, domain: kind, id: target.id });
    const title = target.id ?? bound(kind === 'users' ? 'users/commands/newUser' : 'users/commands/newRole');
    // `person`, not `id`: the page's record id, which scena's own `id` would shadow.
    open(personTab(kind, host, target.id), { component: PAGE[kind], host, ...(target.id === undefined ? {} : { person: target.id }) }, title);
  };
  const deleter = (kind: Kind) => async (_ctx: unknown, args: unknown): Promise<void> => {
    const target = (args ?? {}) as PersonArgs;
    if (target.host === undefined || target.id === undefined) return;
    const word = kind === 'users' ? 'user' : 'role';
    if (!(await confirm({
      title: translate(`users/${word}/deleteTitle`, { id: target.id }),
      body: translate(`users/${word}/deleteBody`),
      confirmLabel: translate('users/actions/delete'),
      tone: 'danger',
    }))) return;
    await removePerson(target.host, offersOf(target.host), kind, target.id).then(
      () => scena.surfaces.close(personTab(kind, target.host!, target.id)),
      (error: unknown) => failed(translate('users/actions/failed'), error),
    );
  };

  return combineDisposables(
    trackServed(scena, channelScheme('users'), USERS_SERVED),
    scena.components.register({
      component: 'UsersExplorer',
      category: 'page',
      renderer: { kind: 'react', load: () => import('./Explorer.js') },
      props: {
        title: { t: 'users/explorer/title' },
        actions: [
          { command: 'users.new', menu: NEW_SLOT, icon: '+', label: { t: 'users/commands/new' } },
          { command: 'users.reload', icon: EMOJIcon.reload, label: { t: 'common/reload' } },
          HOST_FILTER_ACTION,
        ],
      },
    }),
    scena.components.register({ component: 'UserPage', category: 'page', props: { icon: EMOJIcon.users }, renderer: { kind: 'react', load: () => import('./UserPage.js') } }),
    scena.components.register({ component: 'RolePage', category: 'page', props: { icon: EMOJIcon.roles }, renderer: { kind: 'react', load: () => import('./RolePage.js') } }),
    scena.commands.register({
      id: 'users.new',
      title: () => translate('users/commands/new'),
      run: (ctx) => {
        const list: ListSpec = { title: translate('users/commands/new'), query: { slot: NEW_SLOT } };
        if (ctx.host !== undefined) ctx.host.pushList(list);
        else openPalette(ctx.scena, list);
      },
    }),
    // The + menu's two rows; no category, so the menu has no heading over them.
    scena.commands.register({ id: 'users.new.user', title: () => translate('users/commands/newUser'), slots: [NEW_SLOT], run: (ctx) => ctx.commands.execute('ahp.newUser') }),
    scena.commands.register({ id: 'users.new.role', title: () => translate('users/commands/newRole'), slots: [NEW_SLOT], run: (ctx) => ctx.commands.execute('ahp.newRole') }),
    scena.commands.register({
      id: 'ahp.newUser',
      title: () => translate('users/commands/newUser'),
      keywords: [english('users/commands/newUser')],
      category: 'Users',
      slots: [PALETTE_SLOT],
      when: () => scena.store.get<boolean>(USERS_SERVED) === true,
      run: (ctx, args) => opener('users')(ctx, { host: (args as PersonArgs | undefined)?.host }),
    }),
    scena.commands.register({
      id: 'ahp.newRole',
      title: () => translate('users/commands/newRole'),
      keywords: [english('users/commands/newRole')],
      category: 'Users',
      slots: [PALETTE_SLOT],
      when: () => scena.store.get<boolean>(USERS_SERVED) === true,
      run: (ctx, args) => opener('roles')(ctx, { host: (args as PersonArgs | undefined)?.host }),
    }),
    scena.commands.register({
      id: 'users.reload',
      title: () => translate('common/reload'),
      run: () => Promise.all(servingHosts().flatMap((host) => [
        hostBridge(host).refresh(PEOPLE.users.channel),
        hostBridge(host).refresh(PEOPLE.roles.channel),
      ])),
    }),
    scena.commands.register({
      id: 'ahp.showUsers',
      title: () => translate('users/commands/show'),
      keywords: [english('users/commands/show')],
      category: 'Users',
      slots: [PALETTE_SLOT],
      when: () => scena.store.get<boolean>(USERS_SERVED) === true,
      run: (ctx) => ctx.commands.execute('sidebar.activate', { section: USERS_SECTION }),
    }),
    scena.commands.register({ id: 'ahp.openUser', title: () => translate('users/commands/openUser'), run: opener('users') }),
    scena.commands.register({ id: 'ahp.openRole', title: () => translate('users/commands/openRole'), run: opener('roles') }),
    scena.commands.register({ id: 'ahp.deleteUser', title: () => translate('users/actions/delete'), run: deleter('users') }),
    scena.commands.register({ id: 'ahp.deleteRole', title: () => translate('users/actions/delete'), run: deleter('roles') }),
    scena.surfaces.mount({
      surface: 'sidebar:left',
      key: 'users:explorer',
      when: `$/layout/surfaces/sidebar:left/section == "${USERS_SECTION}"`,
      resource: { component: 'UsersExplorer' },
    }),
  );
}
