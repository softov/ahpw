import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ReactiveStore } from '@softov/scena/types';
import type { Embedder } from '../../shell/embed/index.js';

afterEach(() => {
  delete (globalThis as { ahpwEmbedder?: Embedder }).ahpwEmbedder;
  vi.unstubAllGlobals();
  vi.resetModules();
});

describe('added folders with every host', () => {
  it('keeps each host its own folders', async () => {
    (globalThis as { ahpwEmbedder?: Embedder }).ahpwEmbedder = { mode: 'multi', hostUrl: 'ws://127.0.0.1:9187' } as Embedder;
    const kept = new Map<string, string>();
    vi.stubGlobal('window', { localStorage: { getItem: (key: string) => kept.get(key) ?? null, setItem: (key: string, value: string) => { kept.set(key, value); } } });
    const values = new Map<string, unknown>();
    const store = { set: (path: string, value: unknown) => { values.set(path, value); } } as unknown as ReactiveStore;
    const { addedPath, readAdded, setAdded } = await import('./added.js');

    setAdded(store, 'alpha', ['file:///a']);
    setAdded(store, 'beta', ['file:///b']);

    expect(readAdded('alpha')).toEqual(['file:///a']);
    expect(readAdded('beta')).toEqual(['file:///b']);
    expect(values.get(addedPath('alpha'))).toEqual(['file:///a']);
    expect(values.get(addedPath('beta'))).toEqual(['file:///b']);
  });
});
