import { describe, expect, it } from 'vitest';
import type { SessionSummary } from '@microsoft/agent-host-protocol';
import { NOTHING_NEWER, heard, laid, listed } from './summaries.js';

const row = (resource: string, changes?: SessionSummary['changes']): SessionSummary =>
  ({ resource, provider: 'p', title: 't', status: 1, lifecycle: 'ready', createdAt: 'a', modifiedAt: 'a', ...(changes === undefined ? {} : { changes }) }) as unknown as SessionSummary;

describe('the session summaries newer than the SDK cache', () => {
  it('lays the counts a change carried over the cached row', () => {
    const newer = heard(NOTHING_NEWER, { type: 'sessionSummaryChanged', params: { session: 's:/1', changes: { changes: { additions: 9, deletions: 2, files: 3 } } } });
    expect(laid(row('s:/1', { additions: 1, deletions: 0, files: 1 }), newer).changes).toEqual({ additions: 9, deletions: 2, files: 3 });
  });

  it('keeps the counts when a later change names other fields only', () => {
    let newer = heard(NOTHING_NEWER, { type: 'sessionSummaryChanged', params: { session: 's:/1', changes: { changes: { additions: 9 } } } });
    newer = heard(newer, { type: 'sessionSummaryChanged', params: { session: 's:/1', changes: { title: 'renamed' } } });
    const summary = laid(row('s:/1', { additions: 1 }), newer);
    expect(summary.changes).toEqual({ additions: 9 });
    expect(summary.title).toBe('renamed');
  });

  it('takes a list it read as the newest word, so the cache does not undo it', () => {
    const newer = listed([row('s:/1', { additions: 4, deletions: 1, files: 2 })]);
    expect(laid(row('s:/1'), newer).changes).toEqual({ additions: 4, deletions: 1, files: 2 });
  });

  it('forgets a session that is removed or added again, and leaves other rows as they are', () => {
    const newer = heard(NOTHING_NEWER, { type: 'sessionSummaryChanged', params: { session: 's:/1', changes: { changes: { additions: 9 } } } });
    const cached = row('s:/1', { additions: 1 });
    expect(laid(cached, heard(newer, { type: 'sessionRemoved', params: { session: 's:/1' } }))).toBe(cached);
    expect(laid(cached, heard(newer, { type: 'sessionAdded', params: { summary: cached } }))).toBe(cached);
    const other = row('s:/2');
    expect(laid(other, newer)).toBe(other);
  });
});
