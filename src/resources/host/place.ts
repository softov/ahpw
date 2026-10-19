import type { BindingPath, PickerAction, ReactiveStore, Scena } from '@softov/scena/types';
import { translate } from '@softov/scena';
import { openInPanel, PANEL } from '../../shell/panel/index.js';
import { RIGHT_SIDEBAR } from '../../shell/right-sidebar.js';
import { embedMode } from '../../shell/embed/index.js';
import { hostNameOf } from '../../bridges/hosts.js';
import { bound } from '../../i18n/locales.js';
import { EMOJIcon } from '../emojis.js';

/** Where the settings open: a floating window, or a tab in the main area, the right sidebar or the bottom panel. */
export type SettingsPlace = 'overlay' | 'main' | typeof RIGHT_SIDEBAR | typeof PANEL;

/** Every place, in the order *Open in* lists them. */
export const PLACES: readonly SettingsPlace[] = ['overlay', 'main', RIGHT_SIDEBAR, PANEL];

/** The localStorage key of the chosen place; one per browser, as the language is. */
const PLACE_KEY = 'ahpw.settingsPlace';

/** The chosen place, or the floating window when none was chosen (decision: settings open on the surface a person chose). */
export function settingsPlace(): SettingsPlace {
  try {
    const kept = localStorage.getItem(PLACE_KEY);
    return PLACES.find((place) => place === kept) ?? 'overlay';
  } catch {
    return 'overlay';
  }
}

/** The chosen place, mirrored into the store so a page showing it sees a change made from *Open in*. */
export const SETTINGS_PLACE = '$/ahp/settings/place' as BindingPath;

export function keepSettingsPlace(place: SettingsPlace, store?: ReactiveStore): void {
  store?.set(SETTINGS_PLACE, place);
  try {
    localStorage.setItem(PLACE_KEY, place);
  } catch {
    // A browser that keeps nothing opens the window next time.
  }
}

/** The settings' tabs: the host's, and the browser's own. */
export type SettingsTab = 'host' | 'ui';

/** The tab the settings open on: the one chosen last, kept while the page lives. */
let chosenTab: SettingsTab = 'host';
export const settingsTab = (): SettingsTab => chosenTab;
export function keepSettingsTab(tab: string): void {
  if (tab === 'host' || tab === 'ui') chosenTab = tab;
}

/** The mount key of a host's settings, wherever they are. */
export const settingsKey = (host: string): string => `host:settings:${host}`;

/** The host whose settings a mount key holds, or undefined for another key. */
export const settingsHostOf = (key: unknown): string | undefined =>
  typeof key === 'string' && key.startsWith('host:settings:') ? key.slice('host:settings:'.length) : undefined;

/** The translation key of each place's name. */
const PLACE_NAME: Record<SettingsPlace, string> = {
  overlay: 'host/settings/places/overlay',
  main: 'host/settings/places/main',
  'sidebar:right': 'host/settings/places/right',
  'panel:bottom': 'host/settings/places/bottom',
};

/** What a place is called, as *Open in* and the UI settings name it. */
export const placeName = (place: string): string => translate(PLACE_NAME[place as SettingsPlace] ?? place);

/**
 * *Open in*'s rows: each place, the current one marked; choosing one keeps it
 * and moves the settings there. In a tab's menu the rows sit under an *Open in*
 * heading and leave out the place the tab is in, as a file tab's *Open with* does.
 */
export function placeItems(scena: Scena, host: string, current: SettingsPlace, inTabMenu = false): PickerAction[] {
  return PLACES.filter((place) => !inTabMenu || place !== current).map((place) => ({
    title: placeName(place),
    ...(inTabMenu ? { group: translate('host/settings/openIn') } : { active: place === current }),
    onSelect: (picker) => {
      picker.closeMenu();
      keepSettingsPlace(place, scena.store);
      if (place !== current) openSettingsAt(scena, host, place);
    },
  }));
}

/**
 * Open a host's settings at `place`, closing them wherever else they are open:
 * a mount keeps its surface when opened again under its key.
 */
export function openSettingsAt(scena: Scena, host: string, place: SettingsPlace): void {
  const key = settingsKey(host);
  scena.surfaces.close(key);
  if (place === 'overlay') {
    scena.surfaces.open({ surface: 'overlay', key, resource: { component: 'HostSettingsWindow', host } });
    return;
  }
  const title = embedMode() === 'multi' ? translate('hosts/settingsTab', { host: hostNameOf(scena.store, host) }) : bound('host/settings/tab');
  const tab = { key, resource: { component: 'HostSettingsPage', host, place }, props: { title, icon: EMOJIcon.settings } };
  if (place === PANEL) {
    openInPanel(scena, tab);
    return;
  }
  scena.surfaces.open({ ...tab, surface: place });
  if (place === RIGHT_SIDEBAR) {
    const current = scena.layout.get().surfaces[RIGHT_SIDEBAR];
    scena.layout.setSurface(RIGHT_SIDEBAR, { ...current, visible: true, activeContainerKey: key });
  }
}
