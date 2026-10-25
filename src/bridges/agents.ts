/**
 * The host's engines and the agents made from them.
 *
 * `x-ahpd-engines://` lists the engines the loaded plugins register, keyed by
 * the engine's name, and is read-only. `x-ahpd-agents://` lists the stored agent
 * records, keyed by the agent's id, which is also its `provider` in the root
 * list. `x-ahpd/agents/put`, `/remove` and `/check` make, take out and test one.
 *
 * A record of another owner is listed only to a reader holding `agent:all`. A
 * secret field, `writeOnly` in the engine's schema or one of its `keyVariables`,
 * is kept as a `{ $secret }` reference, and a put that sends it as `""` keeps
 * the one stored.
 *
 * The rows are written here rather than imported: `@ahpd/sdk` 0.13 has no agent
 * record types yet. The channels came after 0.13, so these move to the SDK's
 * once it carries them.
 */

import type { Icon } from './icons.js';
import { hostBridge } from './data.js';
import type { ConnectorOwner } from './connectors.js';
import type { Offers } from './offers.js';
import { recordsReducer } from './people.js';

export const ENGINES = {
  scheme: 'x-ahpd-engines',
  channel: 'x-ahpd-engines://',
} as const;

export const AGENTS = {
  scheme: 'x-ahpd-agents',
  channel: 'x-ahpd-agents://',
  put: 'x-ahpd/agents/put',
  remove: 'x-ahpd/agents/remove',
  check: 'x-ahpd/agents/check',
} as const;

/** Whose agent it is: the host's, a team's or a person's, as a connector's owner. */
export type AgentOwner = ConnectorOwner;

/**
 * Where an agent is: `ready` is served by the host, `invalid` no longer fits
 * its engine's schema or its engine refused to open it, `unavailable` has no plugin
 * registering its engine.
 */
export type AgentState = 'ready' | 'invalid' | 'unavailable';

export const AGENT_STATES: readonly AgentState[] = ['unavailable', 'invalid', 'ready'];

/** What the host last found when it built an agent's backend and asked its probe. */
export interface AgentHealth {
  result: 'ok' | 'unreachable' | 'failed';
  message?: string;
  at: string;
}

/** One stored agent, as `x-ahpd-agents` lists it: its record and its state. */
export interface AgentRow {
  id: string;
  /** The name of the engine it is one of. */
  engine: string;
  owner: AgentOwner;
  name: string;
  description?: string;
  /** What is drawn for the agent; an `Icon` URL, not an emoji. */
  icon?: Icon;
  model?: string;
  /** The engine's own values, each secret as a `{ $secret }` reference. */
  config: Record<string, unknown>;
  state: AgentState;
  health?: AgentHealth;
}

/** What a new record starts from, as an engine offers it. */
export interface AgentTemplate {
  name: string;
  description?: string;
  icon?: Icon;
  model?: string;
  config?: Record<string, unknown>;
}

/** One engine a plugin registers, as `x-ahpd-engines` lists it under its name. */
export interface EngineRow {
  name: string;
  title: string;
  description: string;
  /** The JSON Schema the form for a record of this engine is drawn from. */
  schema: Record<string, unknown>;
  /** The plugin that registered it. */
  plugin: string;
  /** What is drawn beside its title. */
  icons?: Icon[];
  /** What a new record of this engine starts from. */
  templates?: AgentTemplate[];
  /** The fields only the host's own record may set. */
  hostOnly?: string[];
  /** The `env` variables any owner may set, each a secret. */
  keyVariables?: string[];
}

export const enginesReducer = recordsReducer<EngineRow>(ENGINES.scheme);
export const agentsReducer = recordsReducer<AgentRow>(AGENTS.scheme);

/** Whether a host serves agents to this reader: the channel is among its offers. */
export function servesAgents(offers: Offers): boolean {
  return offers.channels.includes(AGENTS.scheme);
}

/** Whether a host lists the engines it serves: the channel is among its offers. */
export function servesEngines(offers: Offers): boolean {
  return offers.channels.includes(ENGINES.scheme);
}

/** What a put sends: the whole record, every secret as its value or `""` to keep it. */
export interface AgentWanted {
  id: string;
  engine: string;
  owner: AgentOwner;
  name: string;
  description?: string;
  icon?: Icon;
  model?: string;
  config: Record<string, unknown>;
}

const isRow = (value: unknown): value is AgentRow => {
  const held = value as Partial<AgentRow> | null;
  return typeof held === 'object' && held !== null && typeof held.id === 'string' && typeof held.owner === 'string';
};

/** Makes or changes one agent; the host checks it against its engine and serves it. Answers the row it now lists. */
export async function putAgent(host: string, wanted: AgentWanted): Promise<AgentRow> {
  const params = {
    id: wanted.id,
    engine: wanted.engine,
    owner: wanted.owner,
    name: wanted.name,
    ...(wanted.description === undefined || wanted.description === '' ? {} : { description: wanted.description }),
    ...(wanted.icon === undefined ? {} : { icon: wanted.icon }),
    ...(wanted.model === undefined || wanted.model === '' ? {} : { model: wanted.model }),
    config: wanted.config,
  };
  const answer = await hostBridge(host).request(AGENTS.put as never, params as never) as unknown;
  if (!isRow(answer)) throw new Error(`${AGENTS.put} answered no agent`);
  return answer;
}

/** Ends the sessions on one agent and takes its record, and its secrets, off the host. */
export async function removeAgent(host: string, id: string): Promise<void> {
  await hostBridge(host).request(AGENTS.remove as never, { id } as never);
}

/** Builds one agent's backend again and asks its probe. Answers the row with its health. */
export async function checkAgent(host: string, id: string): Promise<AgentRow> {
  const answer = await hostBridge(host).request(AGENTS.check as never, { id } as never) as unknown;
  if (!isRow(answer)) throw new Error(`${AGENTS.check} answered no agent`);
  return answer;
}
