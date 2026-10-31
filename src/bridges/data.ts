import { translate } from '@softov/scena';
import type { BindingPath, DataProviderDefinition, ReactiveStore } from '@softov/scena/types';
import { MultiHostClient, ROOT_RESOURCE_URI, type HostState } from '@microsoft/agent-host-protocol/hosts';
import { localClientIds } from './client-ids.js';
import { WebSocketTransport } from '@microsoft/agent-host-protocol/ws';
import { RpcError } from '@microsoft/agent-host-protocol/client';
import { hostSaid } from './said.js';
import type { AgentInfo, CommandMap, SessionSummary, StateAction, TerminalInfo } from '@microsoft/agent-host-protocol';
import { readToken, servedDaemon, serverHoldsToken } from '../lib/api.js';
import { embedder, embedMode, type EmbedHost } from '../shell/embed/index.js';
import { offering } from './protocol-versions.js';
import { readingServerInfo } from './server-info.js';
import { offersOf } from './offers.js';
import { keepTrust, readTrust, trustAction, trustedUris } from './trust.js';
import { hostSocketUrl, plainUrl, socketUrl } from './socket.js';
import { NOTHING_NEWER, heard, laid, listed, type Newer } from './summaries.js';
import { countsOf } from '../resources/sessions/status.js';
import { logEvent } from '../resources/log/log.js';
import { forgetFrames, observing } from '../resources/log/wire.js';

/** Where one host's facts are kept: under `$/ahp/hosts/<host id>/`. */
const hostBase = (host: string): string => `$/ahp/hosts/${encodeURIComponent(host)}`;

/** The store paths of one host's facts. */
export interface AhpPaths {
  /** The connection to the host, as `Connection`. */
  connection: BindingPath;
  /** The host's sessions, newest first. */
  sessions: BindingPath;
  /** The agents the host offers, as `initialize` and `root/agentsChanged` say. */
  agents: BindingPath;
  /** The folder the host names as its default, or null. */
  defaultDirectory: BindingPath;
  /** What the host lets clients do with automations, as `initialize` said, or null. */
  automationCaps: BindingPath;
  /** How many sessions are idle and not read, archived ones left out. */
  sessionsUnread: BindingPath;
  /** How many open sessions have a turn running. */
  sessionsWorking: BindingPath;
  /** What the connection to the host says about it, as `HostFacts`. */
  host: BindingPath;
  /** The host software's name and version, as its last `initialize` answer said, as `ServerInfo`. */
  server: BindingPath;
  /** What the host's plugins offer beyond AHP, as its last `initialize` answer said, as `Offers`. */
  offers: BindingPath;
  /** The host's terminals this page has stopped following; their tabs stay, showing what they last drew. */
  detached: BindingPath;
  /** In multi, whether the host refuses the token its socket offers; undefined until a failure asked. */
  refused: BindingPath;
}

const pathsByHost = new Map<string, AhpPaths>();

/** The store paths of the host `host`'s facts; the same object each time. */
export function ahpPaths(host: string): AhpPaths {
  let paths = pathsByHost.get(host);
  if (paths === undefined) {
    const base = hostBase(host);
    const at = (rest: string): BindingPath => `${base}/${rest}` as BindingPath;
    paths = {
      connection: at('connection'),
      sessions: at('sessions'),
      agents: at('agents'),
      defaultDirectory: at('defaultDirectory'),
      automationCaps: at('automationCaps'),
      sessionsUnread: at('sessionCounts/unread'),
      sessionsWorking: at('sessionCounts/working'),
      host: at('host'),
      server: at('server'),
      offers: at('offers'),
      detached: at('terminals/detached'),
      refused: at('refused'),
    };
    pathsByHost.set(host, paths);
  }
  return paths;
}

