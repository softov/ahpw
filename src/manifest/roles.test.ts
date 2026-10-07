import { describe, expect, it } from 'vitest';
import type { ManifestCommand, ProgramManifest } from './types.js';
import { canRunWith, createOf, itemCommandsOf, keyOf, keyValuesOf, listOf, removalQuestion, roleOf, rowLine, rowsOf, rowTitle, runsOnOpening } from './roles.js';

const command = (id: string, fields: Partial<ManifestCommand> = {}): ManifestCommand => ({
  id,
  pattern: id.split('.'),
  summary: id,
  http: { method: 'POST', path: `/${id.replace('.', '/')}` },
  ...fields,
});

const list = command('user.list', { effect: 'read', resource: { kind: 'user' }, http: { method: 'GET', path: '/user/list' } });
const get = command('user.show', { pattern: ['user', 'show', ':id'], effect: 'read', resource: { kind: 'user', key: 'id' }, http: { method: 'GET', path: '/user/show/{id}' } });
const add = command('user.add', { pattern: ['user', 'add', ':id'], effect: 'add', resource: { kind: 'user' } });
const rm = command('user.rm', { pattern: ['user', 'rm', ':id'], effect: 'remove', resource: { kind: 'user', key: 'id' }, http: { method: 'POST', path: '/user/rm/{id}' } });
const tag = command('user.tag', { pattern: ['user', 'tag', ':id...'], effect: 'change', resource: { kind: 'user', key: 'id' } });
const status = command('status', { effect: 'read', http: { method: 'GET', path: '/status' } });
const manifest: ProgramManifest = { cofold: 1, program: { name: 'ahpd', version: '1' }, commands: [list, rm, add, get, tag, status] };

describe('roleOf', () => {
  it('follows from the effect and whether there is a key', () => {
    expect([list, get, add, rm, tag, status].map(roleOf)).toEqual(['list', 'get', 'create', 'item', 'item', 'plain']);
  });

  it('makes any other combination a plain command', () => {
    expect(roleOf(command('a', { effect: 'change' }))).toBe('plain');
    expect(roleOf(command('b', { effect: 'add', resource: { kind: 'x', key: 'id' } }))).toBe('plain');
    expect(roleOf(command('c'))).toBe('plain');
  });
});

describe('a kind\'s commands', () => {
  it('finds the get first, then the item actions, and the create', () => {
    expect(itemCommandsOf(manifest, 'user').map((one) => one.id)).toEqual(['user.show', 'user.rm', 'user.tag']);
    expect(createOf(manifest, 'user')?.id).toBe('user.add');
    expect(createOf(manifest, 'team')).toBeUndefined();
  });
});

describe('keyValuesOf', () => {
  it('fills the key from the row, as a list of one for a list field', () => {
    expect(keyValuesOf(rm, { id: 'alice', roles: ['admin'] })).toEqual({ id: 'alice' });
    expect(keyValuesOf(tag, { id: 'alice' })).toEqual({ id: ['alice'] });
    expect(keyValuesOf(rm, { name: 'alice' })).toBeUndefined();
  });
});

describe('running', () => {
  it('runs a read on opening only with every required value', () => {
    expect(runsOnOpening(list, {})).toBe(true);
    expect(runsOnOpening(get, {})).toBe(false);
    expect(runsOnOpening(get, { id: 'alice' })).toBe(true);
    expect(runsOnOpening(rm, { id: 'alice' })).toBe(false);
    expect(canRunWith(rm, { id: '' })).toBe(false);
  });

  it('falls back to the method when no effect is declared', () => {
    expect(runsOnOpening(command('x', { http: { method: 'GET', path: '/x' } }), {})).toBe(true);
    expect(runsOnOpening(command('y'), {})).toBe(false);
  });

  it('asks a removal with the item it names', () => {
    expect(removalQuestion(rm, { id: 'alice' })).toBe('Remove user alice?');
    expect(removalQuestion(rm, {})).toBe('Remove user?');
  });
});

describe('a list\'s rows', () => {
  it('reads an array, or the one array of an object', () => {
    expect(rowsOf([{ id: 'a' }])).toEqual([{ id: 'a' }]);
    expect(rowsOf({ users: [{ id: 'a' }] })).toEqual([{ id: 'a' }]);
    expect(rowsOf({ users: [], teams: [] })).toBeUndefined();
    expect(rowsOf(['a'])).toBeUndefined();
  });

  it('finds the group\'s list and the kind\'s key', () => {
    expect(listOf(manifest.commands)?.id).toBe('user.list');
    expect(keyOf(manifest, 'user')).toBe('id');
    expect(keyOf(manifest, 'team')).toBeUndefined();
  });

  it('titles a row by its key, and lines it with its other short values', () => {
    const row = { id: 'seed', title: 'Seeded', roles: ['admin'], enabled: true };
    expect(rowTitle(row, 'id')).toBe('seed');
    expect(rowLine(row, 'id')).toBe('Seeded \u{00B7} true');
    expect(rowTitle({ name: 'x', n: 1 }, undefined)).toBe('x');
  });
});
