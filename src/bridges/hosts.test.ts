import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Embedder } from '../shell/embed/index.js';

/** A store over a plain map, as far as `shownHosts` and `everyHost` read it. */
const storeOf = (values: Record<string, unknown>) => ({ get: (path: string) => values[path] });

afterEach(() => {
  delete (globalThis as { ahpwEmbedder?: Embedder }).ahpwEmbedder;
  vi.resetModules();
});

describe('the shown hosts', () => {
  it('are the window\'s host in mono', async () => {
    const { everyHost, shownHosts } = await import('./hosts.js');
    expect(shownHosts(storeOf({}) as never)).toEqual(['daemon']);
    expect(everyHost(storeOf({}) as never)).toEqual(['daemon']);
  });

  it('are every host with nothing picked, and the picked ones in the embedder\'s order', async () => {
    (globalThis as { ahpwEmbedder?: Embedder }).ahpwEmbedder = { mode: 'multi', hostUrl: '*' } as Embedder;
    const { everyHost, HOST_FILTER, HOST_LIST, shownHosts } = await import('./hosts.js');
    const list = [{ id: 'a', name: 'A' }, { id: 'b', name: 'B' }, { id: 'c', name: 'C' }];
    expect(shownHosts(storeOf({ [HOST_LIST]: list, [HOST_FILTER]: null }) as never)).toEqual(['a', 'b', 'c']);
    expect(shownHosts(storeOf({ [HOST_LIST]: list, [HOST_FILTER]: ['c', 'a'] }) as never)).toEqual(['a', 'c']);
    // A picked host that left the list shows every host rather than none.
    expect(shownHosts(storeOf({ [HOST_LIST]: list, [HOST_FILTER]: ['gone'] }) as never)).toEqual(['a', 'b', 'c']);
    expect(everyHost(storeOf({ [HOST_LIST]: list, [HOST_FILTER]: ['a'] }) as never)).toEqual(['a', 'b', 'c']);
  });
});

describe('refKey', () => {
  it('reads back the host and the item, a URI with colons among them', async () => {
    const { refKey, refOf } = await import('./hosts.js');
    expect(refOf(refKey('alpha', 'ahp-terminal:/a'))).toEqual({ host: 'alpha', id: 'ahp-terminal:/a' });
  });
});
