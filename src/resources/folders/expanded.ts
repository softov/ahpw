import type { BindingPath, ReactiveStore } from '@softov/scena/types';
import { perHostKey } from '../../lib/storage-keys.js';

/** The open folders of the host `host`'s tree, as URIs; null until this browser opened or closed one. */
export const expandedPath = (host: string): BindingPath => `$/folders/expanded/${encodeURIComponent(host)}` as BindingPath;

/** With every host, the key of the host's own branch, kept among its open folders. */
export const HOST_NODE = '#host';

/** The localStorage key a host's open folders are kept under. */
export const expandedKey = (host: string): string => perHostKey('ahpd-web.folders-expanded', host);

/** `host`'s open folders, from this browser's storage; null when it holds none, is blocked, or holds something else. */
export function readExpanded(host: string): string[] | null {
  try {
    const held = JSON.parse(window.localStorage.getItem(expandedKey(host)) ?? 'null') as unknown;
    return Array.isArray(held) ? held.filter((one): one is string => typeof one === 'string') : null;
  } catch {
    return null;
  }
}

/** Keep `host`'s open folders, in the store and in storage. */
export function setExpanded(store: ReactiveStore, host: string, list: readonly string[]): void {
  store.set(expandedPath(host), [...list]);
  try {
    window.localStorage.setItem(expandedKey(host), JSON.stringify(list));
  } catch {
    // Storage blocked: the open folders last as long as the page.
  }
}
