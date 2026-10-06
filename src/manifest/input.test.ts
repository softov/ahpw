import { describe, expect, it } from 'vitest';
import { cleanInput, fieldsOf, groupOf, MissingInput, needsInput, requestOf, schemaOf } from './input.js';
import type { ManifestCommand } from './types.js';

const userAdd: ManifestCommand = {
  id: 'user.add',
  pattern: ['user', 'add', ':id'],
  summary: 'Add a person',
  arguments: { id: { schema: { type: 'string', description: 'Their id.' } } },
  options: [
    { name: '--role', description: 'A role.', schema: { type: 'string' }, field: 'role', repeatable: true },
    { name: '--url', description: 'Print the URL.', schema: { type: 'boolean' }, field: 'url' },
  ],
  http: { method: 'POST', path: '/user/add/{id}' },
};

const userList: ManifestCommand = {
  id: 'user.list',
  pattern: ['user', 'list'],
  summary: 'Who is in the file',
  options: [{ name: '--role', description: 'A role.', schema: { type: 'string' }, field: 'role' }],
  http: { method: 'GET', path: '/user/list' },
};

const usage: ManifestCommand = {
  id: 'usage.list',
  pattern: ['usage', ':pool?'],
  summary: 'Spend',
  arguments: { pool: { schema: { type: 'string' } } },
  http: { method: 'GET', path: '/usage/{pool}' },
};

const install: ManifestCommand = {
  id: 'plugin.install',
  pattern: ['plugin', 'install', ':name...'],
  summary: 'Install',
  arguments: { name: { schema: { type: 'string' } } },
  options: [{ name: '--no-enable', description: 'Do not enable.', schema: { type: 'boolean' } }],
  http: { method: 'POST', path: '/plugin/install' },
};

describe('fieldsOf', () => {
  it('reads arguments from the pattern, then options', () => {
    expect(fieldsOf(userAdd).map((field) => [field.name, field.required, field.list])).toEqual([
      ['id', true, false],
      ['role', false, true],
      ['url', false, false],
    ]);
  });

  it('makes a variadic argument a required list and names an option without a field', () => {
    expect(fieldsOf(install).map((field) => [field.name, field.required, field.list])).toEqual([
      ['name', true, true],
      ['noEnable', false, false],
    ]);
  });

  it('requires an optional argument the path cannot do without', () => {
    expect(fieldsOf(usage)[0]?.required).toBe(true);
  });
});

describe('needsInput', () => {
  it('is false for a command with only optional input', () => {
    expect(needsInput(userList)).toBe(false);
    expect(needsInput(userAdd)).toBe(true);
  });
});

describe('schemaOf', () => {
  it('draws lists as arrays and keeps descriptions', () => {
    const schema = schemaOf(userAdd);
    expect(schema.required).toEqual(['id']);
    expect(schema.properties?.['role']).toMatchObject({ type: 'array', items: { type: 'string' } });
    expect(schema.properties?.['id']).toMatchObject({ type: 'string', title: 'id', description: 'Their id.' });
  });
});

describe('cleanInput', () => {
  it('drops blank text, unchecked flags and empty lists', () => {
    expect(cleanInput({ a: '', b: '  ', c: false, d: [], e: [''], f: 'x', g: true, h: ['y', ''] }))
      .toEqual({ f: 'x', g: true, h: ['y'] });
  });
});

describe('requestOf', () => {
  it('fills the path and sends the rest as the body of a POST', () => {
    expect(requestOf(userAdd, { id: 'ana b', role: ['admin'], url: false })).toEqual({
      method: 'POST',
      path: '/user/add/ana%20b',
      contentType: 'application/json',
      body: '{"role":["admin"]}',
    });
  });

  it('sends a GET input as the query', () => {
    expect(requestOf(userList, { role: 'admin' })).toEqual({ method: 'GET', path: '/user/list?role=admin' });
    expect(requestOf(userList, {})).toEqual({ method: 'GET', path: '/user/list' });
  });

  it('refuses to send without a required value', () => {
    expect(() => requestOf(userAdd, {})).toThrow(MissingInput);
    expect(() => requestOf(install, { name: [] })).toThrow('name is required');
  });

  it('follows a binding that names its query and body', () => {
    const command: ManifestCommand = {
      ...userAdd,
      http: { method: 'POST', path: '/user/add/{id}', query: ['url'], body: ['role'] },
    };
    expect(requestOf(command, { id: 'a', role: ['r'], url: true })).toEqual({
      method: 'POST',
      path: '/user/add/a?url=true',
      contentType: 'application/json',
      body: '{"role":["r"]}',
    });
  });
});

describe('groupOf', () => {
  it('uses the declared group, else the first part of the id', () => {
    expect(groupOf(userAdd)).toBe('user');
    expect(groupOf({ ...userAdd, group: 'people' })).toBe('people');
  });
});
