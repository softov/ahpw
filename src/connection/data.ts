import type { BindingPath, DataProviderDefinition, ReactiveStore } from '@softov/scena/types';
import { MultiHostClient, ROOT_RESOURCE_URI, type HostState } from '@microsoft/agent-host-protocol/hosts';
import { WebSocketTransport } from '@microsoft/agent-host-protocol/ws';
import type { AgentInfo, CommandMap, SessionSummary, StateAction, TerminalInfo } from '@microsoft/agent-host-protocol';
import { readToken, serverHoldsToken } from '../api.js';
import { offering } from './protocol-versions.js';
import { readingServerInfo } from './server-info.js';
import { socketUrl } from './socket.js';
import { countsOf } from '../sessions/status.js';
import { logEvent } from '../log/log.js';
import { forgetFrames, observing } from '../log/wire.js';

/** The connection to the server, as `Connection`. */
export const AHP_CONNECTION = '$/ahp/connection' as BindingPath;
/** The server's sessions, newest first. */
export const AHP_SESSIONS = '$/ahp/sessions' as BindingPath;
/** The agents the server offers, as `initialize` and `root/agentsChanged` say. */
export const AHP_AGENTS = '$/ahp/agents' as BindingPath;
/** The folder the daemon names as its default, or null. */
export const AHP_DEFAULT_DIRECTORY = '$/ahp/defaultDirectory' as BindingPath;

/** Where a followed channel's state is kept. */
export const channelPath = (uri: string): BindingPath => `$/ahp/channels/${encodeURIComponent(uri)}` as BindingPath;
/** What the host lets clients do with automations, as `initialize` said, or null. */
export const AHP_AUTOMATION_CAPS = '$/ahp/automationCaps' as BindingPath;
/** How many sessions are idle and not read, archived ones left out. */
export const AHP_SESSIONS_UNREAD = '$/ahp/sessionCounts/unread' as BindingPath;
/** How many open sessions have a turn running. */
export const AHP_SESSIONS_WORKING = '$/ahp/sessionCounts/working' as BindingPath;
/** What the connection to the server says about it, as `HostFacts`. */
export const AHP_HOST = '$/ahp/host' as BindingPath;
/** The host software's name and version, as its last `initialize` answer said, as `ServerInfo`. */
export const AHP_SERVER = '$/ahp/server' as BindingPath;
/** The terminals this page has stopped following; their tabs stay, showing what they last drew. */
export const AHP_DETACHED = '$/ahp/terminals/detached' as BindingPath;

/** The connection's facts: the handshake's answers and what the host counts now. */
export interface HostFacts {
  label: string;
  clientId: string;
  protocolVersion: string | null;
  serverSeq: number;
  connectedAt: number | null;
  activeSessions: number | null;
  terminals: readonly TerminalInfo[];
  subscriptions: number;
}
/** A session's title as a tab shows it, kept current as the host renames it. */
export const titlePath = (resource: string): BindingPath => `$/ahp/titles/${encodeURIComponent(resource)}` as BindingPath;
/** Why a followed channel could not be read, or null. */
export const channelErrorPath = (uri: string): BindingPath => `$/ahp/channelErrors/${encodeURIComponent(uri)}` as BindingPath;

/** The root channel, which the host runtime keeps subscribed on its own. */
export const ROOT = ROOT_RESOURCE_URI;
/** The automations catalogue. */
export const AUTOMATIONS = 'ahp-automations://';

/** The one host this page talks to: the daemon that served it. */
const HOST = 'daemon';

/** The connection's state, the reason it last failed, how many times it has connected, and the retry it is on. */
export interface Connection {
  status: HostState['status'];
  error: string | null;
  generation: number;
  attempt?: number;
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
  /** The pending unsubscribe, while no page shows the channel. */
  release?: ReturnType<typeof setTimeout>;
}

/** How long a channel no page shows stays subscribed, so a page moved or reopened takes it back. */
const RELEASE_DELAY_MS = 2_000;

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
    if (result.snapshot !== undefined) {
      // A snapshot is newer than anything folded before it.
      pending.delete(channelPath(uri));
      store.set(channelPath(uri), result.snapshot.state);
    }
    store.set(channelErrorPath(uri), null);
  } catch (error) {
    store.set(channelErrorPath(uri), reasonOf(error));
  }
}

/**
 * Show a channel's state at `channelPath(uri)` until the returned function is
 * called. Pages showing the same channel share one subscription, kept a moment
 * after the last page lets go. The root channel is never unsubscribed, because
 * the host runtime reads it too.
 */
