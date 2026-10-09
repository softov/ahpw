import { describe, expect, it } from 'vitest';
import { showsPill, valueWords } from './composer-commands.js';

describe('valueWords', () => {
  it('reads plain values, lists and objects', () => {
    expect(valueWords(undefined)).toBe('default');
    expect(valueWords('ask')).toBe('ask');
    expect(valueWords([])).toBe('none');
    expect(valueWords(['Read', 'Edit'])).toBe('Read, Edit');
    expect(valueWords(['a', 'b', 'c'])).toBe('3 items');
    expect(valueWords({ allow: ['Bash', 'Read', 'Edit'], deny: [] })).toBe('allow 3 items');
    expect(valueWords({})).toBe('none');
  });
});

describe('showsPill', () => {
  it('leaves out a setting that holds nothing and cannot be changed', () => {
    expect(showsPill({ key: 'permissions', schema: { type: 'object', title: 'Permissions' }, value: {} })).toBe(false);
    expect(showsPill({ key: 'permissions', schema: { type: 'object', title: 'Permissions' }, value: { allow: ['Read'] } })).toBe(true);
    expect(showsPill({ key: 'mode', schema: { type: 'string', title: 'Mode', enum: ['ask', 'auto'] }, value: undefined })).toBe(true);
  });
});
