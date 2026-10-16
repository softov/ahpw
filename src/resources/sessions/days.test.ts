import { describe, expect, it } from 'vitest';
import { dayGroup, daysAgo, weekGroup, weeksAgo } from './days.js';

/** A Friday at noon, local time. */
const NOW = new Date(2026, 9, 16, 12);
const at = (month: number, day: number, hour = 9): string => new Date(2026, month, day, hour).toISOString();

describe('days', () => {
  it('counts whole local days, a future date as today', () => {
    expect(daysAgo(at(9, 16, 1), NOW)).toBe(0);
    expect(daysAgo(at(9, 15, 23), NOW)).toBe(1);
    expect(daysAgo(at(9, 20), NOW)).toBe(0);
    expect(daysAgo('not a date', NOW)).toBe(0);
  });

  it('names today, yesterday, a weekday within the week, then older', () => {
    expect(dayGroup(at(9, 16), NOW)).toMatchObject({ key: 'day:0', label: 'Today', rank: 0 });
    expect(dayGroup(at(9, 15), NOW)).toMatchObject({ key: 'day:1', label: 'Yesterday', rank: 1 });
    expect(dayGroup(at(9, 12), NOW)).toMatchObject({ key: 'day:4', rank: 4 });
    expect(dayGroup(at(9, 9), NOW)).toMatchObject({ key: 'day:older', label: 'Older', rank: 7 });
  });
});

describe('weeks', () => {
  it('starts a week on Monday', () => {
    expect(weeksAgo(at(9, 12), NOW)).toBe(0);
    expect(weeksAgo(at(9, 11), NOW)).toBe(1);
    expect(weeksAgo(at(9, 1), NOW)).toBe(2);
  });

  it('names this week, last week, then the week of its Monday', () => {
    expect(weekGroup(at(9, 13), NOW)).toMatchObject({ key: 'week:0', label: 'This week' });
    expect(weekGroup(at(9, 7), NOW)).toMatchObject({ key: 'week:1', label: 'Last week' });
    expect(weekGroup(at(8, 30), NOW)).toMatchObject({ key: 'week:2', rank: 2 });
  });
});
