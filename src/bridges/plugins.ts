/**
 * The host's plugins, through ahpd's `x-ahpd-plugins://` records channel and
 * its `x-ahpd/plugins/enable` and `/disable` commands. Both need the reader to
 * see the configuration (`config:read`, `config:write`); a host refuses the
 * rest in its own words.
 *
 * The row is written here rather than imported: ahpd serves it from the
 * server, and `@ahpd/sdk` 0.13 has no `PluginManifest` yet. The channel came
 * after 0.13, so these types move to the SDK's once it carries them.
 */

import type { RootState } from '@microsoft/agent-host-protocol';
import { hostBridge } from './data.js';
import type { Offers } from './offers.js';
import { recordsReducer } from './people.js';

export const PLUGINS = {
  scheme: 'x-ahpd-plugins',
  channel: 'x-ahpd-plugins://',
  enable: 'x-ahpd/plugins/enable',
  disable: 'x-ahpd/plugins/disable',
} as const;

/**
 * What ahpd says of a configured plugin, read from the configuration and its
 * package rather than from what loaded: `ready` resolves and is configured,
 * `unconfigured` lacks an option it needs, `incompatible` wants another SDK,
 * `missing` is not installed, `error` could not be read.
 */
export type PluginState = 'ready' | 'incompatible' | 'unconfigured' | 'disabled' | 'missing' | 'error';

export const PLUGIN_STATES: readonly PluginState[] = ['error', 'missing', 'incompatible', 'unconfigured', 'ready', 'disabled'];

/** A link a plugin names, such as its docs. */
export interface PluginLink {
  title: string;
  url: string;
}

/** What a plugin says it registers, by register method: `agents`, `channels`, `methods`, `connectors`, ... An entry may end in `*`. */
export type PluginContracts = Record<string, string[]>;

/** A plugin's manifest, as `ahpd` in its package.json writes it. */
export interface PluginManifest {
  description?: string;
  /** Free words; ahpd's own are `agent`, `channel`, `connector`, `storage` and `tool`. */
  categories?: string[];
  links?: PluginLink[];
  contracts?: PluginContracts;
}

/** How the configuration names a plugin: the module alone, or with its options and whether it is on. */
export type PluginSpec = string | { name: string; options?: Record<string, unknown>; enabled?: boolean; grants?: string[] };

/** One configured plugin, as the channel lists it; a secret option reads `<set>`. */
export interface PluginRow {
  spec: PluginSpec;
  name: string;
  state: PluginState;
  module?: string;
  url?: string;
  path?: string;
  title?: string;
  problem?: string;
  /** Present once the plugin loaded with one. */
  manifest?: PluginManifest;
  /** Loaded, but its manifest names no contracts. */
  undeclared?: boolean;
}

export const pluginsReducer = recordsReducer<PluginRow>(PLUGINS.scheme);

/** Whether a host lists its plugins to this reader: the channel is among its offers. */
export function servesPlugins(offers: Offers): boolean {
  return offers.channels.includes(PLUGINS.scheme);
}

/** What an enable or a disable answers: the plugin, whether it is now on, and that a restart loads it. */
export interface PluginToggled {
  id: string;
  enabled: boolean;
  restart: boolean;
}

async function toggle(host: string, method: string, id: string): Promise<PluginToggled> {
  const answer = await hostBridge(host).request(method as never, { id } as never) as Partial<PluginToggled> | null;
  if (typeof answer !== 'object' || answer === null || typeof answer.id !== 'string' || typeof answer.enabled !== 'boolean') {
    throw new Error(`${method} answered no plugin`);
  }
  return { id: answer.id, enabled: answer.enabled, restart: answer.restart === true };
}

/** Turns a configured plugin on; the host loads it at its next start. */
export const enablePlugin = (host: string, id: string): Promise<PluginToggled> => toggle(host, PLUGINS.enable, id);

/** Turns a configured plugin off, keeping its entry and options; the host drops it at its next start. */
export const disablePlugin = (host: string, id: string): Promise<PluginToggled> => toggle(host, PLUGINS.disable, id);

/** Whether the host holds a configuration change that only a restart applies. */
export function restartNeeded(root: RootState | undefined): boolean {
  return root?._meta?.['ahpd.restartNeeded'] === true;
}

/** Whether the configuration turns a plugin on: a spec without `enabled: false`. */
export function specEnabled(spec: PluginSpec): boolean {
  return typeof spec === 'string' || spec.enabled !== false;
}
