import { expect, test } from 'vitest';
import { NO_OFFERS } from './offers.js';
import { periodRange, poolKind, servesUsage, totalWords, usageUri } from './usage.js';

test('a host keeps usage when it offers the commands or the scheme', () => {
  expect(servesUsage(NO_OFFERS)).toBe(false);
  expect(servesUsage({ ...NO_OFFERS, methods: ['x-ahpd/usage/pools'] })).toBe(true);
  expect(servesUsage({ ...NO_OFFERS, providers: { usage: { title: 'Usage', root: 'usage://', operations: ['list', 'read'] } } })).toBe(true);
});

test('a pool is one encoded segment, with a leaf and only the bounds given', () => {
  expect(usageUri(NO_OFFERS, 'project:web:site')).toBe('usage://project%3Aweb%3Asite');
  expect(usageUri(NO_OFFERS, 'user:ana', 'range', { from: '2026-10-01', until: undefined })).toBe('usage://user%3Aana/range?from=2026-10-01');
  expect(usageUri(NO_OFFERS, 'groups', undefined, { by: 'user,team' })).toBe('usage://groups?by=user%2Cteam');
});

test('a pool key names its kind by its prefix', () => {
  expect(poolKind('team:ops')).toBe('team');
  expect(poolKind('project:web:site')).toBe('project');
  expect(poolKind('odd')).toBe('odd');
});

test('a period is bounded from today, or from this week\'s Monday; the month and a range as they are', () => {
  const thursday = new Date(2026, 9, 15, 10);
  expect(periodRange('day', {}, thursday)).toEqual({ from: '2026-10-15' });
  expect(periodRange('week', {}, thursday)).toEqual({ from: '2026-10-12' });
  expect(periodRange('month', { from: '2026-09-01' }, thursday)).toEqual({});
  expect(periodRange('range', { from: '2026-09-01', until: '2026-09-30' }, thursday)).toEqual({ from: '2026-09-01', until: '2026-09-30' });
});

test('a total reads in the locale, with no cost when calls had no price', () => {
  expect(totalWords({ usd: 1.5, tokens: 12_400, calls: 1200, hours: 2.25 }, 'en-US')).toEqual({ cost: '$1.50', tokens: '12K', calls: '1,200', hours: '2.3' });
  expect(totalWords({ tokens: 300, calls: 2 }, 'en-US')).toEqual({ tokens: '300', calls: '2' });
  // Nothing used costs nothing.
  expect(totalWords({}, 'en-US')).toEqual({ cost: '$0.00' });
});
