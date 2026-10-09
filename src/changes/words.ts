import type { Changeset, ChangesetFile } from '@microsoft/agent-host-protocol';
import { folderLabel } from '../connection/words.js';
import { ahpdKey } from '../connection/ahpd-meta.js';

/** A changeset this page can open: one whose URI needs no turn filled in. */
export interface Scope {
  label: string;
  uri: string;
  kind: string;
  description?: string;
  review: boolean;
}

/** The changesets a session offers, without the per-turn templates. */
export function scopesOf(changesets: readonly Changeset[] | undefined): Scope[] {
  return (changesets ?? [])
    .filter((one) => !one.uriTemplate.includes('{'))
    .map((one) => ({
      label: one.label,
      uri: one.uriTemplate,
      kind: String(one.changeKind),
      ...(one.description === undefined ? {} : { description: one.description }),
      review: one.capabilities?.review !== undefined,
    }));
}

/** The scope to show first: the server's first. */
export const firstScope = (scopes: readonly Scope[]): Scope | undefined => scopes[0];

/** A changed file, as a row reads it. */
export interface Change {
  id: string;
  file: string;
  name: string;
  dir: string;
  status: 'added' | 'modified' | 'deleted';
  added?: number;
  removed?: number;
  reviewed: boolean;
  /** In the index, as a host that marks staging says; a file can be both staged and changed again. */
  staged: boolean;
  unstaged: boolean;
  before?: string;
  after?: string;
}

/** One file of a changeset. A missing side says whether it was added or deleted. */
export function changeOf(entry: ChangesetFile): Change {
  const { before, after, diff } = entry.edit;
  const file = after?.uri ?? before?.uri ?? entry.id;
  const path = folderLabel(file);
  const cut = path.lastIndexOf('/');
  return {
    id: entry.id,
    file,
    name: cut < 0 ? path : path.slice(cut + 1),
    dir: cut < 0 ? '' : path.slice(0, cut),
    status: before === undefined ? 'added' : after === undefined ? 'deleted' : 'modified',
    ...(diff?.added === undefined ? {} : { added: diff.added }),
    ...(diff?.removed === undefined ? {} : { removed: diff.removed }),
    reviewed: entry.reviewed === true,
    staged: ahpdKey(entry._meta, 'staged') === true,
    unstaged: ahpdKey(entry._meta, 'unstaged') === true,
    ...(before?.content.uri === undefined ? {} : { before: before.content.uri }),
    ...(after?.content.uri === undefined ? {} : { after: after.content.uri }),
  };
}

/** A folder shown from the session's folder down, when it is inside it. */
export function relativeDir(dir: string, workspace: string | null): string {
  if (workspace === null) return dir;
  const root = folderLabel(workspace).replace(/\/+$/, '');
  if (dir === root) return '.';
  return dir.startsWith(`${root}/`) ? dir.slice(root.length + 1) : dir;
}

/** The letter a change shows: a new file git does not track yet is `U`, as IDEs mark it. */
export function letterOf(change: Change): 'A' | 'M' | 'D' | 'U' {
  if (change.status === 'added') return !change.staged && change.unstaged ? 'U' : 'A';
  return change.status === 'deleted' ? 'D' : 'M';
}

/** How the changes are grouped. */
export type ChangeGrouping = 'review' | 'staging' | 'none';

/** A heading and the changes under it. */
export interface ChangeGroup {
  key: string;
  label: string;
  changes: Change[];
}

/**
 * The changes under their headings, empty ones left out: not reviewed before
 * reviewed, or staged before the rest. A file staged and changed again is in
 * both of the staging groups, as git reports it.
 */
export function groupChanges(changes: readonly Change[], grouping: ChangeGrouping): ChangeGroup[] {
  const groups: ChangeGroup[] = grouping === 'review'
    ? [
      { key: 'unreviewed', label: 'Not reviewed', changes: changes.filter((one) => !one.reviewed) },
      { key: 'reviewed', label: 'Reviewed', changes: changes.filter((one) => one.reviewed) },
    ]
    : grouping === 'staging'
      ? [
        { key: 'staged', label: 'Staged', changes: changes.filter((one) => one.staged) },
        { key: 'unstaged', label: 'Changes', changes: changes.filter((one) => !one.staged || one.unstaged) },
      ]
      : [{ key: 'all', label: 'Changes', changes: [...changes] }];
  return groups.filter((group) => group.changes.length > 0);
}

/** A folder of changed files; `name` holds several segments when a folder had only one folder in it. */
export interface ChangeFolder {
  path: string;
  name: string;
  folders: ChangeFolder[];
  changes: Change[];
}

/** The changes as folders, from the session's folder down, chains of lone folders joined into one. */
export function folderTree(changes: readonly Change[], workspace: string | null): ChangeFolder {
  const root: ChangeFolder = { path: '', name: '', folders: [], changes: [] };
  for (const change of changes) {
    const dir = relativeDir(change.dir, workspace);
    let at = root;
    for (const name of dir === '.' ? [] : dir.split('/').filter((part) => part !== '')) {
      const path = at.path === '' ? name : `${at.path}/${name}`;
      let next = at.folders.find((one) => one.path === path);
      if (next === undefined) {
        next = { path, name, folders: [], changes: [] };
        at.folders.push(next);
      }
      at = next;
    }
    at.changes.push(change);
  }
  const join = (folder: ChangeFolder): ChangeFolder => {
    let at = folder;
    while (at.changes.length === 0 && at.folders.length === 1 && at.folders[0] !== undefined) {
      const only: ChangeFolder = at.folders[0];
      at = { ...only, name: `${at.name}/${only.name}` };
    }
    return { ...at, folders: at.folders.map(join) };
  };
  return { ...root, folders: root.folders.map(join) };
}