/** Where a followed channel's state is kept. */
export const channelPath = (host: string, uri: string): BindingPath => `${hostBase(host)}/channels/${encodeURIComponent(uri)}` as BindingPath;

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
/** A session's or a terminal's title as a tab shows it, kept current as the host renames it. */
export const titlePath = (host: string, resource: string): BindingPath => `${hostBase(host)}/titles/${encodeURIComponent(resource)}` as BindingPath;
/** Why a followed channel could not be read, or null. */
export const channelErrorPath = (host: string, uri: string): BindingPath => `${hostBase(host)}/channelErrors/${encodeURIComponent(uri)}` as BindingPath;

/** The root channel, which the host runtime keeps subscribed on its own. */
export const ROOT = ROOT_RESOURCE_URI;
/** The automations catalogue. */
export const AUTOMATIONS = 'ahp-automations://';

/**
 * The one host of a mono page: the daemon that served it, the host named on
 * `ahpw serve`, or the desk window's host. A page with every host names each
 * by the desk's id instead (hosts plan 02).
 */
const MONO_HOST = 'daemon';

/** The host this page shows. A window with every host has none: its callers name each host. */
export function windowHost(): string {
  if (embedMode() === 'multi') throw new Error('No window host in a window with every host');
  return MONO_HOST;
}

/** Every host this page connects to: the embedder's hosts in multi, else the one host. */
export async function windowHosts(): Promise<string[]> {
  if (embedder !== undefined && embedMode() === 'multi') return (await embedder.hosts()).map((host) => host.id);
  return [MONO_HOST];
}

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

/** A request waiting for its host to connect; see `ready`. */
interface Waiter {
  resolve: () => void;
  reject: (error: Error) => void;
}

/** What this page holds of one host. */
interface HostData {
  /** What is known of each session newer than the SDK's session cache (see summaries.ts). */
  newer: Newer;
  followed: Map<string, Followed>;
  waiting: Set<Waiter>;
  /** How many times the host has connected, as its last `connected` event said. */
  generation: number;
}

/** The live client and store, while the provider is loaded. */
let client: MultiHostClient | undefined;
let held: ReactiveStore | undefined;
const hosts = new Map<string, HostData>();

function dataOf(id: string): HostData {
  let data = hosts.get(id);
  if (data === undefined) {
    data = { newer: NOTHING_NEWER, followed: new Map(), waiting: new Set(), generation: 0 };
    hosts.set(id, data);
  }
  return data;
}

/** Let one host's waiting requests go: on, once it is connected, or refused with `error`. */
function settleWaiting(id: string, error?: Error): void {
  const data = hosts.get(id);
  if (data === undefined) return;
  const all = [...data.waiting];
  data.waiting.clear();
  for (const one of all) {
    if (error === undefined) one.resolve();
    else one.reject(error);
  }
}

/**
 * The client, once the host `id` can answer. A request made while the page
 * connects or reconnects waits for the connection, so a page restored on a
 * reload reads when the socket is up instead of failing first; one made after
 * the host gave up is refused. One host failing refuses only its own requests.
 */
async function ready(id: string): Promise<MultiHostClient> {
  for (;;) {
    const multi = client;
    if (multi === undefined) throw new Error(translate('bridges/notConnected'));
    const status = multi.host(id)?.state.status;
    if (status === 'connected' && multi.client(id)?.rawClient() !== undefined) return multi;
    if (status === 'failed') throw new Error(translate('bridges/notConnected'));
    await new Promise<void>((resolve, reject) => dataOf(id).waiting.add({ resolve, reject }));
  }
}

/** The SDK's own reason, without its class name. */
/** Why a channel could not be read, in the host's own words, without the client's `RPC error <code>:`. */
const reasonOf = (error: unknown): string => hostSaid(error);

async function snapshot(id: string, uri: string): Promise<void> {
  const multi = client;
  const store = held;
  if (multi === undefined || store === undefined) return;
  try {
    const result = await multi.subscribe(id, uri);
    if (!dataOf(id).followed.has(uri)) return;
    if (result.snapshot !== undefined) {
      // A snapshot is newer than anything folded before it.
      pending.delete(channelPath(id, uri));
      store.set(channelPath(id, uri), result.snapshot.state);
    }
    store.set(channelErrorPath(id, uri), null);
  } catch (error) {
    store.set(channelErrorPath(id, uri), reasonOf(error));
  }
}

