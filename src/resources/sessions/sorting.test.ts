import { describe, expect, it } from 'vitest';
import type { SessionSummary } from '@microsoft/agent-host-protocol';
import { sortSessions, type Sorting } from './sorting.js';

const session = (resource: string, status: number, createdAt: string, modifiedAt: string, title = resource): SessionSummary =>
  ({ resource, status, provider: 'echo', title, createdAt, modifiedAt }) as SessionSummary;
const items = [
  session('b', 32, '2026-01-02', '2026-03-01', 'Beta'),
  session('a', 32, '2026-01-03', '2026-02-01', 'alpha'),
  session('asks', 24, '2026-01-01', '2026-01-01', 'Gamma'),
];
const order = (sorting: Sorting): string[] => sortSessions(items, (one) => one, sorting).map((one) => one.resource);

describe('sortSessions', () => {
  it('sorts by each key, newest or oldest first for the dates', () => {
    expect(order({ by: 'changed', newest: true, urgent: false })).toEqual(['b', 'a', 'asks']);
    expect(order({ by: 'changed', newest: false, urgent: false })).toEqual(['asks', 'a', 'b']);
    expect(order({ by: 'created', newest: true, urgent: false })).toEqual(['a', 'b', 'asks']);
    expect(order({ by: 'name', newest: true, urgent: false })).toEqual(['a', 'b', 'asks']);
  });

  it('counts a running session as changed now, since the host moves modifiedAt when a turn ends', () => {
    const running = session('runs', 8, '2025-12-31', '2026-01-01', 'Delta');
    const list = [...items, running];
    expect(sortSessions(list, (one) => one, { by: 'changed', newest: true, urgent: false }).map((one) => one.resource)).toEqual(['runs', 'b', 'a', 'asks']);
    expect(sortSessions(list, (one) => one, { by: 'changed', newest: false, urgent: false }).at(-1)?.resource).toBe('runs');
    expect(sortSessions(list, (one) => one, { by: 'created', newest: true, urgent: false }).at(-1)?.resource).toBe('runs');
  });

  it('puts a session waiting on the person first, then keeps the order', () => {
    expect(order({ by: 'changed', newest: true, urgent: true })).toEqual(['asks', 'b', 'a']);
  });
});
