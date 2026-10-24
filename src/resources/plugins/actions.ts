import { translate } from '@softov/scena';
import { hostBridge, ROOT } from '../../bridges/data.js';
import type { Offers } from '../../bridges/offers.js';
import { applyPlugins, disablePlugin, enablePlugin, PLUGINS, reloadPlugin, specEnabled, type PluginRow } from '../../bridges/plugins.js';
import { failed } from '../../shell/notify/index.js';

/** Whether the host offers the command that turns this plugin the other way. */
export function mayToggle(offers: Offers, row: PluginRow): boolean {
  return offers.methods.includes(specEnabled(row.spec) ? PLUGINS.disable : PLUGINS.enable);
}

/** The command that turns this plugin the other way. */
export const toggleMethod = (row: PluginRow): string => (specEnabled(row.spec) ? PLUGINS.disable : PLUGINS.enable);

/** Whether the host offers to import a plugin's code again. */
export const mayReload = (offers: Offers): boolean => offers.methods.includes(PLUGINS.reload);

/** What the host says a command does, as a button's tooltip. */
export const saidOf = (offers: Offers, method: string): string | undefined => offers.described[method];

/**
 * Turns a plugin the other way, then reads the list and the root again, so the
 * row, the page and the restart note show what the host holds now. A refusal
 * is the host's, in its words.
 */
export async function togglePlugin(host: string, id: string, row: PluginRow): Promise<void> {
  const on = specEnabled(row.spec);
  try {
    await (on ? disablePlugin(host, id) : enablePlugin(host, id));
    await rereadAfterChange(host);
  } catch (error) {
    failed(translate(on ? 'plugins/actions/disableFailed' : 'plugins/actions/enableFailed', { id }), error);
  }
}

/** Imports a plugin's code again, then reads the list and the root again. */
export async function reloadOne(host: string, id: string): Promise<void> {
  try {
    await reloadPlugin(host, id);
    await rereadAfterChange(host);
  } catch (error) {
    failed(translate('plugins/actions/reimportFailed', { id }), error);
  }
}

/** Matches each host's running plugins to its configuration file, then reads each one again. */
export async function applyAll(hosts: readonly string[]): Promise<void> {
  await Promise.all(hosts.map(async (host) => {
    try {
      await applyPlugins(host);
      await rereadAfterChange(host);
    } catch (error) {
      failed(translate('plugins/actions/applyFailed'), error);
    }
  }));
}

/**
 * Reads the list and the root again after a command changed the
 * configuration. ahpd pushes `x-ahpd/restartNeeded` to a client already
 * watching the root, but the protocol client drops a notification it does not
 * know, so the root's `ahpd.restartNeeded` is read back instead.
 */
export async function rereadAfterChange(host: string): Promise<void> {
  await Promise.all([hostBridge(host).refresh(PLUGINS.channel), hostBridge(host).refresh(ROOT)]);
}
