import { combineDisposables, translate } from '@softov/scena';
import type { Disposable, HostCtx, ListSpec, PickerAction, Scena, SurfaceName } from '@softov/scena/types';
import { EMOJIcon } from '../resources/emojis.js';
import { english } from '../i18n/locales.js';
import { PALETTE_SLOT, openPalette } from './CommandPalette.js';
import { MAIN_LAYOUTS } from './view/layouts.js';

// Ported from scena's playground (packages/playground/src/layout-modes.ts):
// the main layouts, the modes and the zones, as one menu. The playground lists
// them by command category; here the menu is built when it opens, so its group
// names follow the language (ActionList prints a category as it is), and each
// choice rebuilds it, so the ticks follow what was chosen, as in VS Code.

interface LayoutMode {
  id: string;
  icon: string;
  keys: string;
  zones: Partial<Record<SurfaceName, boolean>>;
}

const MODES: LayoutMode[] = [
  { id: 'default', icon: '◰', keys: 'ctrl+k d', zones: { titlebar: true, activitybar: true, 'sidebar:left': true, 'sidebar:right': false, statusbar: true } },
  { id: 'focus', icon: '◉', keys: 'ctrl+k f', zones: { titlebar: true, activitybar: false, 'sidebar:left': false, 'sidebar:right': false, statusbar: false } },
  { id: 'zen', icon: '☯', keys: 'ctrl+k z', zones: { titlebar: false, activitybar: false, 'sidebar:left': false, 'sidebar:right': false, statusbar: false } },
  { id: 'wide', icon: '↔', keys: 'ctrl+k w', zones: { titlebar: true, activitybar: true, 'sidebar:left': false, 'sidebar:right': false, statusbar: true } },
  { id: 'split', icon: '⊟', keys: 'ctrl+k s', zones: { titlebar: true, activitybar: true, 'sidebar:left': true, 'sidebar:right': true, statusbar: true } },
];

/** Each zone, and the command that already toggles it where ahpw has one. */
const ZONES: Array<{ surface: SurfaceName; icon: string; command?: string; keys?: string }> = [
  { surface: 'titlebar', icon: '▔' },
  { surface: 'activitybar', icon: '☰' },
  { surface: 'sidebar:left', icon: EMOJIcon.panelLeft, command: 'sidebar.toggleLeft', keys: 'ctrl+b' },
  { surface: 'sidebar:right', icon: EMOJIcon.panelRight, command: 'sidebar.toggleRight', keys: 'ctrl+alt+b' },
  { surface: 'panel:bottom', icon: EMOJIcon.panelBottom, command: 'panel.toggle', keys: 'ctrl+j' },
  { surface: 'statusbar', icon: '▂' },
];

function visible(scena: Scena, surface: SurfaceName): boolean {
  return scena.layout.get().surfaces[surface]?.visible ?? false;
}

function applyMode(scena: Scena, mode: LayoutMode): void {
  for (const [surface, shown] of Object.entries(mode.zones) as Array<[SurfaceName, boolean]>) {
    scena.layout.setSurface(surface, { ...scena.layout.get().surfaces[surface], visible: shown });
  }
}

/** The menu as it stands now; a choice applies itself and draws the menu again. */
export function layoutMenu(scena: Scena): ListSpec {
  const again = (host: HostCtx): void => host.replaceList(layoutMenu(scena));
  const main = scena.layout.get().surfaces.main?.layout ?? 'tab';
  const views = MAIN_LAYOUTS.map((one): PickerAction => ({
    title: translate(`shell/layouts/${one.id}`),
    icon: one.icon,
    group: translate('shell/layout/view'),
    active: one.id === main,
    onSelect: async (host) => {
      await scena.commands.execute('view.setMainLayout', { layout: one.id });
      again(host);
    },
  }));
  const modes = MODES.map((mode): PickerAction => ({
    title: translate(`shell/layout/modes/${mode.id}`),
    icon: mode.icon,
    keys: mode.keys,
    group: translate('shell/layout/modes/title'),
    onSelect: (host) => {
      applyMode(scena, mode);
      again(host);
    },
  }));
  const zones = ZONES.map((zone): PickerAction => ({
    title: translate(`shell/layout/zones/${zone.surface.replace(':', '-')}`),
    icon: zone.icon,
    ...(zone.keys === undefined ? {} : { keys: zone.keys }),
    group: translate('shell/layout/zones/title'),
    active: visible(scena, zone.surface),
    onSelect: async (host) => {
      if (zone.command !== undefined) await scena.commands.execute(zone.command);
      else scena.layout.setSurface(zone.surface, { ...scena.layout.get().surfaces[zone.surface], visible: !visible(scena, zone.surface) });
      again(host);
    },
  }));
  return { title: translate('shell/layout/title'), items: [...zones, ...views, ...modes] };
}

/** The layout menu: a command in the palette (its title bar button is the shell's), and the modes' own shortcuts. */
export function registerLayoutMenu(scena: Scena): Disposable {
  return combineDisposables(
    scena.commands.register({
      id: 'workbench.customizeLayout',
      title: () => translate('shell/layout/title'),
      keywords: [english('shell/layout/title'), 'layout'],
      icon: EMOJIcon.layoutGroups,
      category: 'View',
      slots: [PALETTE_SLOT],
      run: (ctx) => {
        if (ctx.host !== undefined) ctx.host.pushList(layoutMenu(ctx.scena));
        else openPalette(ctx.scena, layoutMenu(ctx.scena));
      },
    }),
    ...MODES.map((mode) => scena.commands.register({
      id: `layout.mode.${mode.id}`,
      title: () => `${translate('shell/layout/title')}: ${translate(`shell/layout/modes/${mode.id}`)}`,
      keywords: [english(`shell/layout/modes/${mode.id}`)],
      icon: mode.icon,
      category: 'View',
      slots: [PALETTE_SLOT],
      keys: mode.keys,
      run: (ctx) => applyMode(ctx.scena, mode),
    })),
  );
}
