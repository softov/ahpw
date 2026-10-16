import { describe, expect, it } from 'vitest';
import type { SessionSummary } from '@microsoft/agent-host-protocol';
import { arrange, arrangeTwo, groupOf } from './grouping.js';

const session = (resource: string, status: number, fields: Partial<SessionSummary> = {}): SessionSummary =>
  ({ resource, status, provider: 'echo', title: resource, createdAt: '', modifiedAt: '', ...fields }) as SessionSummary;
const name = (provider: string): string => provider.toUpperCase();
const alpha = { key: 'alpha', label: 'Alpha' };

describe('groupOf', () => {
  it('puts a session in its status group', () => {
    expect(groupOf(session('a', 24), 'status', name, alpha)?.label).toBe('Needs you');
    expect(groupOf(session('b', 0), 'status', name, alpha)?.label).toBe('Unread');
    expect(groupOf(session('c', 32), 'status', name, alpha)?.label).toBe('Idle');
    expect(groupOf(session('d', 64 | 8), 'status', name, alpha)?.label).toBe('Archived');
  });

  it('groups by folder and by agent', () => {
    expect(groupOf(session('a', 0, { workingDirectories: ['file:///w/app'] }), 'folder', name, alpha)).toEqual({ key: 'file:///w/app', label: '/w/app' });
    expect(groupOf(session('a', 0), 'folder', name, alpha)?.label).toBe('No folder');
    expect(groupOf(session('a', 0), 'agent', name, alpha)).toEqual({ key: 'echo', label: 'ECHO' });
    expect(groupOf(session('a', 0), 'none', name, alpha)).toBeUndefined();
  });

  it('groups by the host a session is on', () => {
    expect(groupOf(session('a', 0), 'host', name, alpha)).toEqual(alpha);
  });
});

describe('arrange', () => {
  it('orders status groups by urgency and keeps order inside a group', () => {
    const items = [session('idle1', 32), session('run', 8), session('idle2', 32), session('ask', 24)];
    expect(arrange(items, (one) => groupOf(one, 'status', name, alpha)).map((one) => one.resource)).toEqual(['ask', 'run', 'idle1', 'idle2']);
  });

  it('orders other groups by their first session', () => {
    const items = [session('a', 0, { workingDirectories: ['file:///x'] }), session('b', 0, { workingDirectories: ['file:///y'] }), session('c', 0, { workingDirectories: ['file:///x'] })];
    expect(arrange(items, (one) => groupOf(one, 'folder', name, alpha)).map((one) => one.resource)).toEqual(['a', 'c', 'b']);
  });
});

describe('two keys', () => {
  it('nests the second key inside the first, each keeping its order', () => {
    const items = [
      session('a1', 32, { workingDirectories: ['file:///a'], provider: 'x' }),
      session('b1', 32, { workingDirectories: ['file:///b'], provider: 'y' }),
      session('a2', 32, { workingDirectories: ['file:///a'], provider: 'y' }),
      session('b2', 32, { workingDirectories: ['file:///b'], provider: 'x' }),
    ];
    const folder = (one: SessionSummary) => groupOf(one, 'folder', name, alpha);
    const agent = (one: SessionSummary) => groupOf(one, 'agent', name, alpha);
    expect(arrangeTwo(items, folder, agent).map((one) => one.resource)).toEqual(['a1', 'a2', 'b2', 'b1']);
    expect(arrangeTwo(items, folder).map((one) => one.resource)).toEqual(['a1', 'a2', 'b1', 'b2']);
  });

  it('puts day groups in their order whatever the rows were sorted by', () => {
    const now = new Date(2026, 9, 16, 12);
    const items = [
      session('old', 32, { modifiedAt: new Date(2026, 8, 1).toISOString() }),
      session('today', 32, { modifiedAt: new Date(2026, 9, 16, 9).toISOString() }),
      session('yesterday', 32, { modifiedAt: new Date(2026, 9, 15, 9).toISOString() }),
    ];
    expect(arrange(items, (one) => groupOf(one, 'day', name, alpha, now)).map((one) => one.resource)).toEqual(['today', 'yesterday', 'old']);
  });
});
