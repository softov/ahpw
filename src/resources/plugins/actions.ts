import { translate } from '@softov/scena';
import type { ReactiveStore } from '@softov/scena/types';
import { hostBridge } from '../../bridges/data.js';
import type { Offers } from '../../bridges/offers.js';
import { disablePlugin, enablePlugin, PLUGINS, specEnabled, type PluginRow } from '../../bridges/plugins.js';
import { failed } from '../../shell/notify/index.js';
import { restartPath } from './state.js';

/** Whether the host offers the command that turns this plugin the other way. */
export function mayToggle(offers: Offers, row: PluginRow): boolean {
  return offers.methods.includes(specEnabled(row.spec) ? PLUGINS.disable : PLUGINS.enable);
}

/**
 * Turns a plugin the other way, then reads the list again, so the row and the
 * page show the configuration as it now is. A refusal is the host's, in its
 * words.
 */
export async function togglePlugin(store: ReactiveStore, host: string, id: string, row: PluginRow): Promise<void> {
  const on = specEnabled(row.spec);
  try {
    const answer = await (on ? disablePlugin(host, id) : enablePlugin(host, id));
    if (answer.restart) store.set(restartPath(host), true);
    await hostBridge(host).refresh(PLUGINS.channel);
  } catch (error) {
    failed(translate(on ? 'plugins/actions/disableFailed' : 'plugins/actions/enableFailed', { id }), error);
  }
}
