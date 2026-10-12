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
});
