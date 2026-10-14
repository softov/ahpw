import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Embedder } from '../embed/index.js';

/** A window whose storage holds `held`, or throws when `held` is null. */
function stubStorage(held: Map<string, string> | null): void {
  const refuse = (): never => { throw new Error('blocked'); };
  vi.stubGlobal('window', {
    localStorage: held === null
      ? { getItem: refuse, setItem: refuse }
      : { getItem: (key: string) => held.get(key) ?? null, setItem: (key: string, value: string) => { held.set(key, value); } },
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
  delete (globalThis as { ahpwEmbedder?: Embedder }).ahpwEmbedder;
  vi.resetModules();
});

describe('the tray state', () => {
  it('is open with nothing stored, and keeps a fold', async () => {
    const { readTrayOpen, writeTrayOpen } = await import('./new-tray.js');
    stubStorage(new Map());
    expect(readTrayOpen()).toBe(true);
    writeTrayOpen(false);
    expect(readTrayOpen()).toBe(false);
    writeTrayOpen(true);
    expect(readTrayOpen()).toBe(true);
  });

  it('is open when storage is blocked, and a write does not throw', async () => {
    const { readTrayOpen, writeTrayOpen } = await import('./new-tray.js');
    stubStorage(null);
    expect(readTrayOpen()).toBe(true);
    expect(() => writeTrayOpen(false)).not.toThrow();
  });

  it('is kept per host on an embedder', async () => {
    (globalThis as { ahpwEmbedder?: Embedder }).ahpwEmbedder = { hostUrl: 'ws://127.0.0.1:9187' } as Embedder;
    const { TRAY_KEY } = await import('./new-tray.js');
    expect(TRAY_KEY).toBe('ahpd-web.new-tray@ws://127.0.0.1:9187');
  });
});
