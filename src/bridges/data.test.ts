import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/** An async queue a test pushes events into, as the SDK's event streams. */
class Queue<T> implements AsyncIterableIterator<T> {
  private items: T[] = [];
  private takers: ((value: IteratorResult<T>) => void)[] = [];
  push(item: T): void {
    const taker = this.takers.shift();
    if (taker !== undefined) taker({ value: item, done: false });
    else this.items.push(item);
  }
  next(): Promise<IteratorResult<T>> {
    const item = this.items.shift();
    if (item !== undefined) return Promise.resolve({ value: item, done: false });
    return new Promise((resolve) => this.takers.push(resolve));
  }
  [Symbol.asyncIterator](): AsyncIterableIterator<T> {
    return this;
  }
}

/** The fake client's hosts: each one's status, and what its requests answer. */
const status = new Map<string, string>();
const subscribed: [string, string][] = [];
const removed: string[] = [];
/** The hosts each `addHost` named, in order. */
const added: string[] = [];
let hostEvents: Queue<unknown>;
let channelEvents: Queue<unknown>;

class FakeMultiHostClient {
  constructor() {
    hostEvents = new Queue();
    channelEvents = new Queue();
  }
  async addHost(config: { id: string }): Promise<void> {
    added.push(config.id);
    if (!status.has(config.id)) status.set(config.id, 'connecting');
  }
  host(id: string) {
    const now = status.get(id);
    return now === undefined ? undefined : { id, state: { status: now }, agents: [], terminals: [], subscriptions: [] };
  }
  hostsSnapshot() {
    return [...status.keys()].map((id) => this.host(id));
  }
  client(id: string) {
    return { rawClient: () => ({ request: async (method: string) => ({ host: id, method }) }) };
  }
  async subscribe(id: string, uri: string) {
    subscribed.push([id, uri]);
    return { snapshot: { state: { host: id, uri } } };
  }
  async unsubscribe(): Promise<void> {}
  dispatch(): void {}
  hostEvents() {
    return hostEvents;
  }
  events() {
    return channelEvents;
  }
  aggregatedSessions() {
    return [];
  }
  async removeHost(id: string): Promise<void> {
    status.delete(id);
    removed.push(id);
  }
  async shutdown(): Promise<void> {}
}

vi.mock('@microsoft/agent-host-protocol/hosts', () => ({ MultiHostClient: FakeMultiHostClient, ROOT_RESOURCE_URI: 'ahp-root:/' }));

const listeners = { addEventListener: vi.fn(), removeEventListener: vi.fn() };
vi.stubGlobal('window', { ...listeners, location: { host: 'localhost:9187' }, setTimeout, requestAnimationFrame: (fn: () => void) => setTimeout(fn, 0) });
vi.stubGlobal('document', { ...listeners, hidden: true, visibilityState: 'hidden' });

const data = await import('./data.js');

const store = { set: vi.fn(), get: vi.fn(() => undefined), clearNamespace: vi.fn() };
const reducer = (state: never) => state;
/** Let the event loops of the data layer read what was pushed. */
const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

beforeEach(async () => {
  status.clear();
  subscribed.length = 0;
  removed.length = 0;
  added.length = 0;
  await data.ahpProvider.provider.load(store as never, undefined as never);
});

afterEach(async () => {
  await data.ahpProvider.provider.unload?.(store as never, undefined as never);
});

describe('hostBridge', () => {
  it('gives the same handle for a host each time, and the window\'s host is daemon in mono', async () => {
    expect(data.hostBridge('a')).toBe(data.hostBridge('a'));
    expect(data.windowHost()).toBe('daemon');
    status.set('daemon', 'connected');
    await expect(data.hostBridge(data.windowHost()).request('listSessions' as never, {} as never)).resolves.toEqual({ host: 'daemon', method: 'listSessions' });
  });

  it('keeps each host\'s followed channels its own', async () => {
    status.set('a', 'connected');
    status.set('b', 'connected');
    data.hostBridge('a').follow('one://x', reducer);
    data.hostBridge('b').follow('one://y', reducer);
    await settle();
    expect(subscribed).toEqual([['a', 'one://x'], ['b', 'one://y']]);

    // A host that connects again takes back only its own channels.
    subscribed.length = 0;
    hostEvents.push({ type: 'connected', hostId: 'a', generation: 2 });
    await settle();
    expect(subscribed).toEqual([['a', 'one://x']]);
  });

  it('writes each host\'s facts under its own paths', async () => {
    expect(data.ahpPaths('a b').connection).toBe('$/ahp/hosts/a%20b/connection');
    expect(data.channelPath('a', 'one://x')).toBe('$/ahp/hosts/a/channels/one%3A%2F%2Fx');
    status.set('a', 'connected');
    store.set.mockClear();
    hostEvents.push({ type: 'connected', hostId: 'a', generation: 3 });
    await settle();
    expect(store.set).toHaveBeenCalledWith('$/ahp/hosts/a/connection', { status: 'connected', error: null, generation: 3 });
    expect(store.set.mock.calls.some(([path]) => String(path).startsWith('$/ahp/hosts/daemon/'))).toBe(false);
  });

  it('refuses the requests of a host that failed, and not those of another', async () => {
    status.set('a', 'connecting');
    status.set('b', 'connecting');
    const onA = data.hostBridge('a').request('listSessions' as never, {} as never);
    const onB = data.hostBridge('b').request('listSessions' as never, {} as never);
    onA.catch(() => undefined);

    status.set('a', 'failed');
    hostEvents.push({ type: 'stateChanged', hostId: 'a', state: { status: 'failed', error: new Error('refused') } });
    await settle();
    await expect(onA).rejects.toThrow();

    status.set('b', 'connected');
    hostEvents.push({ type: 'connected', hostId: 'b', generation: 1 });
    await expect(onB).resolves.toEqual({ host: 'b', method: 'listSessions' });
  });
});

describe('a window with every host', () => {
  it('connects to each host the embedder lists, adds a new one, and lets a removed one go', async () => {
    let list = [{ id: 'a', name: 'A', url: 'ws://a:1' }, { id: 'b', name: 'B', url: 'ws://b:1' }];
    let onHosts: (hosts: typeof list) => void = () => undefined;
    (globalThis as Record<string, unknown>).ahpwEmbedder = {
      mode: 'multi',
      hostUrl: '*',
      host: async () => list[0],
      hosts: async () => list,
      token: async () => null,
      onHosts: (handler: (hosts: typeof list) => void) => { onHosts = handler; return () => undefined; },
    };
    vi.resetModules();
    const multi = await import('./data.js');
    await multi.ahpProvider.provider.unload?.(store as never, undefined as never);
    added.length = 0;
    await multi.ahpProvider.provider.load(store as never, undefined as never);
    expect(added).toEqual(['a', 'b']);
    expect(() => multi.windowHost()).toThrow();

    list = [{ id: 'b', name: 'B', url: 'ws://b:1' }, { id: 'c', name: 'C', url: 'ws://c:1' }];
    onHosts(list);
    await settle();
    expect(added).toEqual(['a', 'b', 'c']);
    expect(removed).toEqual(['a']);
    await multi.ahpProvider.provider.unload?.(store as never, undefined as never);
    delete (globalThis as Record<string, unknown>).ahpwEmbedder;
  });

  it('connects mono to the one host, daemon', async () => {
    expect(added).toEqual(['daemon']);
  });
});

