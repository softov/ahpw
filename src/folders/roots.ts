import type { DirectoryEntry, SessionSummary } from '@microsoft/agent-host-protocol';

/** A folder the explorer starts from. */
export interface Root {
  uri: string;
  /** The folder the host suggests, from `initialize`. */
  isDefault: boolean;
}

/** A folder URI without its trailing slashes, so two spellings of one folder are one. */
export const bare = (uri: string): string => (/^[a-z][a-z0-9+.-]*:\/\/\/?$/i.test(uri) ? uri : uri.replace(/\/+$/, ''));

/** The explorer's folders: the host's default first, then each folder a session works in, newest session first. */
export function rootsOf(defaultDirectory: string | null | undefined, sessions: readonly SessionSummary[]): Root[] {
  const seen = new Set<string>();
  const roots: Root[] = [];
  const add = (uri: string | undefined, isDefault: boolean): void => {
    if (uri === undefined || uri === '') return;
    const key = bare(uri);
    if (seen.has(key)) return;
    seen.add(key);
    roots.push({ uri: key, isDefault });
  };
  add(defaultDirectory ?? undefined, true);
  for (const session of sessions) add(session.workingDirectories?.[0], false);
  return roots;
}

/** The URI of an entry `resourceList` named in a folder. */
export const childUri = (folder: string, name: string): string => `${folder}${folder.endsWith('/') ? '' : '/'}${encodeURIComponent(name)}`;

/** A listing in draw order: folders, then files, each in the host's order. */
export function orderEntries(entries: readonly DirectoryEntry[]): DirectoryEntry[] {
  return [...entries.filter((one) => one.type === 'directory'), ...entries.filter((one) => one.type !== 'directory')];
}
