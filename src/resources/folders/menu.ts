import type { BindingPath } from '@softov/scena/types';
import { folderUri } from '../../bridges/words.js';
import { EMOJIcon } from '../emojis.js';
import { bare, childUri } from './roots.js';

/** The slot a file or folder row's menu lists its commands from. */
export const ENTRY_SLOT = 'folders:entry';

/** The row a menu is open on, as `MenuEntry`, or null for a row that is no file or folder. */
export const MENU_ENTRY = '$/folders/menu/entry' as BindingPath;

/** A row a menu is open on. */
export interface MenuEntry {
  uri: string;
  directory: boolean;
  /** A root this browser added, which its menu can remove. */
  added: boolean;
  /** A folder the explorer shows at the top, which its menu cannot rename, copy or delete. */
  root: boolean;
}

/** What a file or folder row's menu can do, past opening it. */
export type EntryAction = 'newFile' | 'newFolder' | 'upload' | 'copyPath' | 'download' | 'rename' | 'copy' | 'removeFolder' | 'delete';

/** Every action in draw order: what adds first, then what reads, then what changes, Delete last. */
export const ENTRY_ACTIONS: readonly EntryAction[] = ['newFile', 'newFolder', 'upload', 'copyPath', 'download', 'rename', 'copy', 'removeFolder', 'delete'];

/** Each action's title and icon. */
export const ENTRY_WORDS: Record<EntryAction, { title: string; icon: string }> = {
  newFile: { title: 'New file', icon: EMOJIcon.file },
  newFolder: { title: 'New folder', icon: EMOJIcon.folder },
  upload: { title: 'Upload', icon: EMOJIcon.upload },
  copyPath: { title: 'Copy path', icon: EMOJIcon.link },
  download: { title: 'Download', icon: EMOJIcon.download },
  rename: { title: 'Rename', icon: EMOJIcon.edit },
  copy: { title: 'Copy', icon: EMOJIcon.copy },
  removeFolder: { title: 'Remove folder', icon: EMOJIcon.clear },
  delete: { title: 'Delete', icon: EMOJIcon.trash },
};

/** The actions only a folder offers. */
const FOLDER_ONLY: ReadonlySet<EntryAction> = new Set(['newFile', 'newFolder', 'upload']);

/** The actions a root does not offer: a slip there would take a whole workspace. */
const NOT_ON_ROOT: ReadonlySet<EntryAction> = new Set(['rename', 'copy', 'delete']);

/** The actions a row's menu offers, in draw order: none for a row that is no file or folder. */
export function entryActions(entry: MenuEntry | null | undefined): EntryAction[] {
  if (entry === null || entry === undefined) return [];
  return ENTRY_ACTIONS.filter((action) => {
    if (action === 'removeFolder') return entry.added;
    if (action === 'download') return !entry.directory;
    if (entry.root && NOT_ON_ROOT.has(action)) return false;
    return entry.directory || !FOLDER_ONLY.has(action);
  });
}

/** A URI's last segment, decoded. */
export function leafOf(uri: string): string {
  const last = bare(uri).split('/').pop() ?? '';
  try {
    return decodeURIComponent(last);
  } catch {
    return last;
  }
}

/** The folder a URI sits in. */
export function parentOf(uri: string): string {
  const path = bare(uri);
  const cut = path.lastIndexOf('/');
  const parent = path.slice(0, cut);
  return /^[a-z][a-z0-9+.-]*:\/*$/i.test(parent) ? `${parent}/` : parent;
}

/** What the name box says is wrong with a name, or null when it can be used. */
export function nameProblem(name: string): string | null {
  const trimmed = name.trim();
  if (trimmed === '') return 'Give a name.';
  if (trimmed.includes('/') || trimmed.includes('\\')) return 'A name has no slash.';
  if (trimmed === '.' || trimmed === '..') return 'Give a name other than a dot.';
  return null;
}

/** The URI of `name` beside `uri`, in the same folder. */
export const siblingUri = (uri: string, name: string): string => childUri(parentOf(uri), name.trim());

/** The name a copy starts with: the same name with " copy" before its extension. */
export function copyNameOf(name: string): string {
  const dot = name.lastIndexOf('.');
  return dot <= 0 ? `${name} copy` : `${name.slice(0, dot)} copy${name.slice(dot)}`;
}

/** A folder path or `file://` URI as a folder URI, or null when it is neither. */
export function folderUriOf(input: string): string | null {
  const trimmed = input.trim();
  // A Windows path, drive first: `C:` is not a URI scheme.
  if (/^[A-Za-z]:[\\/]/.test(trimmed)) return bare(folderUri(trimmed));
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed)) return bare(trimmed);
  if (!trimmed.startsWith('/')) return null;
  return bare(`file://${trimmed.split('/').map(encodeURIComponent).join('/')}`);
}

/** Bytes as base64, a slice at a time so a large file does not overflow the call stack. */
export function base64Of(bytes: Uint8Array): string {
  let text = '';
  for (let at = 0; at < bytes.length; at += 0x8000) text += String.fromCharCode(...bytes.subarray(at, at + 0x8000));
  return btoa(text);
}

/** Base64 as bytes. */
export function bytesOf(base64: string): Uint8Array<ArrayBuffer> {
  const text = atob(base64);
  const bytes = new Uint8Array(text.length);
  for (let at = 0; at < text.length; at += 1) bytes[at] = text.charCodeAt(at);
  return bytes;
}
