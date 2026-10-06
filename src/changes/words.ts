import type { Changeset, ChangesetFile } from '@microsoft/agent-host-protocol';
import { folderLabel } from '../connection/words.js';

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

/** The scope to show first: all of the session's changes, then whatever comes first. */
export const firstScope = (scopes: readonly Scope[]): Scope | undefined => scopes.find((one) => one.kind === 'session') ?? scopes[0];

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
