import { describe, expect, it } from 'vitest';
import type { Changeset, ChangesetFile } from '@microsoft/agent-host-protocol';
import { changeOf, firstScope, folderTree, groupChanges, letterOf, relativeDir, scopesOf, type Change } from './words.js';

const set = (fields: Record<string, unknown>): Changeset => ({ label: 'x', uriTemplate: 'u', changeKind: 'session', ...fields }) as unknown as Changeset;

describe('scopesOf and firstScope', () => {
  it('drops per-turn templates and opens on the server\'s first', () => {
    const scopes = scopesOf([
      set({ label: 'Uncommitted', uriTemplate: 's/changeset/uncommitted', changeKind: 'uncommitted' }),
      set({ label: 'Turn', uriTemplate: 's/changeset/turn/{turnId}', changeKind: 'turn' }),
      set({ label: 'Session', uriTemplate: 's/changeset/session', changeKind: 'session', capabilities: { review: {} } }),
    ]);
    expect(scopes.map((one) => one.label)).toEqual(['Uncommitted', 'Session']);
    expect(firstScope(scopes)).toMatchObject({ label: 'Uncommitted', review: false });
  });
});

describe('changeOf', () => {
  const file = (edit: Record<string, unknown>, reviewed?: boolean): ChangesetFile => ({ id: 'f', edit, ...(reviewed === undefined ? {} : { reviewed }) }) as unknown as ChangesetFile;

  it('reads a modified file with both sides and its counts', () => {
    expect(changeOf(file({
      before: { uri: 'file:///w/src/a.ts', content: { uri: 'ahp-git://head/w/src/a.ts' } },
      after: { uri: 'file:///w/src/a.ts', content: { uri: 'file:///w/src/a.ts' } },
      diff: { added: 2, removed: 1 },
    }, true))).toEqual({
      id: 'f', file: 'file:///w/src/a.ts', name: 'a.ts', dir: '/w/src', staged: false, unstaged: false, status: 'modified', added: 2, removed: 1, reviewed: true,
      before: 'ahp-git://head/w/src/a.ts', after: 'file:///w/src/a.ts',
    });
  });

  it('reads a missing side as added or deleted', () => {
    expect(changeOf(file({ after: { uri: 'file:///w/n.ts', content: { uri: 'c' } } })).status).toBe('added');
    expect(changeOf(file({ before: { uri: 'file:///w/o.ts', content: { uri: 'c' } } })).status).toBe('deleted');
  });
});

describe('relativeDir', () => {
  it('shows a folder from the session folder down', () => {
    expect(relativeDir('/w/src/lib', 'file:///w')).toBe('src/lib');
    expect(relativeDir('/w', 'file:///w/')).toBe('.');
    expect(relativeDir('/elsewhere', 'file:///w')).toBe('/elsewhere');
  });
});

const change = (path: string, fields: Partial<Change> = {}): Change => {
  const cut = path.lastIndexOf('/');
  return { id: path, file: `file://${path}`, name: path.slice(cut + 1), dir: path.slice(0, cut), status: 'modified', reviewed: false, staged: false, unstaged: true, ...fields };
};

describe('letterOf', () => {
  it('tells untracked from added, as git does', () => {
    expect(letterOf(change('/w/a', { status: 'added', staged: false, unstaged: true }))).toBe('U');
    expect(letterOf(change('/w/a', { status: 'added', staged: true, unstaged: false }))).toBe('A');
    expect(letterOf(change('/w/a', { status: 'added', staged: false, unstaged: false }))).toBe('A');
    expect(letterOf(change('/w/a', { status: 'deleted' }))).toBe('D');
    expect(letterOf(change('/w/a'))).toBe('M');
  });
});

describe('groupChanges', () => {
  it('puts the files not reviewed first and leaves empty groups out', () => {
    const groups = groupChanges([change('/w/a', { reviewed: true }), change('/w/b')], 'review');
    expect(groups.map((one) => [one.label, one.changes.map((c) => c.name)])).toEqual([['Not reviewed', ['b']], ['Reviewed', ['a']]]);
    expect(groupChanges([change('/w/a')], 'review').map((one) => one.key)).toEqual(['unreviewed']);
  });

  it('lists a file staged and changed again under both', () => {
    const groups = groupChanges([change('/w/a', { staged: true, unstaged: true }), change('/w/b', { staged: true, unstaged: false }), change('/w/c')], 'staging');
    expect(groups.map((one) => [one.label, one.changes.map((c) => c.name)])).toEqual([['Staged', ['a', 'b']], ['Changes', ['a', 'c']]]);
  });
});

describe('folderTree', () => {
  it('nests from the session folder and joins lone folders', () => {
    const tree = folderTree([change('/w/packages/sdk/src/a.ts'), change('/w/packages/sdk/src/t/b.ts'), change('/w/README.md')], 'file:///w');
    expect(tree.changes.map((one) => one.name)).toEqual(['README.md']);
    expect(tree.folders.map((one) => one.name)).toEqual(['packages/sdk/src']);
    expect(tree.folders[0]?.changes.map((one) => one.name)).toEqual(['a.ts']);
    expect(tree.folders[0]?.folders.map((one) => [one.name, one.path])).toEqual([['t', 'packages/sdk/src/t']]);
  });
});
