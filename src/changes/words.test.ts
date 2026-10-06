import { describe, expect, it } from 'vitest';
import type { Changeset, ChangesetFile } from '@microsoft/agent-host-protocol';
import { changeOf, firstScope, relativeDir, scopesOf } from './words.js';

const set = (fields: Record<string, unknown>): Changeset => ({ label: 'x', uriTemplate: 'u', changeKind: 'session', ...fields }) as unknown as Changeset;

describe('scopesOf and firstScope', () => {
  it('drops per-turn templates and prefers the whole session', () => {
    const scopes = scopesOf([
      set({ label: 'Uncommitted', uriTemplate: 's/changeset/uncommitted', changeKind: 'uncommitted' }),
      set({ label: 'Turn', uriTemplate: 's/changeset/turn/{turnId}', changeKind: 'turn' }),
      set({ label: 'Session', uriTemplate: 's/changeset/session', changeKind: 'session', capabilities: { review: {} } }),
    ]);
    expect(scopes.map((one) => one.label)).toEqual(['Uncommitted', 'Session']);
    expect(firstScope(scopes)).toMatchObject({ label: 'Session', review: true });
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
      id: 'f', file: 'file:///w/src/a.ts', name: 'a.ts', dir: '/w/src', status: 'modified', added: 2, removed: 1, reviewed: true,
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
