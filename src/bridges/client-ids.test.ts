import { afterEach, describe, expect, it, vi } from 'vitest';
import { localClientIds } from './client-ids.js';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('the client id a host keeps', () => {
  it('comes back after it is stored, per host', async () => {
    const held = new Map<string, string>();
    vi.stubGlobal('localStorage', { getItem: (key: string) => held.get(key) ?? null, setItem: (key: string, value: string) => { held.set(key, value); } });
    expect(await localClientIds.load('daemon')).toBeNull();
    await localClientIds.store('daemon', 'c1');
    expect(await localClientIds.load('daemon')).toBe('c1');
    expect(await localClientIds.load('other')).toBeNull();
    expect(held.get('ahpw.clientId.daemon')).toBe('c1');
  });

  it('is none, and no error, where storage throws', async () => {
    const refuse = (): never => { throw new Error('blocked'); };
    vi.stubGlobal('localStorage', { getItem: refuse, setItem: refuse });
    await expect(localClientIds.store('daemon', 'c1')).resolves.toBeUndefined();
    expect(await localClientIds.load('daemon')).toBeNull();
  });
});
