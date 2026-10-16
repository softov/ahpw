import { describe, expect, it } from 'vitest';
import { activityOf, countsOf, isArchived } from './status.js';

describe('activityOf', () => {
  it('reads input needed before running, since it carries the running bit', () => {
    expect(activityOf(24)).toBe('input');
    expect(activityOf(24 | 32)).toBe('input');
  });

  it('reads running, failed and idle', () => {
    expect(activityOf(8)).toBe('running');
    expect(activityOf(2)).toBe('error');
    expect(activityOf(1)).toBe('idle');
    expect(activityOf(1 | 32)).toBe('idle');
  });

  it('reads archived on its own', () => {
    expect(isArchived(1 | 64)).toBe(true);
    expect(isArchived(1)).toBe(false);
  });
});

describe('countsOf', () => {
  it('counts sessions idle and not read, and those working', () => {
    // idle, idle and read, running, needs input, archived and running, archived and idle.
    expect(countsOf([0, 32, 8, 24, 64 | 8, 64])).toEqual({ unread: 1, working: 2 });
  });
});
