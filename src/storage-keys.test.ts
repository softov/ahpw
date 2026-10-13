import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Embedder } from './embed/index.js';

afterEach(() => {
  delete (globalThis as { ahpwEmbedder?: Embedder }).ahpwEmbedder;
  vi.resetModules();
});

describe('hostKey', () => {
  it('is the key as given in a browser, where the origin is the host', async () => {
    const { hostKey } = await import('./storage-keys.js');
    expect(hostKey('ahpd-web.session.v1')).toBe('ahpd-web.session.v1');
  });

  it('carries the host address on an embedder, where every host shares one origin', async () => {
    (globalThis as { ahpwEmbedder?: Embedder }).ahpwEmbedder = { hostUrl: 'ws://127.0.0.1:9187' } as Embedder;
    const { hostKey } = await import('./storage-keys.js');
    expect(hostKey('ahpd-web.session.v1')).toBe('ahpd-web.session.v1@ws://127.0.0.1:9187');
  });
});
