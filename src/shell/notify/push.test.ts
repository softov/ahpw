import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { host } = vi.hoisted(() => ({
  host: { readText: vi.fn(), writeText: vi.fn(), deleteResource: vi.fn() },
}));

vi.mock('../../bridges/data.js', () => ({ hostBridge: () => host, windowHost: () => 'daemon', ahpPaths: (id: string) => ({ connection: `$/ahp/${id}/connection`, offers: `$/ahp/${id}/offers` }) }));
vi.mock('../embed/index.js', () => ({ embedder: undefined }));

const { audience, disablePush, enablePush, fromBase64Url, pushOn, sameKey, servesPush, switchAudience } = await import('./push.js');

/** A 65-octet key in base64url, and the bytes it decodes to. */
const KEY = 'BA' + 'A'.repeat(85);
const OTHER = 'BB' + 'A'.repeat(85);

/** A browser subscription made with `key`. */
function subscription(key: string) {
  return {
    options: { applicationServerKey: fromBase64Url(key).buffer },
    unsubscribe: vi.fn(async () => true),
    toJSON: () => ({ endpoint: `https://push.test/${key.slice(0, 4)}`, keys: { p256dh: 'p', auth: 'a' } }),
  };
}

let held: Map<string, string>;
let current: ReturnType<typeof subscription> | null;
const pushManager = {
  getSubscription: vi.fn(async () => current),
  subscribe: vi.fn(async ({ applicationServerKey }: { applicationServerKey: Uint8Array }) => {
    const key = btoa(String.fromCharCode(...applicationServerKey)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    current = subscription(key);
    return current;
  }),
};
const register = vi.fn(async () => ({ pushManager }));

beforeEach(() => {
  held = new Map();
  current = null;
  vi.clearAllMocks();
  host.readText.mockResolvedValue({ text: JSON.stringify({ publicKey: KEY }) });
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => held.get(key) ?? null,
    setItem: (key: string, value: string) => { held.set(key, value); },
    removeItem: (key: string) => { held.delete(key); },
  });
  vi.stubGlobal('document', { baseURI: 'https://a.test/ahpw/' });
  vi.stubGlobal('navigator', { serviceWorker: { register, getRegistration: async () => ({ pushManager }) } });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

const written = (): Record<string, unknown> => JSON.parse(host.writeText.mock.calls.at(-1)![1] as string) as Record<string, unknown>;

describe('push with the tab closed', () => {
  it('subscribes with the host key the first time, and writes the device', async () => {
    await enablePush();
    expect(register).toHaveBeenCalledWith('https://a.test/ahpw/sw.js', { scope: 'https://a.test/ahpw/push/daemon/' });
    expect(pushManager.subscribe).toHaveBeenCalledOnce();
    const [uri] = host.writeText.mock.calls[0]!;
    expect(uri).toMatch(/^push:\/\/devices\/.+/);
    expect(written()).toMatchObject({ platform: 'web', endpoint: 'https://push.test/BA' + 'AA', keys: { p256dh: 'p', auth: 'a' }, audience: 'person' });
    expect(pushOn()).toBe(true);
    await enablePush();
    expect(host.writeText.mock.calls[1]![0]).toBe(uri);
  });

  it('keeps a subscription under the same key, and replaces one under another', async () => {
    current = subscription(KEY);
    await enablePush();
    expect(pushManager.subscribe).not.toHaveBeenCalled();
    const old = subscription(OTHER);
    current = old;
    await enablePush();
    expect(old.unsubscribe).toHaveBeenCalledOnce();
    expect(pushManager.subscribe).toHaveBeenCalledOnce();
  });

  it('stays off when the host gives no key', async () => {
    host.readText.mockRejectedValue(new Error('push://vapid not found'));
    await expect(enablePush()).rejects.toThrow('not found');
    expect(pushOn()).toBe(false);
    expect(host.writeText).not.toHaveBeenCalled();
  });

  it('turns off: the device leaves the host and the subscription ends', async () => {
    await enablePush();
    const made = current!;
    await disablePush();
    expect(host.deleteResource).toHaveBeenCalledWith(host.writeText.mock.calls[0]![0], false);
    expect(made.unsubscribe).toHaveBeenCalledOnce();
    expect(pushOn()).toBe(false);
  });

  it('switches the audience, and tells the host only while push is on', async () => {
    expect(await switchAudience()).toBe('device');
    expect(host.writeText).not.toHaveBeenCalled();
    await enablePush();
    expect(written()['audience']).toBe('device');
    expect(await switchAudience()).toBe('person');
    expect(written()['audience']).toBe('person');
    expect(audience()).toBe('person');
  });

  it('is offered by a host whose push provider allows write', () => {
    expect(servesPush(undefined)).toBe(false);
    expect(servesPush({ methods: [], described: {}, channels: [], providers: { push: { title: 'Push', root: 'push://', operations: ['read'] } } })).toBe(false);
    expect(servesPush({ methods: [], described: {}, channels: [], providers: { push: { title: 'Push', root: 'push://', operations: ['read', 'write'] } } })).toBe(true);
  });

  it('compares keys by their bytes', () => {
    expect(sameKey(fromBase64Url(KEY).buffer as ArrayBuffer, fromBase64Url(KEY))).toBe(true);
    expect(sameKey(fromBase64Url(OTHER).buffer as ArrayBuffer, fromBase64Url(KEY))).toBe(false);
    expect(sameKey(null, fromBase64Url(KEY))).toBe(false);
  });
});
