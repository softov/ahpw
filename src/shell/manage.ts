import { combineDisposables, translate } from '@softov/scena';
import type { Disposable, Scena } from '@softov/scena/types';
import { english } from '../i18n/locales.js';
import { EMOJIcon } from '../resources/emojis.js';
import { openPalette } from './CommandPalette.js';
import { localeList, themeList } from './commands.js';
import { layoutMenu } from './layout-menu.js';

/** The commands the activity bar's Manage gear lists, in its menu's order. */
export const MANAGE_SLOT = 'ahp:manage';

/**
 * The Manage menu, as VS Code's gear: language, layout and theme open their
 * lists in the palette, then settings, and sign out parted below. Sign out is
 * left out in an embedder, which holds the token.
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
    ...(embedded
      ? []
      : [
          scena.commands.register({
            id: 'ahp.manage.signOut',
            title: () => translate('shell/manage/signOut'),
            keywords: [english('shell/manage/signOut')],
      icon: EMOJIcon.signOut,
            // Its own category: the menu parts it from the rest with a line.
            category: 'account',
            slots: [MANAGE_SLOT],
            run: (ctx) => {
              ctx.host?.closeMenu();
              void ctx.scena.commands.execute('sigillum.signout');
            },
          }),
        ]),
  );
}
