import type { PluginContracts } from '../../bridges/plugins.js';

/** What a provided entry opens in ahpw: a command and its arguments. */
export interface ProvidedLink {
  command: string;
  args?: Record<string, unknown>;
}

/** One entry a plugin provides, and where ahpw shows it, when it does. */
export interface Provided {
  name: string;
  link?: ProvidedLink;
}

/** The register methods a plugin names, in the order the page shows them; any other follows by name. */
export const PROVIDE_ORDER = ['agents', 'adapters', 'channels', 'methods', 'resourceProviders', 'tools', 'triggerTypes'] as const;

/** The section each channel scheme and resource scheme opens, where ahpw has one. */
const SECTION: Readonly<Record<string, string>> = {
  'x-ahpd-bots': 'ahp.showBots',
  bot: 'ahp.showBots',
  'x-ahpd-computers': 'ahp.showComputers',
  computer: 'ahp.showComputers',
  'x-ahpd-users': 'ahp.showUsers',
  'x-ahpd-roles': 'ahp.showUsers',
  user: 'ahp.showUsers',
  role: 'ahp.showUsers',
  'x-ahpd-teams': 'ahp.showTeams',
  'x-ahpd-projects': 'ahp.showTeams',
  team: 'ahp.showTeams',
  project: 'ahp.showTeams',
  'x-ahpd-policies': 'ahp.showPolicies',
  policy: 'ahp.showPolicies',
  usage: 'ahp.showUsage',
  'x-ahpd-plugins': 'ahp.showPlugins',
  'x-ahpd-connectors': 'ahp.showConnectors',
  'x-ahpd-adapters': 'ahp.showConnectors',
};

/** Where an entry of a register method opens: an agent its page, an adapter or a channel or a scheme its section; a wildcard nothing. */
export function linkOf(kind: string, name: string, host: string): ProvidedLink | undefined {
  if (name.endsWith('*')) return undefined;
  if (kind === 'agents') return { command: 'ahp.openAgent', args: { host, provider: name } };
  if (kind === 'adapters') return { command: 'ahp.showConnectors' };
  if (kind === 'channels' || kind === 'resourceProviders') {
    const command = SECTION[name];
    return command === undefined ? undefined : { command };
  }
  return undefined;
}

/**
 * What a plugin's contracts say it provides, by register method: ahpd's main
 * ones first, the rest by name, each entry with where ahpw shows it. An empty
 * list is left out.
 */
export function providedGroups(contracts: PluginContracts | undefined, host: string): { kind: string; entries: Provided[] }[] {
  const kinds = Object.keys(contracts ?? {}).filter((kind) => (contracts?.[kind] ?? []).length > 0);
  const rank = (kind: string): number => {
    const at = (PROVIDE_ORDER as readonly string[]).indexOf(kind);
    return at >= 0 ? at : PROVIDE_ORDER.length;
  };
  return kinds
    .sort((a, b) => rank(a) - rank(b) || a.localeCompare(b))
    .map((kind) => ({
      kind,
      entries: (contracts?.[kind] ?? []).map((name) => {
        const link = linkOf(kind, name, host);
        return link === undefined ? { name } : { name, link };
      }),
    }));
}
