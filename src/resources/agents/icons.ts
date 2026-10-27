import { useCallback, useMemo } from 'react';
import { ENGINES, AGENTS, enginesReducer, agentsReducer, type EngineRow, type AgentRow } from '../../bridges/agents.js';
import { useChannelOnEach } from '../../bridges/channel.js';
import { pickIcon, type Icon } from '../../bridges/icons.js';
import type { PeopleState } from '../../bridges/people.js';
import { useServingHosts } from '../../bridges/served.js';
import { useScheme } from '../../shell/HostIcon.js';

/** The icons drawn for an agent: the row's, else its record's own, else its engine's, which the host gives its plugin's when it has none. */
export function agentIcons(record: AgentRow | undefined, engines: readonly { id: string; record: EngineRow }[]): Icon[] | undefined {
  if (record === undefined) return undefined;
  if (record.icons !== undefined && record.icons.length > 0) return record.icons;
  if (record.icon !== undefined) return [record.icon];
  return engines.find((one) => one.id === record.engine)?.record.icons;
}

/**
 * The icons of an agent on one of `hosts`, by its provider id, which is its
 * record's id. The agents and engines channels are followed while the caller
 * is on screen; every caller shares the one subscription a host holds.
 */
export function useAgentIcons(hosts: readonly string[]): (host: string, provider: string) => Icon[] | undefined {
  const serving = useServingHosts(hosts, AGENTS.scheme);
  const recordStates = useChannelOnEach<PeopleState<AgentRow>>(serving, AGENTS.channel, agentsReducer).states;
  const servingEngines = useServingHosts(hosts, ENGINES.scheme);
  const engineStates = useChannelOnEach<PeopleState<EngineRow>>(servingEngines, ENGINES.channel, enginesReducer).states;
  const byHost = useMemo(() => new Map(hosts.map((host) => [host, {
    records: recordStates[serving.indexOf(host)]?.records ?? [],
    engines: engineStates[servingEngines.indexOf(host)]?.records ?? [],
  }])), [hosts, serving, recordStates, servingEngines, engineStates]);
  return useCallback((host, provider) => {
    const held = byHost.get(host);
    return held === undefined ? undefined : agentIcons(held.records.find((one) => one.id === provider)?.record, held.engines);
  }, [byHost]);
}

/** The image to draw for an agent on one of `hosts`, for the scheme shown, as a picker row's `iconSrc` takes it. */
export function useAgentIconSrc(hosts: readonly string[]): (host: string, provider: string) => string | undefined {
  const iconsOf = useAgentIcons(hosts);
  const scheme = useScheme();
  return useCallback((host, provider) => pickIcon(iconsOf(host, provider), scheme)?.src, [iconsOf, scheme]);
}
