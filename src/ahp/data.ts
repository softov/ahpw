import type { BindingPath, DataProviderDefinition, ReactiveStore } from '@softov/scena/types';
import { MultiHostClient, ROOT_RESOURCE_URI, type HostState } from '@microsoft/agent-host-protocol/hosts';
import { WebSocketTransport } from '@microsoft/agent-host-protocol/ws';
import type { AgentInfo, CommandMap, SessionSummary, StateAction } from '@microsoft/agent-host-protocol';
import { readToken } from '../api.js';
import { socketUrl } from './socket.js';

/** The connection to the daemon, as `Connection`. */
export const AHP_CONNECTION = '$/ahp/connection' as BindingPath;
/** The daemon's sessions, newest first. */
export const AHP_SESSIONS = '$/ahp/sessions' as BindingPath;
/** The agents the daemon offers, as `initialize` and `root/agentsChanged` say. */
export const AHP_AGENTS = '$/ahp/agents' as BindingPath;
/** The folder the daemon names as its default, or null. */
export const AHP_DEFAULT_DIRECTORY = '$/ahp/defaultDirectory' as BindingPath;
/** The resource of the session open in `main`. */
export const ACTIVE_SESSION = '$/ahp/active' as BindingPath;
/** The resource of the automation open in `main`. */
export const ACTIVE_AUTOMATION = '$/ahp/activeAutomation' as BindingPath;

/** Where a followed channel's state is kept. */
export const channelPath = (uri: string): BindingPath => `$/ahp/channels/${encodeURIComponent(uri)}` as BindingPath;
/** Why a followed channel could not be read, or null. */
export const channelErrorPath = (uri: string): BindingPath => `$/ahp/channelErrors/${encodeURIComponent(uri)}` as BindingPath;

/** The root channel, which the host runtime keeps subscribed on its own. */
export const ROOT = ROOT_RESOURCE_URI;
/** The automations catalogue. */
export const AUTOMATIONS = 'ahp-automations://';

/** The one host this page talks to: the daemon that served it. */
const HOST = 'daemon';

/** The connection's state, the reason it last failed, and how many times it has connected. */
export interface Connection {
  status: HostState['status'];
  error: string | null;
  generation: number;
}

/** Folds one action into a channel's state. */
export type Reducer = (state: never, action: never) => unknown;

/** The sessions, newest change first. */
export function sessionsByChange(summaries: readonly SessionSummary[]): SessionSummary[] {
  return [...summaries].sort((a, b) => b.modifiedAt.localeCompare(a.modifiedAt));
}

/** A channel some page shows, and how many pages show it. */
interface Followed {
  count: number;
  reducer: Reducer;
}

/** The live client and store, while the provider is loaded. */
let client: MultiHostClient | undefined;
let held: ReactiveStore | undefined;
const followed = new Map<string, Followed>();

/** The SDK's own reason, without its class name. */
const reasonOf = (error: unknown): string => (error instanceof Error ? error.message : String(error));

async function snapshot(uri: string): Promise<void> {
  const multi = client;
  const store = held;
  if (multi === undefined || store === undefined) return;
  try {
    const result = await multi.subscribe(HOST, uri);
    if (!followed.has(uri)) return;
    if (result.snapshot !== undefined) store.set(channelPath(uri), result.snapshot.state);
    store.set(channelErrorPath(uri), null);
  } catch (error) {
    store.set(channelErrorPath(uri), reasonOf(error));
  }
}

/**
 * Show a channel's state at `channelPath(uri)` until the returned function is
 * called. Pages showing the same channel share one subscription, and the root
 * channel is never unsubscribed, because the host runtime reads it too.
 */
export function follow(uri: string, reducer: Reducer): () => void {
  const entry = followed.get(uri);
  if (entry !== undefined) entry.count += 1;
  else {
    followed.set(uri, { count: 1, reducer });
    if (client?.host(HOST)?.state.status === 'connected') void snapshot(uri);
  }
  let done = false;
  return () => {
    if (done) return;
    done = true;
    const current = followed.get(uri);
    if (current === undefined) return;
    current.count -= 1;
    if (current.count > 0) return;
    followed.delete(uri);
    if (uri !== ROOT) void client?.unsubscribe(HOST, uri).catch(() => undefined);
  };
}

/** Send one action on a channel. */
export function dispatch(channel: string, action: StateAction): void {
  client?.dispatch(HOST, channel, action);
}

/** Ask the daemon one command. */
export async function request<M extends keyof CommandMap>(method: M, params: CommandMap[M]['params']): Promise<CommandMap[M]['result']> {
  const raw = client?.client(HOST)?.rawClient();
  if (raw === undefined) throw new Error('Not connected to the daemon.');
  return raw.request(method, params);
}

function publishHost(store: ReactiveStore, multi: MultiHostClient): void {
  store.set(AHP_SESSIONS, sessionsByChange(multi.aggregatedSessions().map((one) => one.summary)));
  const host = multi.host(HOST);
  store.set(AHP_AGENTS, (host?.agents ?? []) as AgentInfo[]);
  store.set(AHP_DEFAULT_DIRECTORY, host?.defaultDirectory ?? null);
}

async function watchHost(store: ReactiveStore, multi: MultiHostClient): Promise<void> {
  let generation = 0;
  for await (const event of multi.hostEvents()) {
    if (event.type === 'stateChanged') {
      store.set(AHP_CONNECTION, { status: event.state.status, error: event.lastError?.message ?? null, generation } satisfies Connection);
    }
    if (event.type === 'connected') {
      generation = event.generation;
      store.set(AHP_CONNECTION, { status: 'connected', error: null, generation } satisfies Connection);
      publishHost(store, multi);
      // A new connection starts with no subscriptions of this page's own.
      for (const uri of followed.keys()) void snapshot(uri);
    }
  }
}

async function watchChannels(store: ReactiveStore, multi: MultiHostClient): Promise<void> {
  for await (const tagged of multi.events()) {
    const event = tagged.event;
    if (event.type === 'sessionAdded' || event.type === 'sessionRemoved' || event.type === 'sessionSummaryChanged') {
      publishHost(store, multi);
      continue;
    }
    if (event.type !== 'action') continue;
    const { channel, action } = event.params;
    if (channel === ROOT && action.type === 'root/agentsChanged') publishHost(store, multi);
    const entry = followed.get(channel);
    if (entry === undefined) continue;
    const path = channelPath(channel);
    const state = store.get(path);
    if (state === undefined) continue;
    try {
      store.set(path, entry.reducer(state as never, action as never));
    } catch {
      // A reducer that refuses one action leaves the state as it was.
    }
  }
}

export const ahpProvider: DataProviderDefinition = {
  namespace: 'ahp',
  load: 'eager',
  provider: {
    async load(store) {
      const multi = new MultiHostClient();
      client = multi;
      held = store;
      store.set(AHP_CONNECTION, { status: 'connecting', error: null, generation: 0 } satisfies Connection);
      void watchHost(store, multi);
      void watchChannels(store, multi);
      try {
        await multi.addHost({
          id: HOST,
          label: 'ahpd',
          transportFactory: () => WebSocketTransport.connect(socketUrl(readToken(), window.location, import.meta.env.DEV)),
        });
      } catch (error) {
        store.set(AHP_CONNECTION, { status: 'failed', error: reasonOf(error), generation: 0 } satisfies Connection);
      }
    },
    async unload(store) {
      const multi = client;
      client = undefined;
      held = undefined;
      followed.clear();
      store.clearNamespace('ahp');
      await multi?.shutdown();
    },
  },
};
