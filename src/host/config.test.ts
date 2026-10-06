import { describe, expect, it } from 'vitest';
import { changedKeys } from './config.js';

describe('changedKeys', () => {
  it('keeps only the keys whose value changed', () => {
    expect(changedKeys({ a: 1, b: 'x', c: [1] }, { a: 1, b: 'y', c: [1, 2] })).toEqual({ b: 'y', c: [1, 2] });
  });

  it('counts a new key as changed', () => {
    expect(changedKeys({}, { a: false })).toEqual({ a: false });
  });

  it('is empty when nothing changed', () => {
    expect(changedKeys({ a: { b: 1 } }, { a: { b: 1 } })).toEqual({});
  });
});
