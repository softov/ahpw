import type { BindingPath } from '@softov/scena/types';
import { hostKey } from '../storage-keys.js';

/** The folders open in the explorer's tree, as URIs; null until this browser opened or closed one. */
export const EXPANDED_FOLDERS = '$/folders/expanded' as BindingPath;

/** The localStorage key the open folders are kept under. */
export const EXPANDED_KEY = hostKey('ahpd-web.folders-expanded');

/** The open folders, from this browser's storage; null when it holds none, is blocked, or holds something else. */
export function readExpanded(): string[] | null {
  try {
    const held = JSON.parse(window.localStorage.getItem(EXPANDED_KEY) ?? 'null') as unknown;
    return Array.isArray(held) ? held.filter((one): one is string => typeof one === 'string') : null;
  } catch {
    return null;
  }
}

export function writeExpanded(list: readonly string[]): void {
  try {
    window.localStorage.setItem(EXPANDED_KEY, JSON.stringify(list));
  } catch {
    // Storage blocked: the open folders last as long as the page.
  }
}