export function follow(uri: string, reducer: Reducer): () => void {
  const entry = followed.get(uri);
  if (entry !== undefined) {
    entry.count += 1;
    clearTimeout(entry.release);
    delete entry.release;
  } else {
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
    if (current.count > 0 || uri === ROOT) return;
    current.release = setTimeout(() => {
      if (followed.get(uri) !== current || current.count > 0) return;
      followed.delete(uri);
      void client?.unsubscribe(HOST, uri).catch(() => undefined);
    }, RELEASE_DELAY_MS);
  };
}

/** Read a followed channel again from the host. */
export async function refresh(uri: string): Promise<void> {
  if (followed.has(uri)) await snapshot(uri);
}

/** Ask the host for its sessions again, rather than wait for it to say they changed. */
export async function reloadSessions(): Promise<void> {
  const store = held;
  if (store === undefined) return;
  const result = await request('listSessions', { channel: ROOT } as never) as { items: SessionSummary[] };
  store.set(AHP_SESSIONS, sessionsByChange(result.items));
  for (const summary of result.items) store.set(titlePath(summary.resource), summary.title === '' ? 'Untitled' : summary.title);
}

/** A channel's state read once, without holding the subscription unless a page follows it. */
export async function readOnce<S>(uri: string): Promise<S | undefined> {
  const multi = client;
  if (multi === undefined) throw new Error('Not connected to the server.');
  const result = await multi.subscribe(HOST, uri);
  if (!followed.has(uri)) void multi.unsubscribe(HOST, uri).catch(() => undefined);
  return result.snapshot?.state as S | undefined;
}

/** A file's text, or null when it is not text. */
export interface FileText {
  text: string | null;
  contentType?: string;
}

/** Read a file, or the content behind a `ContentRef`, as text. */
export async function readText(uri: string): Promise<FileText> {
  const result = await request('resourceRead', { channel: ROOT, uri, encoding: 'utf-8' } as never) as { data: string; encoding: string; contentType?: string };
  return {
    text: String(result.encoding) === 'utf-8' ? result.data : null,
    ...(result.contentType === undefined ? {} : { contentType: result.contentType }),
  };
}

/** Whether a URI is a file, a folder, or nothing the host knows. */
export async function kindOfResource(uri: string): Promise<'file' | 'directory' | 'symlink' | null> {
  try {
    const result = await request('resourceResolve', { channel: ROOT, uri } as never) as { type: 'file' | 'directory' | 'symlink' };
    return result.type;
  } catch {
    return null;
  }
}

/** Send one action on a channel. */
export function dispatch(channel: string, action: StateAction): void {
  client?.dispatch(HOST, channel, action);
}

/** Ask the daemon one command. */
export async function request<M extends keyof CommandMap>(method: M, params: CommandMap[M]['params']): Promise<CommandMap[M]['result']> {
  const raw = client?.client(HOST)?.rawClient();
  if (raw === undefined) throw new Error('Not connected to the server.');
  return raw.request(method, params);
}

/** Write a value only when it differs, so an unchanged title wakes no tab. */
function setIfChanged(store: ReactiveStore, path: BindingPath, value: unknown): void {
  if (store.get(path) !== value) store.set(path, value);
}

function publishHost(store: ReactiveStore, multi: MultiHostClient): void {
  const summaries = sessionsByChange(multi.aggregatedSessions().map((one) => one.summary));
  store.set(AHP_SESSIONS, summaries);
  for (const summary of summaries) setIfChanged(store, titlePath(summary.resource), summary.title === '' ? 'Untitled' : summary.title);
  const counts = countsOf(summaries.map((one) => one.status));
  setIfChanged(store, AHP_SESSIONS_UNREAD, counts.unread);
  setIfChanged(store, AHP_SESSIONS_WORKING, counts.working);
  const host = multi.host(HOST);
  store.set(AHP_AGENTS, (host?.agents ?? []) as AgentInfo[]);
  store.set(AHP_DEFAULT_DIRECTORY, host?.defaultDirectory ?? null);
  store.set(AHP_AUTOMATION_CAPS, host?.automations ?? null);
  for (const terminal of host?.terminals ?? []) setIfChanged(store, titlePath(terminal.resource), terminal.title === '' ? 'Terminal' : terminal.title);
  store.set(AHP_HOST, host === undefined ? null : {
    label: host.label,
    clientId: host.clientId,
    protocolVersion: host.protocolVersion,
    serverSeq: host.serverSeq,
    connectedAt: host.lastConnectedAt,
    activeSessions: host.activeSessions,
    terminals: host.terminals ?? [],
    subscriptions: host.subscriptions.length,
  } satisfies HostFacts);
}

