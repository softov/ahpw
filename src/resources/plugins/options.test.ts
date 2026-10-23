import { describe, expect, it } from 'vitest';
import { changedKeys } from './Options.js';

describe('changedKeys', () => {
  it('names each key whose value differs, added, changed or taken out', () => {
    expect(changedKeys({ root: '/a', lastChats: 15, token: '<set>' }, { root: '/b', lastChats: 15, token: '<set>', extra: true })).toEqual(['root', 'extra']);
    expect(changedKeys({ root: '/a' }, {})).toEqual(['root']);
    expect(changedKeys({ a: 1 }, { a: 1 })).toEqual([]);
  });
});