/** A file's text, or null when it is not text. */
export interface FileText {
  text: string | null;
  contentType?: string;
}

/** Everything the page asks of one host. */
export interface HostBridge {
  /** The host's id. */
  readonly id: string;
  /**
   * Show a channel's state at `channelPath(id, uri)` until the returned function is
   * called. Pages showing the same channel share one subscription, kept a moment
   * after the last page lets go. The root channel is never unsubscribed, because
   * the host runtime reads it too.
   */
  follow(uri: string, reducer: Reducer): () => void;
  /** Read a followed channel again from the host. */
  refresh(uri: string): Promise<void>;
  /** Ask the host for its sessions again, rather than wait for it to say they changed. */
  reloadSessions(): Promise<void>;
  /** A channel's state read once, without holding the subscription unless a page follows it. */
  readOnce<S>(uri: string): Promise<S | undefined>;
  /** Read a file, or the content behind a `ContentRef`, as text. */
  readText(uri: string): Promise<FileText>;
  /** A file's bytes as a blob of `type`, read base64 so binary arrives whole. */
  readBlob(uri: string, type: string): Promise<Blob>;
  /** A file's size in bytes, or undefined when the host does not say. */
  sizeOf(uri: string): Promise<number | undefined>;
  /** Write a file's text, replacing what it held. With `ifMatch`, the host refuses when the file is no longer that version. */
  writeText(uri: string, text: string, ifMatch?: string): Promise<void>;
  /** The version a file is at, as the host tags it; undefined when the host gives none. */
  etagOf(uri: string): Promise<string | undefined>;
  /** Whether a URI is a file, a folder, or nothing the host knows. */
  kindOfResource(uri: string): Promise<'file' | 'directory' | 'symlink' | null>;
  /** Read a file as base64, whatever it holds. A host that answers in text gives its text instead. */
  readBase64(uri: string): Promise<{ data: string; encoding: string; contentType?: string }>;
  /** Write a file, in text or base64. `createOnly` refuses a file that is there already. */
  writeResource(uri: string, data: string, encoding: 'utf-8' | 'base64', createOnly?: boolean): Promise<void>;
  /** Make a folder, and its parents as needed. */
  makeFolder(uri: string): Promise<void>;
  /** Move or rename, refusing to land on something that is there already. */
  moveResource(source: string, destination: string): Promise<void>;
  /** Copy, refusing to land on something that is there already. */
  copyResource(source: string, destination: string): Promise<void>;
  /** Delete a file, or a folder with `recursive` and everything in it. */
  deleteResource(uri: string, recursive: boolean): Promise<void>;
  /** Send one action on a channel. */
  dispatch(channel: string, action: StateAction): void;
  /**
   * Send one action and wait for the host to say it back: null once it took
   * it, or the host's reason when it refused. A dispatch is a notification, so
   * its echo, matched by client sequence, is the only answer there is.
   */
  dispatchAndWait(channel: string, action: StateAction): Promise<string | null>;
  /** Ask the host one command. */
  request<M extends keyof CommandMap>(method: M, params: CommandMap[M]['params']): Promise<CommandMap[M]['result']>;
  /** Try the host again now, rather than when the backoff says. */
  reconnect(): Promise<void>;
}