/** A connection status as a line of the log; a socket that dropped will not answer what it was asked. */
function noteStatus(state: HostState): void {
  if (state.status !== 'connected') forgetFrames();
  if (state.status === 'failed') logEvent({ scope: 'connection', level: 'error', text: `failed: ${state.error.message}` });
  else if (state.status === 'reconnecting') logEvent({ scope: 'connection', level: 'warn', text: `reconnecting (attempt ${state.attempt})` });
  else logEvent({ scope: 'connection', level: 'info', text: state.status });
}

async function watchHost(store: ReactiveStore, multi: MultiHostClient): Promise<void> {
  let generation = 0;
  for await (const event of multi.hostEvents()) {
    if (event.type === 'stateChanged') {
      const state = event.state;
      noteStatus(state);
      store.set(AHP_CONNECTION, {
        status: state.status,
        error: state.status === 'failed' ? state.error.message : event.lastError?.message ?? null,
        generation,
        ...(state.status === 'reconnecting' ? { attempt: state.attempt } : {}),
      } satisfies Connection);
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

/**
 * Channel states folded but not yet written, and whether the host's lists are due.
 *
 * A streaming turn sends dozens of frames a second. Each is folded here as it
 * arrives, and the store is written once per frame, so the page renders at the
 * screen's rate rather than the socket's.
 */
const pending = new Map<string, unknown>();
let hostDue = false;
let flushing: number | undefined;

function flush(store: ReactiveStore, multi: MultiHostClient): void {
  flushing = undefined;
  if (held !== store) return;
  for (const [path, state] of pending) store.set(path as BindingPath, state);
  pending.clear();
  if (hostDue) {
    hostDue = false;
    publishHost(store, multi);
  }
}

/** Write what is pending on the next frame; a hidden page, which gets no frames, on a timer. */
function schedule(store: ReactiveStore, multi: MultiHostClient): void {
  if (flushing !== undefined) return;
  flushing = document.hidden
    ? window.setTimeout(() => flush(store, multi), 100)
    : window.requestAnimationFrame(() => flush(store, multi));
}

async function watchChannels(store: ReactiveStore, multi: MultiHostClient): Promise<void> {
  for await (const tagged of multi.events()) {
    const event = tagged.event;
    if (event.type === 'sessionAdded' || event.type === 'sessionRemoved' || event.type === 'sessionSummaryChanged') {
      hostDue = true;
      schedule(store, multi);
      continue;
    }
    if (event.type !== 'action') continue;
    const { channel, action } = event.params;
    // Agents, terminals and the active count are the host's facts.
    if (channel === ROOT) {
      hostDue = true;
      schedule(store, multi);
    }
    const entry = followed.get(channel);
    if (entry === undefined) continue;
    const path = channelPath(channel);
    const state = pending.has(path) ? pending.get(path) : store.get(path);
    if (state === undefined) continue;
    try {
      pending.set(path, entry.reducer(state as never, action as never));
      schedule(store, multi);
    } catch {
      // A reducer that refuses one action leaves the state as it was.
    }
  }
}

async function connect(store: ReactiveStore, multi: MultiHostClient): Promise<void> {
  try {
    await multi.addHost({
      id: HOST,
      label: window.location.host,
      transportFactory: async () => readingServerInfo(offering(observing(await WebSocketTransport.connect(socketUrl(serverHoldsToken() ? null : readToken(), window.location, import.meta.env.DEV)))), (info) => store.set(AHP_SERVER, info)),
    });
  } catch (error) {
    store.set(AHP_CONNECTION, { status: 'failed', error: reasonOf(error), generation: 0 } satisfies Connection);
  }
}

/** Try the daemon again now, rather than when the backoff says. */
export async function reconnect(): Promise<void> {
  const multi = client;
  const store = held;
  if (multi === undefined || store === undefined) return;
  if (multi.host(HOST) === undefined) {
    await connect(store, multi);
    return;
  }
  store.set(AHP_CONNECTION, { ...(store.get(AHP_CONNECTION) as Connection), status: 'connecting' } satisfies Connection);
  await multi.reconnectHost(HOST).catch(() => undefined);
}

/** A page coming back into view, or the network coming back, retries at once. */
function wake(): void {
  if (document.visibilityState !== 'visible') return;
  const status = client?.host(HOST)?.state.status;
  if (status === undefined || status === 'reconnecting' || status === 'failed' || status === 'disconnected') void reconnect();
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
      window.addEventListener('online', wake);
      document.addEventListener('visibilitychange', wake);
      await connect(store, multi);
    },
    async unload(store) {
      window.removeEventListener('online', wake);
      document.removeEventListener('visibilitychange', wake);
      const multi = client;
      client = undefined;
      held = undefined;
      for (const entry of followed.values()) clearTimeout(entry.release);
      followed.clear();
      pending.clear();
      hostDue = false;
      store.clearNamespace('ahp');
      await multi?.shutdown();
    },
  },
};
