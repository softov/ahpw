import { expect, test } from 'vitest';
import type { Policy } from '../../bridges/policies.js';
import { amountWord, limitsLine, limitWord, matchLine, scopeWord, usedWord } from './words.js';

const row = (more: Partial<Policy>): Policy => ({ id: 'A1', scope: 'all', kind: 'agent', effect: 'allow', match: {}, ...more });

test('an amount reads in its measure', () => {
  expect(amountWord('usd', 400)).toBe('$400.00');
  expect(amountWord('tokens', 2_000_000)).toBe('2M tokens');
  expect(amountWord('turns', 1)).toBe('1 turn');
  expect(amountWord('sessions', 3)).toBe('3 sessions');
});

test('a row\'s limits read in one line, an each limit says so, and none is unlimited', () => {
  expect(limitWord({ amount: 400, measure: 'usd', period: 'week', pool: 'shared' })).toBe('$400.00 a week');
  expect(limitWord({ amount: 30, measure: 'turns', period: 'total', pool: 'each' })).toBe('30 turns in total each');
  expect(limitsLine(row({ limits: [{ amount: 20, measure: 'usd', period: 'day', pool: 'shared' }, { amount: 30, measure: 'turns', period: 'day', pool: 'each' }] })))
    .toBe('$20.00 a day \u{00B7} 30 turns a day each');
  expect(limitsLine(row({}))).toBe('Unlimited');
});

test('what a row matches, and who it is about', () => {
  expect(matchLine(row({ match: { agent: ['claude', 'pi'], computer: ['kvm-*'] } }))).toBe('agent: claude, pi \u{00B7} computer: kvm-*');
  expect(matchLine(row({ match: { agent: [] } }))).toBe('Anything');
  expect(scopeWord('all')).toBe('Everybody');
  expect(scopeWord('team:ops')).toBe('team:ops');
});

test('what a limit used of its amount, or that the host does not count it yet', () => {
  expect(usedWord({ measure: 'usd', amount: 400, counted: true }, 120)).toBe('$120.00 of $400.00');
  expect(usedWord({ measure: 'usd', amount: 400, counted: true }, undefined)).toBe('$0.00 of $400.00');
  expect(usedWord({ measure: 'hours', amount: 10, counted: false }, undefined)).toBe('Not counted yet');
});
