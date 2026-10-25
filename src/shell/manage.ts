import { combineDisposables, translate } from '@softov/scena';
import type { Disposable, Scena } from '@softov/scena/types';
import { ahpPaths } from '../bridges/data.js';
import { everyHost, HOST_LIST, hostNameOf } from '../bridges/hosts.js';
import { NO_OFFERS, type Offers } from '../bridges/offers.js';
import { selfId } from '../bridges/people.js';
import { english } from '../i18n/locales.js';
import { EMOJIcon } from '../resources/emojis.js';
import { openPalette } from './CommandPalette.js';
import { localeList, themeList } from './commands.js';
import { layoutMenu } from './layout-menu.js';

/** The commands the activity bar's Manage gear lists, in its menu's order. */
export const MANAGE_SLOT = 'ahp:manage';

/**
 * The Manage menu, as VS Code's gear: language, layout and theme open their
 * lists in the palette, then the host and settings, and the account group
 * parted below.
 */
export function registerManage(scena: Scena, embedded: boolean): Disposable {
  return combineDisposables(
    scena.commands.register({
      id: 'ahp.manage.language',
      title: () => translate('shell/manage/language'),
      keywords: [english('shell/manage/language')],
      icon: EMOJIcon.language,
      slots: [MANAGE_SLOT],
      run: (ctx) => {
        ctx.host?.closeMenu();
        openPalette(ctx.scena, localeList());
      },
    }),
    scena.commands.register({
      id: 'ahp.manage.layout',
      title: () => translate('shell/manage/layout'),
      keywords: [english('shell/manage/layout')],
      icon: EMOJIcon.layoutGroups,
      slots: [MANAGE_SLOT],
      run: (ctx) => {
        ctx.host?.closeMenu();
        openPalette(ctx.scena, layoutMenu(ctx.scena));
      },
    }),
    scena.commands.register({
      id: 'ahp.manage.theme',
      title: () => translate('shell/manage/theme'),
      keywords: [english('shell/manage/theme')],
      icon: EMOJIcon.theme,
      slots: [MANAGE_SLOT],
      run: (ctx) => {
        ctx.host?.closeMenu();
        openPalette(ctx.scena, themeList(ctx.scena));
      },
    }),
    scena.commands.register({
      id: 'ahp.manage.host',
      title: () => translate('shell/nav/host'),
      keywords: [english('shell/nav/host')],
      icon: EMOJIcon.host,
      slots: [MANAGE_SLOT],
      run: (ctx) => {
        ctx.host?.closeMenu();
        void ctx.scena.commands.execute('ahp.openHostInfo');
      },
    }),
    scena.commands.register({
      id: 'ahp.manage.settings',
      title: () => translate('shell/manage/settings'),
      keywords: [english('shell/manage/settings')],
      icon: EMOJIcon.settings,
      slots: [MANAGE_SLOT],
      run: (ctx) => {
        ctx.host?.closeMenu();
        void ctx.scena.commands.execute('ahp.openSettings');
      },
    }),
    accountGroup(scena, embedded),
  );
}

/** How a host's profile entry reads: the person's id, and the host's name beside it when there are several. */
export function profileEntryTitle(id: string, hostName: string, hosts: number): string {
  return hosts > 1 ? `${id} \u{00B7} ${hostName}` : id;
}

/**
 * The account group, parted from the rest with a line: the person on each
 * host they are signed in to as a person, then Sign out. The menu lists in
 * registration order, so the group is registered again whenever the hosts
 * change, and a host added later still lands above Sign out.
 */
function accountGroup(scena: Scena, embedded: boolean): Disposable {
  const offersOf = (host: string): Offers => scena.store.get<Offers>(ahpPaths(host).offers) ?? NO_OFFERS;
  const register = (): Disposable => combineDisposables(
    ...everyHost(scena.store).map((host) => scena.commands.register({
      id: `ahp.manage.profile.${host}`,
      title: () => profileEntryTitle(selfId(offersOf(host)) ?? '', hostNameOf(scena.store, host), everyHost(scena.store).length),
      keywords: [english('profile/title')],
      icon: EMOJIcon.users,
      category: 'account',
      slots: [MANAGE_SLOT],
      // Read when the menu lists, so it follows the host's handshake.
      when: () => selfId(offersOf(host)) !== undefined,
      run: (ctx) => {
        ctx.host?.closeMenu();
        void ctx.scena.commands.execute('ahp.openProfile', { host });
      },
    })),
    // Left out in an embedder, which holds the token.
    ...(embedded ? [] : [scena.commands.register({
      id: 'ahp.manage.signOut',
      title: () => translate('shell/manage/signOut'),
      keywords: [english('shell/manage/signOut')],
      icon: EMOJIcon.signOut,
      category: 'account',
      slots: [MANAGE_SLOT],
      run: (ctx) => {
        ctx.host?.closeMenu();
        void ctx.scena.commands.execute('sigillum.signout');
      },
    })]),
  );
  let held = register();
  const watching = scena.store.subscribe(HOST_LIST, () => {
    held.dispose();
    held = register();
  });
  return {
    dispose: () => {
      watching.dispose();
      held.dispose();
    },
  };
}
