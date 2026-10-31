/**
 * The UI settings: the browser's own choices, gathered so the settings window
 * lists them beside the host's and an embedder can keep them as a profile.
 *
 * Nothing here holds a value. Each setting reads and writes the place its
 * owner already keeps it, so a choice made from a menu and one made in the
 * form are the same choice (decision: UI settings have their own tab in the
 * settings window).
 */

import type { BindingPath, Disposable, Scena } from '@softov/scena/types';
import { getLocale, getLocaleInfo, setLocale, subscribeI18n, translate } from '@softov/scena';
import { listThemes, THEME_ID_PATH, THEME_MODE_PATH } from '@softov/scena/styles';
import type { JsonSchemaField } from '@softov/scena/ui';
import { initialLocale, LOCALES } from '../../i18n/locales.js';
import { CONFIRM_STYLE, confirmStyle, DEFAULT_CONFIRM_STYLE, setConfirmStyle } from '../notify/confirm.js';
import { MAIN_LAYOUTS } from '../view/layouts.js';
import { keepSettingsPlace, PLACES, placeName, SETTINGS_PLACE, settingsPlace } from '../../resources/host/place.js';
import { SESSION_VIEWS, VIEWS_PLACES, type Placing } from '../right-sidebar.js';
import { BOT_CHAT_OPENS } from '../../resources/bots/sidebar.js';
import { CUSTOM_FILE_OPENS } from '../../resources/agents/custom-files.js';
import { SESSION_MARKDOWN, TOOLS_EXPANDED, type ChatChoice } from '../../resources/sessions/view-settings.js';

/** A UI setting's key: `ui.<name>`, flat, as the host's keys are. */
export type UiKey = `ui.${string}`;

export interface UiSetting {
  key: UiKey;
  /** The values it takes, in the order the form offers them, and the one a reset goes back to. */
  values: (scena: Scena) => readonly string[];
  usual: () => string;
  /** What the form calls each value. */
  label: (value: string, scena: Scena) => string;
  read: (scena: Scena) => string;
  /** Applies and keeps a value the setting takes. */
  apply: (scena: Scena, value: string) => void;
  /** Calls `changed` whenever the value changes, wherever it was changed from. */
  watch: (scena: Scena, changed: () => void) => Disposable;
}

const onPath = (path: BindingPath) => (scena: Scena, changed: () => void): Disposable => scena.store.subscribe(path, changed);

/** A setting that places views: Right sidebar or As a panel. */
const placeSetting = (key: UiKey, place: Placing): UiSetting => ({
  key,
  values: () => VIEWS_PLACES,
  usual: () => 'sidebar',
  label: (value) => translate(`host/settings/ui/${key.slice('ui.'.length)}/${value}`),
  read: (scena) => place.read(scena),
  apply: (scena, value) => place.set(scena, value === 'tab' ? 'tab' : 'sidebar'),
  watch: onPath(place.path),
});

/** A setting for how the chat draws, labelled `host/settings/ui/<name>/<value>`. */
const chatSetting = (key: UiKey, choice: ChatChoice): UiSetting => ({
  key,
  values: () => choice.values,
  usual: () => choice.usual,
  label: (value) => translate(`host/settings/ui/${key.slice('ui.'.length)}/${value}`),
  read: (scena) => choice.read(scena.store),
  apply: (scena, value) => choice.set(scena.store, value),
  watch: onPath(choice.path),
});

/** The main area's layout, as scena mirrors it into the store. */
const MAIN_LAYOUT = '$/layout/surfaces/main/layout' as BindingPath;

