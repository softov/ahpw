import type { BindingPath } from '@softov/scena/types';

/** Whether any host this page connects to lists its plugins to this reader; the 🔣 entry shows while one does. */
export const PLUGINS_SERVED = '$/ahp/plugins/served' as BindingPath;

/** The plugin open in `main`, as `{ host, id }`. */
export const ACTIVE_PLUGIN = '$/ahp/plugins/active' as BindingPath;

/** How the list groups its rows; null while it is the usual one, by state. */
export const PLUGINS_GROUP = '$/ahp/plugins/group' as BindingPath;

export const GROUP_KEY = 'ahpd-web.plugins-group';

/**
 * Set once a change this page made answers that the host needs a restart:
 * an enable or a disable says so in its answer, which the root's own
 * `ahpd.restartNeeded` only does for a settings change.
 */
export const restartPath = (host: string): BindingPath => `$/ahp/plugins/restart/${encodeURIComponent(host)}` as BindingPath;

/** A plugin's tab key: one tab each. */
export const pluginTab = (host: string, id: string): string => `plugins:${host}:${id}`;

/** A plugin page's tabs. */
export type PluginTabKey = 'overview' | 'options';

/** The tab a plugin's page opens on: the one chosen last, kept while the page lives, as the settings' tab is. */
let chosenTab: PluginTabKey = 'overview';
export const pluginTabKey = (): PluginTabKey => chosenTab;
export function keepPluginTabKey(key: string): void {
  if (key === 'overview' || key === 'options') chosenTab = key;
}
