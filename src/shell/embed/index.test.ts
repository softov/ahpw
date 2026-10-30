import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Embedder } from './index.js';

afterEach(() => {
  delete (globalThis as { ahpwEmbedder?: Embedder }).ahpwEmbedder;
  vi.resetModules();
});

describe('embedder', () => {
  it('is undefined in a browser', async () => {
    const { embedder } = await import('./index.js');
    expect(embedder).toBeUndefined();
  });

  it('is the object an embedder set before ahpw loaded', async () => {
    const given = { host: vi.fn() } as unknown as Embedder;
    (globalThis as { ahpwEmbedder?: Embedder }).ahpwEmbedder = given;
    const { embedder } = await import('./index.js');
    expect(embedder).toBe(given);
  });

  it('is mono in a browser and for an embedder that gives no mode, and multi when it says so', async () => {
    expect((await import('./index.js')).embedMode()).toBe('mono');
    vi.resetModules();
    (globalThis as { ahpwEmbedder?: Embedder }).ahpwEmbedder = { hostUrl: 'ws://127.0.0.1:9187' } as Embedder;
    expect((await import('./index.js')).embedMode()).toBe('mono');
    vi.resetModules();
    (globalThis as { ahpwEmbedder?: Embedder }).ahpwEmbedder = { mode: 'multi', hostUrl: 'ws://127.0.0.1:9187' } as Embedder;
    expect((await import('./index.js')).embedMode()).toBe('multi');
  });
});

describe('embedder browser', () => {
  it('is absent in a browser and for an embedder that gives none', async () => {
    expect((await import('./index.js')).embedder?.browser).toBeUndefined();
    vi.resetModules();
    (globalThis as { ahpwEmbedder?: Embedder }).ahpwEmbedder = { hostUrl: 'ws://127.0.0.1:9187' } as Embedder;
    expect((await import('./index.js')).embedder?.browser).toBeUndefined();
  });

  it('is the browser the embedder gives', async () => {
    const browser = { show: vi.fn(), hide: vi.fn(), open: vi.fn(), back: vi.fn(), forward: vi.fn(), reload: vi.fn(), onNavigated: vi.fn() };
    (globalThis as { ahpwEmbedder?: Embedder }).ahpwEmbedder = { hostUrl: 'ws://127.0.0.1:9187', browser } as unknown as Embedder;
    expect((await import('./index.js')).embedder?.browser).toBe(browser);
  });
});
