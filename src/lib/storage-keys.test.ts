import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Embedder } from '../shell/embed/index.js';

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

  it('carries * in a window with every host, which has no one address', async () => {
    (globalThis as { ahpwEmbedder?: Embedder }).ahpwEmbedder = { mode: 'multi', hostUrl: 'ws://127.0.0.1:9187' } as Embedder;
    const { hostKey } = await import('./storage-keys.js');
    expect(hostKey('ahpd-web.session.v1')).toBe('ahpd-web.session.v1@*');
  });
});

describe('perHostKey', () => {
  it('is the window key in mono', async () => {
    (globalThis as { ahpwEmbedder?: Embedder }).ahpwEmbedder = { hostUrl: 'ws://127.0.0.1:9187' } as Embedder;
    const { perHostKey } = await import('./storage-keys.js');
    expect(perHostKey('ahpd-web.folders-added', 'alpha')).toBe('ahpd-web.folders-added@ws://127.0.0.1:9187');
  });

  it('is one key per host in a window with every host', async () => {
    (globalThis as { ahpwEmbedder?: Embedder }).ahpwEmbedder = { mode: 'multi', hostUrl: 'ws://127.0.0.1:9187' } as Embedder;
    const { perHostKey } = await import('./storage-keys.js');
    expect(perHostKey('ahpd-web.folders-added', 'alpha')).toBe('ahpd-web.folders-added@*:alpha');
    expect(perHostKey('ahpd-web.folders-added', 'beta')).toBe('ahpd-web.folders-added@*:beta');
  });
});
