import { describe, expect, it } from 'vitest';
import type { SessionSummary } from '@microsoft/agent-host-protocol';
import { arrange, groupOf } from './grouping.js';

const session = (resource: string, status: number, fields: Partial<SessionSummary> = {}): SessionSummary =>
  ({ resource, status, provider: 'echo', title: resource, createdAt: '', modifiedAt: '', ...fields }) as SessionSummary;
const name = (provider: string): string => provider.toUpperCase();

describe('groupOf', () => {
  it('puts a session in its status group', () => {
    expect(groupOf(session('a', 24), 'status', name)?.label).toBe('Needs you');
    expect(groupOf(session('b', 0), 'status', name)?.label).toBe('Unread');
    expect(groupOf(session('c', 32), 'status', name)?.label).toBe('Idle');
    expect(groupOf(session('d', 64 | 8), 'status', name)?.label).toBe('Archived');
  });

  it('groups by folder and by agent', () => {
    expect(groupOf(session('a', 0, { workingDirectories: ['file:///w/app'] }), 'folder', name)).toEqual({ key: 'file:///w/app', label: '/w/app' });
    expect(groupOf(session('a', 0), 'folder', name)?.label).toBe('No folder');
    expect(groupOf(session('a', 0), 'agent', name)).toEqual({ key: 'echo', label: 'ECHO' });
    expect(groupOf(session('a', 0), 'none', name)).toBeUndefined();
  });
});

describe('arrange', () => {
  it('orders status groups by urgency and keeps order inside a group', () => {
    const items = [session('idle1', 32), session('run', 8), session('idle2', 32), session('ask', 24)];
    expect(arrange(items, (one) => groupOf(one, 'status', name), 'status').map((one) => one.resource)).toEqual(['ask', 'run', 'idle1', 'idle2']);
  });

  it('orders other groups by their first session', () => {
    const items = [session('a', 0, { workingDirectories: ['file:///x'] }), session('b', 0, { workingDirectories: ['file:///y'] }), session('c', 0, { workingDirectories: ['file:///x'] })];
    expect(arrange(items, (one) => groupOf(one, 'folder', name), 'folder').map((one) => one.resource)).toEqual(['a', 'c', 'b']);
  });
});
