import { describe, expect, it } from 'vitest';
import type { SessionSummary } from '@microsoft/agent-host-protocol';
import { usedFolders } from './used.js';

const session = (uri?: string): SessionSummary => ({ workingDirectories: uri === undefined ? undefined : [uri] }) as unknown as SessionSummary;

describe('usedFolders', () => {
  it('puts the folder most sessions use first, the newest first among equals', () => {
    const sessions = [session('file:///work/b'), session('file:///work/a/'), session('file:///work/a'), session('file:///work/c')];
    expect(usedFolders(sessions, [], null)).toEqual([
      { path: '/work/a', sessions: 2 },
      { path: '/work/b', sessions: 1 },
      { path: '/work/c', sessions: 1 },
    ]);
  });

  it('adds the workspace folders no session uses, and leaves out the host folder', () => {
    const sessions = [session('file:///home/me'), session('file:///work/a'), session()];
    expect(usedFolders(sessions, ['file:///work/a', 'file:///notes'], 'file:///home/me/')).toEqual([
      { path: '/work/a', sessions: 1 },
      { path: '/notes', sessions: 0 },
    ]);
  });

  it('shows a Windows folder by its drive path, and stops at the most it offers', () => {
    const sessions = [session('file:///C:/work'), session('file:///D:/x')];
    expect(usedFolders(sessions, [], null, 1)).toEqual([{ path: 'C:/work', sessions: 1 }]);
  });
});
