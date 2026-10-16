import { afterEach, describe, expect, it, vi } from 'vitest';
import { readLastHost, startHost, writeLastHost } from './last-host.js';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('the last host', () => {
  it('reads back the host written', () => {
    const held = new Map<string, string>();
    vi.stubGlobal('localStorage', { getItem: (key: string) => held.get(key) ?? null, setItem: (key: string, value: string) => { held.set(key, value); } });
    writeLastHost('beta');
    expect(readLastHost()).toBe('beta');
  });

  it('starts on the last host while it is listed, else on the first', () => {
    expect(startHost(['alpha', 'beta'], 'beta')).toBe('beta');
    expect(startHost(['alpha', 'beta'], 'gone')).toBe('alpha');
    expect(startHost(['alpha', 'beta'], null)).toBe('alpha');
    expect(startHost([], null)).toBeUndefined();
  });
});
