import type { DirectoryEntry, SessionSummary } from '@microsoft/agent-host-protocol';

/** A folder the explorer starts from. */
export interface Root {
  uri: string;
  /** The folder the host suggests, from `initialize`. */
  isDefault: boolean;
}

/** A folder URI without its trailing slashes, so two spellings of one folder are one. */
export const bare = (uri: string): string => (/^[a-z][a-z0-9+.-]*:\/\/\/?$/i.test(uri) ? uri : uri.replace(/\/+$/, ''));

/** The explorer's folders: the host's default first, then each folder a session works in, newest session first, then those revealed. */
export function rootsOf(defaultDirectory: string | null | undefined, sessions: readonly SessionSummary[], revealed: readonly string[] = []): Root[] {
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
  for (const uri of revealed) add(uri, false);
  return roots;
}

/** The URI of an entry `resourceList` named in a folder. */
export const childUri = (folder: string, name: string): string => `${folder}${folder.endsWith('/') ? '' : '/'}${encodeURIComponent(name)}`;

/** A listing in draw order: folders, then files, each in the host's order. */
export function orderEntries(entries: readonly DirectoryEntry[]): DirectoryEntry[] {
  return [...entries.filter((one) => one.type === 'directory'), ...entries.filter((one) => one.type !== 'directory')];
}

/** A `file://` path with its segments decoded. */
function pathOf(uri: string): string {
  try {
    return decodeURIComponent(bare(uri).replace(/^file:\/\//i, ''));
  } catch {
    return bare(uri).replace(/^file:\/\//i, '');
  }
}

/**
 * The folders to open, root first, so `uri` shows in the tree: from the
 * deepest root it sits in, or from `uri` itself as a new root when none holds it.
 */
export function chainTo(roots: readonly string[], uri: string): string[] {
  const path = pathOf(uri);
  const inside = (root: string): boolean => {
    const base = pathOf(root);
    return path === base || path.startsWith(base.endsWith('/') ? base : `${base}/`);
  };
  const root = roots.filter(inside).sort((a, b) => pathOf(b).length - pathOf(a).length)[0];
  if (root === undefined) return [`file://${path.split('/').map(encodeURIComponent).join('/')}`];
  const chain = [root];
  for (const name of path.slice(pathOf(root).length).split('/').filter((part) => part !== '')) chain.push(childUri(chain[chain.length - 1] ?? root, name));
  return chain;
}
