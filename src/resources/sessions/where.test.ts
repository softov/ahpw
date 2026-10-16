import { describe, expect, it } from 'vitest';
import type { ReactiveStore } from '@softov/scena/types';
import type { SessionSummary } from '@microsoft/agent-host-protocol';
import { ahpPaths } from '../../bridges/data.js';
import { folderName, whereLabel, wheresOf } from './where.js';

describe('whereLabel', () => {
  it('names the folder, with the host after it when there is one', () => {
    expect(whereLabel('/github/ahpd', 'dev1')).toBe('ahpd [dev1]');
    expect(whereLabel('/github/ahpd/', null)).toBe('ahpd');
    expect(whereLabel('C:\\Users\\me', null)).toBe('me');
    expect(folderName('/')).toBe('/');
  });
});

describe('wheresOf', () => {
  it('lists each host\'s own folder first, then the ones its sessions use', () => {
    const values = new Map<string, unknown>([
      [ahpPaths('a').defaultDirectory, 'file:///home/a'],
      [ahpPaths('a').sessions, [{ workingDirectories: ['file:///w/one'] }] as SessionSummary[]],
      [ahpPaths('b').defaultDirectory, 'file:///home/b'],
    ]);
    const store = { get: (path: string) => values.get(path) } as unknown as ReactiveStore;
    expect(wheresOf(store, ['a', 'b'])).toEqual([
      { host: 'a', path: '/home/a', sessions: 0 },
      { host: 'a', path: '/w/one', sessions: 1 },
      { host: 'b', path: '/home/b', sessions: 0 },
    ]);
  });
});
