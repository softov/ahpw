import { expect, test } from 'vitest';
import { isRecordId, parseGrants } from './form.js';

test('a role\'s grants, one a line, with the lines a host would refuse named', () => {
  expect(parseGrants('session:write\n\n  *:*  \nsession:write\nnot a grant\nuser:')).toEqual({
    grants: ['session:write', '*:*'],
    problems: [{ line: 5, text: 'not a grant' }, { line: 6, text: 'user:' }],
  });
  expect(parseGrants('')).toEqual({ grants: [], problems: [] });
});

test('a record id a URI can end with', () => {
  expect(isRecordId('ana')).toBe(true);
  expect(isRecordId('ana.silva')).toBe(true);
  expect(isRecordId('')).toBe(false);
  expect(isRecordId('a/b')).toBe(false);
  expect(isRecordId('a b')).toBe(false);
});