function makeBridge(id: string): HostBridge {
  const request = async <M extends keyof CommandMap>(method: M, params: CommandMap[M]['params']): Promise<CommandMap[M]['result']> => {
    const raw = (await ready(id)).client(id)?.rawClient();
    if (raw === undefined) throw new Error(translate('bridges/notConnected'));
    return raw.request(method, params);
  };
  return {
    id,
    follow(uri, reducer) {
      const followed = dataOf(id).followed;
      const entry = followed.get(uri);
      if (entry !== undefined) {
        entry.count += 1;
        clearTimeout(entry.release);
        delete entry.release;
      } else {
        followed.set(uri, { count: 1, reducer });
        if (client?.host(id)?.state.status === 'connected') void snapshot(id, uri);
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
          void client?.unsubscribe(id, uri).catch(() => undefined);
        }, RELEASE_DELAY_MS);
      };
    },
    async refresh(uri) {
      if (dataOf(id).followed.has(uri)) await snapshot(id, uri);
    },
    async reloadSessions() {
      const store = held;
      if (store === undefined) return;
      const result = await request('listSessions', { channel: ROOT } as never) as { items: SessionSummary[] };
      dataOf(id).newer = listed(result.items);
      store.set(ahpPaths(id).sessions, sessionsByChange(result.items));
      for (const summary of result.items) store.set(titlePath(id, summary.resource), summary.title === '' ? translate('bridges/untitled') : summary.title);
    },
    async readOnce<S>(uri: string) {
      const multi = await ready(id);
      const result = await multi.subscribe(id, uri);
      if (!dataOf(id).followed.has(uri)) void multi.unsubscribe(id, uri).catch(() => undefined);
      return result.snapshot?.state as S | undefined;
    },
    async readText(uri) {
      const result = await request('resourceRead', { channel: ROOT, uri, encoding: 'utf-8' } as never) as { data: string; encoding: string; contentType?: string };
      return {
        text: String(result.encoding) === 'utf-8' ? result.data : null,
        ...(result.contentType === undefined ? {} : { contentType: result.contentType }),
      };
    },
    async readBlob(uri, type) {
      const result = await request('resourceRead', { channel: ROOT, uri, encoding: 'base64' } as never) as { data: string; encoding: string };
      if (String(result.encoding) !== 'base64') return new Blob([result.data], { type });
      const binary = atob(result.data);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      return new Blob([bytes], { type });
    },
    async sizeOf(uri) {
      const result = await request('resourceResolve', { channel: ROOT, uri } as never) as { size?: number };
      return result.size;
    },
    async writeText(uri, text, ifMatch) {
      await request('resourceWrite', { channel: ROOT, uri, data: text, encoding: 'utf-8', ...(ifMatch === undefined ? {} : { ifMatch }) } as never);
    },
    async etagOf(uri) {
      const result = await request('resourceResolve', { channel: ROOT, uri } as never) as { etag?: string };
      return result.etag;
    },
    async kindOfResource(uri) {
      try {
        const result = await request('resourceResolve', { channel: ROOT, uri } as never) as { type: 'file' | 'directory' | 'symlink' };
        return result.type;
      } catch {
        return null;
      }
    },
    async readBase64(uri) {
      return await request('resourceRead', { channel: ROOT, uri, encoding: 'base64' } as never) as { data: string; encoding: string; contentType?: string };
    },
    async writeResource(uri, data, encoding, createOnly = false) {
      await request('resourceWrite', { channel: ROOT, uri, data, encoding, ...(createOnly ? { createOnly } : {}) } as never);
    },
    async makeFolder(uri) {
      await request('resourceMkdir', { channel: ROOT, uri } as never);
    },
    async moveResource(source, destination) {
      await request('resourceMove', { channel: ROOT, source, destination, failIfExists: true } as never);
    },
    async copyResource(source, destination) {
      await request('resourceCopy', { channel: ROOT, source, destination, failIfExists: true } as never);
    },
    async deleteResource(uri, recursive) {
      await request('resourceDelete', { channel: ROOT, uri, recursive } as never);
    },
    dispatch(channel, action) {
      client?.dispatch(id, channel, action);
    },
    dispatchAndWait(channel, action) {
      if (client === undefined || client.host(id)?.state.status !== 'connected') return Promise.reject(new Error(translate('bridges/notConnected')));
      const { clientSeq } = client.dispatch(id, channel, action);
      return awaitEcho(id, channel, clientSeq);
    },
    request,
    reconnect: () => reconnectHost(id),
  };
}

const bridges = new Map<string, HostBridge>();

/** The handle for the host `id`; the same handle each time. */
export function hostBridge(id: string): HostBridge {
  let bridge = bridges.get(id);
  if (bridge === undefined) {
    bridge = makeBridge(id);
    bridges.set(id, bridge);
  }
  return bridge;
}

