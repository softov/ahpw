import type { AgentInfo } from '@microsoft/agent-host-protocol';
import type { AgentRow } from '../../bridges/agents.js';

/**
 * Where an agent stands between the two lists: `configured` has a record the
 * host serves, `standalone` is served with no record, `standby` is a record the
 * host does not serve.
 */
export type AgentStatus = 'configured' | 'standalone' | 'standby';

/** One agent of one host, from the root list, the agents channel, or both. */
export interface MergedAgent {
  /** The agent's `provider`, which is its record's `id`. */
  id: string;
  status: AgentStatus;
  info?: AgentInfo;
  record?: AgentRow;
}

/** An agent's title: its root list name, then its record's, then its id. */
export const agentTitle = (agent: MergedAgent): string =>
  agent.info?.displayName || agent.record?.name || agent.id;

/**
 * One entry per id, by title. A record not in the root list is configured while
 * it is ready, as another owner's record a reader with `agent:all` sees.
 */
export function mergeAgents(infos: readonly AgentInfo[], records: readonly AgentRow[]): MergedAgent[] {
  const byId = new Map(records.map((record) => [record.id, record]));
  const served = new Set(infos.map((info) => info.provider));
  const merged: MergedAgent[] = [
    ...infos.map((info): MergedAgent => {
      const record = byId.get(info.provider);
      return record === undefined
        ? { id: info.provider, status: 'standalone', info }
        : { id: info.provider, status: 'configured', info, record };
    }),
    ...records
      .filter((record) => !served.has(record.id))
      .map((record): MergedAgent => ({ id: record.id, status: record.state === 'ready' ? 'configured' : 'standby', record })),
  ];
  return merged.sort((a, b) => agentTitle(a).localeCompare(agentTitle(b)) || a.id.localeCompare(b.id));
}
