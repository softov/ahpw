import type { DirectoryEntry } from '@microsoft/agent-host-protocol';
import { ROOT, request } from '../../bridges/data.js';
import { folderUri } from '../../bridges/words.js';

/** A typed path as the folder it is in and the start of a name in it: `/home/me/sr` is `/home/me/` and `sr`. */
export function splitPath(input: string): { dir: string; part: string } {
  const path = input.replace(/\\/g, '/');
  const cut = path.lastIndexOf('/');
  return { dir: path.slice(0, cut + 1), part: path.slice(cut + 1) };
}

/** `~` at the start as the home folder, as a terminal reads it; `home` has no slash at its end. */
export function expandHome(input: string, home: string | null): string {
  if (home === null || !(input === '~' || input.startsWith('~/'))) return input;
  return `${home}${input === '~' ? '/' : input.slice(1)}`;
}

/** The folder above `dir`, which ends in a slash; null at a root, as `/` or `C:/`. */
export function parentPath(dir: string): string | null {
  const trimmed = dir.replace(/\/+$/, '');
  if (trimmed === '' || /^[A-Za-z]:$/.test(trimmed)) return null;
  return trimmed.slice(0, trimmed.lastIndexOf('/') + 1) || '/';
}

/** The folders in `dir` on the host, by name, ignoring case; throws when the host cannot list it. */
export async function childFolders(dir: string): Promise<string[]> {
  const found = (await request('resourceList', { channel: ROOT, uri: folderUri(dir) } as never)) as { entries: DirectoryEntry[] };
  return found.entries
    .filter((entry) => entry.type === 'directory')
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
}