/** Write a value only when it differs, so an unchanged title wakes no tab. */
function setIfChanged(store: ReactiveStore, path: BindingPath, value: unknown): void {
  if (store.get(path) !== value) store.set(path, value);
}

function publishHost(store: ReactiveStore, multi: MultiHostClient, id: string): void {
  const newer = dataOf(id).newer;
  const summaries = sessionsByChange(multi.aggregatedSessions().filter((one) => one.hostId === id).map((one) => laid(one.summary, newer)));
  store.set(ahpPaths(id).sessions, summaries);
  for (const summary of summaries) setIfChanged(store, titlePath(id, summary.resource), summary.title === '' ? translate('bridges/untitled') : summary.title);
  const counts = countsOf(summaries.map((one) => one.status));
  setIfChanged(store, ahpPaths(id).sessionsUnread, counts.unread);
  setIfChanged(store, ahpPaths(id).sessionsWorking, counts.working);
  const host = multi.host(id);
  store.set(ahpPaths(id).agents, (host?.agents ?? []) as AgentInfo[]);
  store.set(ahpPaths(id).defaultDirectory, host?.defaultDirectory ?? null);
  store.set(ahpPaths(id).automationCaps, host?.automations ?? null);
  for (const terminal of host?.terminals ?? []) setIfChanged(store, titlePath(id, terminal.resource), terminal.title === '' ? translate('bridges/terminal') : terminal.title);
  store.set(ahpPaths(id).host, host === undefined ? null : {
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
function noteStatus(id: string, state: HostState): void {
  if (state.status !== 'connected') forgetFrames(id);
  if (state.status === 'failed') logEvent({ scope: 'connection', level: 'error', text: `failed: ${state.error.message}` });
  else if (state.status === 'reconnecting') logEvent({ scope: 'connection', level: 'warn', text: `reconnecting (attempt ${state.attempt})` });
  else logEvent({ scope: 'connection', level: 'info', text: state.status });
}

async function watchHost(store: ReactiveStore, multi: MultiHostClient): Promise<void> {
  for await (const event of multi.hostEvents()) {
    const id = event.hostId;
    if (event.type === 'stateChanged') {
      const state = event.state;
      noteStatus(id, state);
      if (state.status === 'failed') settleWaiting(id, new Error(translate('bridges/notConnected')));
      store.set(ahpPaths(id).connection, {
        status: state.status,
        error: state.status === 'failed' ? state.error.message : event.lastError?.message ?? null,
        generation: dataOf(id).generation,
        ...(state.status === 'reconnecting' ? { attempt: state.attempt } : {}),
      } satisfies Connection);
      if (state.status === 'failed' || state.status === 'reconnecting' || state.status === 'disconnected') void noteRefusal(store, id);
    }
    if (event.type === 'connected') {
      const data = dataOf(id);
      data.generation = event.generation;
      // A connection lists the sessions afresh into the SDK's cache.
      data.newer = NOTHING_NEWER;
      store.set(ahpPaths(id).connection, { status: 'connected', error: null, generation: data.generation } satisfies Connection);
      setIfChanged(store, ahpPaths(id).refused, undefined);
      publishHost(store, multi, id);
      greet(store, multi, id);
      // A new connection starts with no subscriptions of this page's own.
      for (const uri of data.followed.keys()) void snapshot(id, uri);
      settleWaiting(id);
    }
  }
}

/**
 * Channel states folded but not yet written, and the hosts whose lists are due.
 *
 * A streaming turn sends dozens of frames a second. Each is folded here as it
 * arrives, and the store is written once per frame, so the page renders at the
 * screen's rate rather than the socket's.
 */
const pending = new Map<string, unknown>();
const hostsDue = new Set<string>();
let flushing: number | undefined;

function flush(store: ReactiveStore, multi: MultiHostClient): void {
  flushing = undefined;
  if (held !== store) return;
  for (const [path, state] of pending) store.set(path as BindingPath, state);
  pending.clear();
  for (const id of hostsDue) publishHost(store, multi, id);
  hostsDue.clear();
}

/** Write what is pending on the next frame; a hidden page, which gets no frames, on a timer. */
function schedule(store: ReactiveStore, multi: MultiHostClient): void {
  if (flushing !== undefined) return;
  flushing = document.hidden
    ? window.setTimeout(() => flush(store, multi), 100)
    : window.requestAnimationFrame(() => flush(store, multi));
}

/** How long a dispatch waits for its echo before it is taken as unanswered. */
const ECHO_WAIT_MS = 15_000;

/** Dispatches waiting for their echo, by host, channel and client sequence. */
const echoes = new Map<string, (reason: string | null) => void>();
const echoKey = (id: string, channel: string, seq: number): string => `${id}\u{0000}${channel}\u{0000}${String(seq)}`;

function awaitEcho(id: string, channel: string, seq: number): Promise<string | null> {
  return new Promise((resolve, reject) => {
    const key = echoKey(id, channel, seq);
    const timer = window.setTimeout(() => {
      echoes.delete(key);
      reject(new Error(translate('bridges/noAnswer')));
    }, ECHO_WAIT_MS);
    echoes.set(key, (reason) => {
      window.clearTimeout(timer);
      echoes.delete(key);
      resolve(reason);
    });
  });
}

/** The method ahpd, as VS Code's agent host, asks a client with before a session moves to or adds a folder it does not trust. */
const TRUST_REQUEST = 'vscode/requestWorkspaceTrust';

/**
 * What a client says when a host connects: the folders this browser trusts,
 * which the host keeps on this connection only, and an answer to the host's
 * own trust question. A new connection is a new client, so both are done on
 * every connect, before any session's first turn.
 */
function greet(store: ReactiveStore, multi: MultiHostClient, id: string): void {
  const answers = readTrust(id);
  keepTrust(store, id, answers);
  const uris = trustedUris(answers);
  if (uris.length > 0) multi.dispatch(id, ROOT, trustAction(uris));
  multi.client(id)?.rawClient().setServerRequestHandler((async (method: string, params: unknown) => {
    if (method !== TRUST_REQUEST) throw new RpcError(-32601, `ahpw does not answer ${method}`);
    const workspace = (params as { workspace?: unknown } | undefined)?.workspace;
    if (typeof workspace !== 'string' || workspace === '') throw new RpcError(-32602, `${TRUST_REQUEST} needs workspace, a folder URI`);
    // Loaded when asked: the prompt reaches back into this module.
    const { answerTrust } = await import('./trust-ask.js');
    return { trusted: await answerTrust(store, id, workspace) };
  }) as never);
}

async function watchChannels(store: ReactiveStore, multi: MultiHostClient): Promise<void> {
  for await (const tagged of multi.events()) {
    const id = tagged.hostId;
    const event = tagged.event;
    if (event.type === 'sessionAdded' || event.type === 'sessionRemoved' || event.type === 'sessionSummaryChanged') {
      const data = dataOf(id);
      data.newer = heard(data.newer, event);
      hostsDue.add(id);
      schedule(store, multi);
      continue;
    }
    if (event.type !== 'action') continue;
    const { channel, action } = event.params;
    const seq = (event.params as { origin?: { clientSeq?: unknown } }).origin?.clientSeq;
    if (typeof seq === 'number') {
      const waiting = echoes.get(echoKey(id, channel, seq));
      if (waiting !== undefined) {
        const reason = (event.params as { rejectionReason?: unknown }).rejectionReason;
        waiting(typeof reason === 'string' ? reason : null);
      }
    }
    // Agents, terminals and the active count are the host's facts.
    if (channel === ROOT) {
      hostsDue.add(id);
      schedule(store, multi);
    }
    const entry = dataOf(id).followed.get(channel);
    if (entry === undefined) continue;
    const path = channelPath(id, channel);
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

/**
 * The socket to the host `id`. In an embedder it is that host's address, with
 * the token the embedder keeps, both read again on each connect so a changed
 * address or token takes effect on the next one; in a browser it is the server
 * that sent the page.
 */
async function openSocket(id: string): Promise<WebSocketTransport> {
  if (embedder === undefined) return WebSocketTransport.connect(socketUrl(serverHoldsToken() ? null : readToken(), window.location, import.meta.env.DEV));
  const host = await embeddedHost(id);
  addresses.set(id, host.url);
  return WebSocketTransport.connect(hostSocketUrl(host.url, await embedder.token(embedMode() === 'multi' ? id : undefined)));
}

/**
 * Where host `id` answers HTTP, which a connector's URL starts with: the
 * address an embedder gave for it, the daemon a server in front of the page
 * names, or else the page's own origin, which is the daemon's when its web
 * plugin sent the page. Nothing for an embedded host not yet connected.
 *
 * A daemon with a routes listener answers webhooks on another port, which no
 * host says yet; ahpd is asked to advertise its public root.
 */
export function httpRoot(id: string): string | undefined {
  if (embedder !== undefined) {
    const address = addresses.get(id);
    return address === undefined ? undefined : new URL(plainUrl(address)).origin;
  }
  return servedDaemon() ?? window.location.origin;
}

/** The embedder's host `id`: in multi one of its hosts, else the page's host. */
async function embeddedHost(id: string): Promise<EmbedHost> {
  if (embedder === undefined) throw new Error('No embedder');
  if (embedMode() !== 'multi') return embedder.host();
  const host = (await embedder.hosts()).find((one) => one.id === id);
  if (host === undefined) throw new Error(`The embedder has no host ${id}`);
  return host;
}

/** In an embedder, the address each host's last socket went to, so a change of it reconnects. */
const addresses = new Map<string, string>();
/** The hosts this page added to the client, so a host the embedder drops is let go. */
const joined = new Set<string>();

/** Add the window's host to the client. */
async function connect(store: ReactiveStore, multi: MultiHostClient): Promise<void> {
  await Promise.all((await windowHosts()).map((id) => addOne(store, multi, id)));
}

/** Add the host `id` to the client; a failure is its connection's state, not the page's. */
async function addOne(store: ReactiveStore, multi: MultiHostClient, id: string): Promise<void> {
  joined.add(id);
  store.set(ahpPaths(id).connection, { status: 'connecting', error: null, generation: 0 } satisfies Connection);
  setIfChanged(store, ahpPaths(id).refused, undefined);
  try {
    await multi.addHost({
      id,
      label: embedder !== undefined ? (await embeddedHost(id)).name : window.location.host,
      transportFactory: async () => readingServerInfo(offering(observing(id, await openSocket(id))), (info, meta) => {
        store.set(ahpPaths(id).server, info);
        store.set(ahpPaths(id).offers, offersOf(meta));
      }),
    });
  } catch (error) {
    store.set(ahpPaths(id).connection, { status: 'failed', error: reasonOf(error), generation: 0 } satisfies Connection);
    settleWaiting(id, new Error(translate('bridges/notConnected')));
    void noteRefusal(store, id);
  }
}

/**
 * In multi, whether the host `id`, which will not connect, refuses its token.
 *
 * A browser's socket does not say why it closed, so the address is asked over
 * plain HTTP, which ahpd answers 401 for a token it refuses. A host that does
 * not answer is down, not refused. It is asked once per failure: the answer is
 * forgotten when the host connects or a person retries it.
 */
async function noteRefusal(store: ReactiveStore, id: string): Promise<void> {
  const url = addresses.get(id);
  if (embedder === undefined || embedMode() !== 'multi' || url === undefined) return;
  if (store.get<boolean>(ahpPaths(id).refused) !== undefined) return;
  let refused = false;
  try {
    refused = (await fetch(plainUrl(hostSocketUrl(url, await embedder.token(id))))).status === 401;
  } catch {
    // No answer: the host is down.
  }
  if (store.get<Connection>(ahpPaths(id).connection)?.status !== 'connected') setIfChanged(store, ahpPaths(id).refused, refused);
}

/** Try the host `id` again now, rather than when the backoff says. */
async function reconnectHost(id: string): Promise<void> {
  const multi = client;
  const store = held;
  if (multi === undefined || store === undefined) return;
  if (multi.host(id) === undefined) {
    // Only a host this page connects to is added again; another is not known here.
    if ((await windowHosts()).includes(id)) await addOne(store, multi, id);
    return;
  }
  store.set(ahpPaths(id).connection, { ...(store.get(ahpPaths(id).connection) as Connection), status: 'connecting' } satisfies Connection);
  // A retry may follow a new token, so the next failure asks again.
  setIfChanged(store, ahpPaths(id).refused, undefined);
  await multi.reconnectHost(id).catch(() => undefined);
}

/** Stops following the embedder's host list. */
let stopFollowingHosts: (() => void) | undefined;

/**
 * The embedder's new host list. A new address reconnects that host; in multi a
 * new host is added and a removed one let go.
 */
async function followHosts(list: EmbedHost[]): Promise<void> {
  const multi = client;
  const store = held;
  if (embedder === undefined || multi === undefined || store === undefined) return;
  if (embedMode() !== 'multi') {
    const own = await embedder.host().catch(() => null);
    const was = addresses.get(MONO_HOST);
    if (own !== null && was !== undefined && list.some((host) => host.id === own.id && host.url !== was)) await reconnectHost(MONO_HOST);
    return;
  }
  const listed = new Set(list.map((host) => host.id));
  for (const id of [...joined]) if (!listed.has(id)) await letGo(multi, id);
  for (const host of list) {
    const was = addresses.get(host.id);
    if (multi.host(host.id) === undefined) await addOne(store, multi, host.id);
    // A new address, or a host not connected whose token an edit may have fixed, is tried again now.
    else if (was !== undefined && (was !== host.url || store.get<Connection>(ahpPaths(host.id).connection)?.status !== 'connected')) await reconnectHost(host.id);
  }
}

/** Stop the host `id`: its waiting requests fail, its channels are dropped, and the client forgets it. */
async function letGo(multi: MultiHostClient, id: string): Promise<void> {
  joined.delete(id);
  addresses.delete(id);
  settleWaiting(id, new Error(translate('bridges/notConnected')));
  const data = hosts.get(id);
  if (data !== undefined) for (const entry of data.followed.values()) clearTimeout(entry.release);
  hosts.delete(id);
  await multi.removeHost(id).catch(() => undefined);
}

/** A page coming back into view, or the network coming back, retries at once each host that is down. */
function wake(): void {
  if (document.visibilityState !== 'visible') return;
  const multi = client;
  if (multi === undefined) return;
  void windowHosts().then((ids) => {
    for (const id of ids) if (multi.host(id) === undefined) void reconnectHost(id);
  });
  for (const host of multi.hostsSnapshot()) {
    const status = host.state.status;
    if (status === 'reconnecting' || status === 'failed' || status === 'disconnected') void reconnectHost(host.id);
  }
}

export const ahpProvider: DataProviderDefinition = {
  namespace: 'ahp',
  load: 'eager',
  provider: {
    async load(store) {
      const multi = new MultiHostClient({ clientIdStore: localClientIds });
      client = multi;
      held = store;
      void watchHost(store, multi);
      void watchChannels(store, multi);
      window.addEventListener('online', wake);
      document.addEventListener('visibilitychange', wake);
      if (embedder !== undefined) stopFollowingHosts = embedder.onHosts((list) => void followHosts(list));
      await connect(store, multi);
    },
    async unload(store) {
      window.removeEventListener('online', wake);
      document.removeEventListener('visibilitychange', wake);
      stopFollowingHosts?.();
      stopFollowingHosts = undefined;
      addresses.clear();
      joined.clear();
      const multi = client;
      client = undefined;
      held = undefined;
      for (const id of hosts.keys()) settleWaiting(id, new Error(translate('bridges/notConnected')));
      for (const data of hosts.values()) for (const entry of data.followed.values()) clearTimeout(entry.release);
      hosts.clear();
      pending.clear();
      hostsDue.clear();
      store.clearNamespace('ahp');
      await multi?.shutdown();
    },
  },
};

