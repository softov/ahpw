import { describe, expect, it } from 'vitest';
import { valueWords } from './composer-commands.js';

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