export const UI_SETTINGS: readonly UiSetting[] = [
  {
    key: 'ui.theme',
    values: () => listThemes().map((one) => one.id),
    usual: () => 'default',
    label: (value) => listThemes().find((one) => one.id === value)?.label ?? value,
    read: (scena) => scena.store.get<string>(THEME_ID_PATH) ?? 'default',
    apply: (scena, value) => scena.store.set(THEME_ID_PATH, value),
    watch: onPath(THEME_ID_PATH),
  },
  {
    key: 'ui.themeMode',
    values: () => ['system', 'light', 'dark'],
    usual: () => 'system',
    label: (value) => translate(`host/settings/ui/themeMode/${value}`),
    read: (scena) => scena.store.get<string>(THEME_MODE_PATH) ?? 'system',
    apply: (scena, value) => scena.store.set(THEME_MODE_PATH, value),
    watch: onPath(THEME_MODE_PATH),
  },
  {
    key: 'ui.language',
    values: () => LOCALES,
    usual: () => initialLocale(null, navigator.languages),
    label: (value) => getLocaleInfo(value)?.name ?? value,
    read: () => getLocale(),
    // messages.ts keeps the language on each change.
    apply: (_scena, value) => setLocale(value),
    watch: (_scena, changed) => ({ dispose: subscribeI18n(changed) }),
  },
  {
    key: 'ui.layout',
    values: () => MAIN_LAYOUTS.map((one) => one.id),
    usual: () => 'tab',
    label: (value) => translate(`shell/layouts/${value}`),
    read: (scena) => scena.layout.get().surfaces.main?.layout ?? 'tab',
    apply: (scena, value) => { void scena.commands.execute('view.setMainLayout', { layout: value }); },
    watch: onPath(MAIN_LAYOUT),
  },
  {
    key: 'ui.settingsPlace',
    values: () => PLACES,
    usual: () => 'overlay',
    label: (value) => placeName(value),
    read: () => settingsPlace(),
    apply: (scena, value) => keepSettingsPlace(PLACES.find((one) => one === value) ?? 'overlay', scena.store),
    watch: onPath(SETTINGS_PLACE),
  },
  {
    key: 'ui.confirmStyle',
    values: () => ['modal', 'native'],
    usual: () => DEFAULT_CONFIRM_STYLE,
    label: (value) => translate(`host/settings/ui/confirmStyle/${value}`),
    read: () => confirmStyle(),
    apply: (_scena, value) => setConfirmStyle(value === 'native' ? 'native' : 'modal'),
    watch: onPath(CONFIRM_STYLE),
  },
  placeSetting('ui.sessionViewsPlace', SESSION_VIEWS),
  chatSetting('ui.toolsExpanded', TOOLS_EXPANDED),
  chatSetting('ui.sessionMarkdown', SESSION_MARKDOWN),
  chatSetting('ui.botChatOpens', BOT_CHAT_OPENS),
  chatSetting('ui.customFileOpens', CUSTOM_FILE_OPENS),
];

export const isUiKey = (key: string): key is UiKey => key.startsWith('ui.');

/** Each setting as a form field: a title, a description and its values, translated now. */
export function uiFields(scena: Scena): Record<UiKey, JsonSchemaField> {
  return Object.fromEntries(UI_SETTINGS.map((one) => {
    const values = one.values(scena);
    const name = one.key.slice('ui.'.length);
    return [one.key, {
      type: 'string',
      title: translate(`host/settings/ui/${name}/title`),
      description: translate(`host/settings/ui/${name}/description`),
      enum: [...values],
      'x-enumOptions': values.map((value) => ({ value, label: one.label(value, scena) })),
      default: one.usual(),
    } satisfies JsonSchemaField];
  }));
}

/** Every setting's value now, keyed by setting. */
export function readUi(scena: Scena): Record<UiKey, string> {
  return Object.fromEntries(UI_SETTINGS.map((one) => [one.key, one.read(scena)]));
}

/**
 * Applies a value to one setting. A value it does not take, `undefined` among
 * them, goes back to its usual one, which is how a key taken out of the form
 * resets. A value equal to the current one does nothing.
 */
export function writeUi(scena: Scena, key: UiKey, value: unknown): void {
  const setting = UI_SETTINGS.find((one) => one.key === key);
  if (setting === undefined) return;
  const next = typeof value === 'string' && setting.values(scena).includes(value) ? value : setting.usual();
  if (next !== setting.read(scena)) setting.apply(scena, next);
}

/** Calls `changed` whenever any setting changes. */
export function watchUi(scena: Scena, changed: () => void): Disposable {
  const watches = UI_SETTINGS.map((one) => one.watch(scena, changed));
  return { dispose: () => { for (const one of watches) one.dispose(); } };
}
