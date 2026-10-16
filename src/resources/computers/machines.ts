/**
 * A host's computers, as ahpd's computer plugin serves them: the records
 * channel that lists them, what a record says, and the calls that make, start,
 * stop, restart and remove one. A call is the plugin's method where the host
 * offers it, else the resource write the method stands for.
 */

import { hostBridge } from '../../bridges/data.js';
import type { Offers } from '../../bridges/offers.js';

export const COMPUTERS_SCHEME = 'x-ahpd-computers';
export const COMPUTERS = `${COMPUTERS_SCHEME}://`;
/** The resource scheme each computer is a folder of: `status`, `capabilities`, `stats`, `state`. */
export const COMPUTER_PROVIDER = 'computer';

/** One computer on the channel: whether it runs, and the runtime's own record (docker inspect, or ssh's). */
export interface ComputerRecord {
  state: 'running' | 'stopped';
  status: Record<string, unknown>;
}

export interface ComputersState {
  records: { id: string; record: ComputerRecord }[];
}

type ComputersAction =
  | { type: `${typeof COMPUTERS_SCHEME}/added` | `${typeof COMPUTERS_SCHEME}/changed`; id: string; record: ComputerRecord }
  | { type: `${typeof COMPUTERS_SCHEME}/removed`; id: string };

/** Folds the channel's actions into its snapshot, `{ records }`. */
export function computersReducer(state: ComputersState, action: ComputersAction): ComputersState {
  const records = state.records.filter((one) => one.id !== action.id);
  switch (action.type) {
    case `${COMPUTERS_SCHEME}/added`:
    case `${COMPUTERS_SCHEME}/changed`: {
      const at = state.records.findIndex((one) => one.id === action.id);
      const entry = { id: action.id, record: action.record };
      return { records: at < 0 ? [...records, entry] : state.records.map((one, index) => (index === at ? entry : one)) };
    }
    case `${COMPUTERS_SCHEME}/removed`:
      return { records };
    default:
      return state;
  }
}

/** A mount of a host path into the machine. */
export interface Mount {
  source: string;
  target: string;
  readOnly: boolean;
}

/** What a computer's record says, as far as the runtime says it. */
export interface MachineFacts {
  running: boolean;
  /**
   * Whether its runtime starts and stops it, as a docker machine's record shows
   * with its `State`. An ssh box is only listed. Its `capabilities` leaf cannot
   * say so, since ahpd reports the default runtime's there for every machine.
   */
  controlled: boolean;
  image?: string;
  created?: string;
  startedAt?: string;
  oomKilled: boolean;
  exitCode?: number;
  workdir?: string;
  command?: string;
  network?: string;
  /** Bytes; absent when there is no limit. */
  memoryLimit?: number;
  cores?: number;
  mounts: Mount[];
  containerId?: string;
  pid?: number;
  /** Where an ssh machine is. */
  destination?: string;
}

function bag(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}
const text = (value: unknown): string | undefined => (typeof value === 'string' && value !== '' ? value : undefined);
const count = (value: unknown): number | undefined => (typeof value === 'number' && Number.isFinite(value) ? value : undefined);
/** Docker's zero time, which it writes for a machine that never started. */
const NEVER = '0001-01-01T00:00:00Z';

/** The facts in a record: docker inspect's fields, or an ssh machine's destination; `state` says whether it runs. */
export function factsOf(record: ComputerRecord): MachineFacts {
  const status = bag(record.status);
  const state = bag(status.State);
  const config = bag(status.Config);
  const hostConfig = bag(status.HostConfig);
  const command = Array.isArray(config.Cmd) ? config.Cmd.filter((one): one is string => typeof one === 'string').join(' ') : undefined;
  const memory = count(hostConfig.Memory);
  const nano = count(hostConfig.NanoCpus);
  const started = text(state.StartedAt);
  const facts: MachineFacts = {
    running: typeof state.Running === 'boolean' ? state.Running : record.state === 'running',
    controlled: typeof state.Running === 'boolean',
    oomKilled: state.OOMKilled === true,
    mounts: (Array.isArray(status.Mounts) ? status.Mounts : []).map((one) => bag(one)).flatMap((one) => {
      const source = text(one.Source);
      const target = text(one.Destination);
      return source === undefined || target === undefined ? [] : [{ source, target, readOnly: one.RW === false }];
    }),
  };
  const set = <K extends keyof MachineFacts>(key: K, value: MachineFacts[K] | undefined): void => {
    if (value !== undefined) facts[key] = value;
  };
  set('image', text(config.Image));
  set('created', text(status.Created));
  set('startedAt', started === NEVER ? undefined : started);
  set('exitCode', count(state.ExitCode));
  set('workdir', text(config.WorkingDir) ?? text(status.workdir));
  set('command', command === '' ? undefined : command);
  set('network', text(hostConfig.NetworkMode));
  set('memoryLimit', memory === 0 ? undefined : memory);
  set('cores', nano === undefined || nano === 0 ? undefined : nano / 1e9);
  set('containerId', text(status.Id));
  set('pid', count(state.Pid) === 0 ? undefined : count(state.Pid));
  set('destination', text(status.destination));
  return facts;
}

/** How a computer stands: running, stopped, or a problem (killed for memory, or exited with an error). */
export type Standing = 'running' | 'problem' | 'stopped';

export function standingOf(facts: MachineFacts): Standing {
  if (facts.running) return 'running';
  return facts.oomKilled || (facts.exitCode !== undefined && facts.exitCode !== 0) ? 'problem' : 'stopped';
}

/** A computer's resource: its provider's root and its id; an id may hold a dot, as `ssh-ish.dev02`. */
export const computerUri = (root: string, id: string): string => `${root.endsWith('/') ? root : `${root}/`}${id}`;

/** The root of the host's computers, as its provider says; `computer://` when it does not. */
export const computersRoot = (offers: Offers): string => offers.providers[COMPUTER_PROVIDER]?.root ?? `${COMPUTER_PROVIDER}://`;

/** What a person can do to a computer. */
export type ComputerAction = 'start' | 'stop' | 'restart' | 'remove';

/** The state a `state` write sets, for a host without the methods. */
const STATE_OF: Record<Exclude<ComputerAction, 'remove'>, string> = { start: 'running', stop: 'stopped', restart: 'restarted' };

/** Starts, stops, restarts or removes the computer `id`. */
export async function actOn(host: string, offers: Offers, id: string, action: ComputerAction): Promise<void> {
  const method = `x-ahpd/computers/${action}`;
  const bridge = hostBridge(host);
  if (offers.methods.includes(method)) {
    await bridge.request(method as never, { name: id } as never);
    return;
  }
  const uri = computerUri(computersRoot(offers), id);
  if (action === 'remove') await bridge.deleteResource(uri, false);
  else await bridge.writeResource(`${uri}/state`, STATE_OF[action], 'utf-8');
}

/** Makes the computer `name` from `manifest`, the answers to the host's manifest schema. */
export async function createComputer(host: string, offers: Offers, name: string, manifest: Record<string, unknown>): Promise<void> {
  const bridge = hostBridge(host);
  if (offers.methods.includes('x-ahpd/computers/create')) {
    await bridge.request('x-ahpd/computers/create' as never, { name, manifest } as never);
    return;
  }
  await bridge.writeResource(computerUri(computersRoot(offers), name), JSON.stringify(manifest), 'utf-8', true);
}
