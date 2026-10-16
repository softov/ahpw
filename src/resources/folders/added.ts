import type { BindingPath, ReactiveStore } from '@softov/scena/types';
import { perHostKey } from '../../lib/storage-keys.js';
import { bare } from './roots.js';

/** The folders this browser added to the explorer for the host `host`, as URIs. */
export const addedPath = (host: string): BindingPath => `$/folders/added/${encodeURIComponent(host)}` as BindingPath;

/** The localStorage key a host's added folders are kept under. */
export const addedKey = (host: string): string => perHostKey('ahpd-web.folders-added', host);

/** The list with `uri` at its end, once. */
export function withFolder(list: readonly string[], uri: string): string[] {
  const key = bare(uri);
  return list.some((one) => bare(one) === key) ? [...list] : [...list, key];
}

/** The list without `uri`. */
export function withoutFolder(list: readonly string[], uri: string): string[] {
  const key = bare(uri);
  return list.filter((one) => bare(one) !== key);
}

/** The folders this browser added for `host`, from its storage; none when storage is blocked or holds something else. */
export function readAdded(host: string): string[] {
  try {
    const held = JSON.parse(window.localStorage.getItem(addedKey(host)) ?? '[]') as unknown;
    return Array.isArray(held) ? held.filter((one): one is string => typeof one === 'string') : [];
  } catch {
    return [];
  }
}

/** Keep `host`'s added folders, in the store and in storage. */
export function setAdded(store: ReactiveStore, host: string, list: readonly string[]): void {
  store.set(addedPath(host), [...list]);
  try {
    window.localStorage.setItem(addedKey(host), JSON.stringify(list));
  } catch {
    // Storage blocked: the folders last as long as the page.
  }
}
