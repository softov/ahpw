import { combineDisposables, getLocale, listLocaleInfo, setLocale, translate } from '@softov/scena';
import type { Disposable, HostCtx, ListSpec, PickerAction, Scena, SurfaceName } from '@softov/scena/types';
import { THEME_ID_PATH, listThemes } from '@softov/scena/styles';
import { english } from '../i18n/locales.js';
import { PALETTE_SLOT, openPalette } from './CommandPalette.js';

function toggle(scena: Scena, surface: SurfaceName): void {
  const current = scena.layout.get().surfaces[surface];
  scena.layout.setSurface(surface, { ...current, visible: !(current?.visible ?? true) });
}


/** Opens `list` as a sub-list when run from the palette, else opens the palette on it. */
function subList(scena: Scena, host: HostCtx | undefined, list: ListSpec): void {
  if (host !== undefined) host.pushList(list);
  else openPalette(scena, list);
}

/** Every registered language, the chosen one ticked. */
export function localeList(): ListSpec {
  const current = getLocale();
  return {
    title: translate('shell/commands/selectLocale'),
    items: listLocaleInfo().map((info): PickerAction => ({
      title: info.name ?? info.locale,
      description: info.locale,
      active: info.locale === current,
      onSelect: (host) => {
        setLocale(info.locale);
        host.closeMenu();
      },
    })),
  };
}

/** Every registered theme, the chosen one ticked; light or dark stays the title bar's toggle. */
export function themeList(scena: Scena): ListSpec {
  const current = scena.store.get<string>(THEME_ID_PATH) ?? 'default';
  return {
    title: translate('shell/commands/selectTheme'),
    items: listThemes().map((theme): PickerAction => ({
      title: theme.label,
      active: theme.id === current,
      onSelect: (host) => {
        scena.store.set(THEME_ID_PATH, theme.id);
        host.closeMenu();
      },
    })),
  };
}

// Ported from web-next's shell/commands.ts: the palette itself, the layout of
// the window, the main area's layout and the language. Titles are functions so
// the palette shows them in the chosen language.
export function registerShellCommands(scena: Scena): Disposable {
  return combineDisposables(
    scena.commands.register({
      id: 'sidebar.activate',
      title: () => translate('shell/commands/activateSection'),
      keywords: [english('shell/commands/activateSection')],
      run: (ctx, args) => {
        const section = (args as { section?: string } | undefined)?.section;
        if (!section) return;
        const current = ctx.scena.layout.get().surfaces['sidebar:left'];
        ctx.scena.layout.setSurface('sidebar:left', { ...current, section, visible: true });
      },
    }),
    scena.commands.register({
      id: 'ahp.palette',
      title: () => translate('shell/commands/palette'),
      keywords: [english('shell/commands/palette')],
      keys: 'ctrl+p',
      run: (ctx) => openPalette(ctx.scena),
    }),
    scena.commands.register({
      id: 'workbench.showCommands',
      title: () => translate('shell/commands/showCommands'),
      keywords: [english('shell/commands/showCommands')],
      keys: 'ctrl+shift+p',
      run: (ctx) => openPalette(ctx.scena),
    }),

    scena.commands.register({
      id: 'sidebar.toggleLeft',
      title: () => translate('shell/commands/toggleLeft'),
      keywords: [english('shell/commands/toggleLeft')],
      category: 'View',
      slots: [PALETTE_SLOT],
      keys: 'ctrl+b',
      run: (ctx) => toggle(ctx.scena, 'sidebar:left'),
    }),
    scena.commands.register({
      id: 'sidebar.toggleRight',
      title: () => translate('shell/commands/toggleRight'),
      keywords: [english('shell/commands/toggleRight')],
      category: 'View',
      slots: [PALETTE_SLOT],
      keys: 'ctrl+alt+b',
      run: (ctx) => toggle(ctx.scena, 'sidebar:right'),
    }),
    scena.commands.register({
      id: 'view.toggleActivityBar',
      title: () => translate('shell/commands/toggleActivityBar'),
      keywords: [english('shell/commands/toggleActivityBar')],
      category: 'View',
      slots: [PALETTE_SLOT],
      run: (ctx) => toggle(ctx.scena, 'activitybar'),
    }),
    scena.commands.register({
      id: 'view.toggleStatusBar',
      title: () => translate('shell/commands/toggleStatusBar'),
      keywords: [english('shell/commands/toggleStatusBar')],
      category: 'View',
      slots: [PALETTE_SLOT],
      run: (ctx) => toggle(ctx.scena, 'statusbar'),
    }),
    scena.commands.register({
      id: 'view.toggleTitleBar',
      title: () => translate('shell/commands/toggleTitleBar'),
      keywords: [english('shell/commands/toggleTitleBar')],
      category: 'View',
      slots: [PALETTE_SLOT],
      run: (ctx) => toggle(ctx.scena, 'titlebar'),
    }),

    // The language, as a sub-list of every registered locale.
    scena.commands.register({
      id: 'workbench.selectLocale',
      title: () => translate('shell/commands/selectLocale'),
      keywords: [english('shell/commands/selectLocale'), 'language', 'locale'],
      category: 'View',
      slots: [PALETTE_SLOT],
      run: (ctx) => subList(ctx.scena, ctx.host, localeList()),
    }),
    // The theme, as a sub-list of every registered one.
    scena.commands.register({
      id: 'workbench.selectTheme',
      title: () => translate('shell/commands/selectTheme'),
      keywords: [english('shell/commands/selectTheme'), 'theme', 'color'],
      category: 'View',
      slots: [PALETTE_SLOT],
      run: (ctx) => subList(ctx.scena, ctx.host, themeList(ctx.scena)),
    }),
  );
}
