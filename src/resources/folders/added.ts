import type { BindingPath } from '@softov/scena/types';
import { hostKey } from '../../lib/storage-keys.js';
import { bare } from './roots.js';

/** The folders this browser added to the explorer, as URIs. */
export const ADDED_FOLDERS = '$/folders/added' as BindingPath;

/** The localStorage key the added folders are kept under. */
export const ADDED_KEY = hostKey('ahpd-web.folders-added');

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

/** The folders this browser added, from its storage; none when storage is blocked or holds something else. */
export function readAdded(): string[] {
  try {
    const held = JSON.parse(window.localStorage.getItem(ADDED_KEY) ?? '[]') as unknown;
    return Array.isArray(held) ? held.filter((one): one is string => typeof one === 'string') : [];
  } catch {
    return [];
  }
}

export function writeAdded(list: readonly string[]): void {
  try {
    window.localStorage.setItem(ADDED_KEY, JSON.stringify(list));
  } catch {
    // Storage blocked: the folders last as long as the page.
  }
}
