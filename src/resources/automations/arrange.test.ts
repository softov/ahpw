import { describe, expect, it } from 'vitest';
import { arrange } from '../sessions/grouping.js';
import { groupOf, keeps, nextGroup, sortAutomations, type AutoItem } from './arrange.js';

/** A Friday at noon, local time. */
const NOW = new Date(2026, 9, 16, 12);
const at = (month: number, day: number, hour = 9): string => new Date(2026, month, day, hour).toISOString();
const item = (title: string, fields: Partial<AutoItem> = {}): AutoItem => ({ host: 'h', hostName: 'H', title, state: 'on', ...fields });

describe('nextGroup', () => {
  it('names now, overdue, today, tomorrow, a weekday, later and not scheduled', () => {
    expect(nextGroup(item('a', { state: 'running' }), NOW)).toMatchObject({ key: 'next:now', label: 'Now' });
    expect(nextGroup(item('a', { nextRunAt: at(9, 16, 8) }), NOW)).toMatchObject({ key: 'next:overdue', label: 'Overdue' });
    expect(nextGroup(item('a', { nextRunAt: at(9, 16, 18) }), NOW)).toMatchObject({ key: 'next:today', label: 'Today' });
    expect(nextGroup(item('a', { nextRunAt: at(9, 17) }), NOW)).toMatchObject({ key: 'next:tomorrow', label: 'Tomorrow' });
    expect(nextGroup(item('a', { nextRunAt: at(9, 19) }), NOW)).toMatchObject({ key: 'next:in3', rank: 5 });
    expect(nextGroup(item('a', { nextRunAt: at(10, 30) }), NOW)).toMatchObject({ key: 'next:later', label: 'Later' });
    expect(nextGroup(item('a'), NOW)).toMatchObject({ key: 'next:none', label: 'Not scheduled' });
  });

  it('puts the next-run groups in their order', () => {
    const items = [item('later', { nextRunAt: at(10, 30) }), item('run', { state: 'running' }), item('today', { nextRunAt: at(9, 16, 18) })];
    expect(arrange(items, (one) => groupOf(one, 'next', NOW)).map((one) => one.title)).toEqual(['run', 'today', 'later']);
  });
});

describe('sortAutomations and keeps', () => {
  const items = [item('b', { nextRunAt: at(9, 18), lastRunAt: at(9, 10) }), item('a', { lastRunAt: at(9, 15) }), item('c', { nextRunAt: at(9, 17) })];
  const order = (by: 'name' | 'next' | 'last'): string[] => sortAutomations(items, (one) => one, by).map((one) => one.title);

  it('sorts by name, next run and last run, one with no date last', () => {
    expect(order('name')).toEqual(['a', 'b', 'c']);
    expect(order('next')).toEqual(['c', 'b', 'a']);
    expect(order('last')).toEqual(['a', 'b', 'c']);
  });

  it('keeps the automations of one state', () => {
    expect(keeps(item('a', { state: 'failed' }), 'failed')).toBe(true);
    expect(keeps(item('a', { state: 'on' }), 'failed')).toBe(false);
    expect(keeps(item('a', { state: 'off' }), 'all')).toBe(true);
  });
});
