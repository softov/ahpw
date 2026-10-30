import { describe, expect, it } from 'vitest';
import type { ScenaLayout } from '@softov/scena/types';
import type { SessionSummary } from '@microsoft/agent-host-protocol';
import { refKey } from '../../../bridges/hosts.js';
import { botsInShownChats, shownMountKeys } from './shown.js';

describe('shownMountKeys', () => {
  it('reads every group of a tab-panel, its first tab when none is active, and skips a hidden surface', () => {
    const layout = {
      surfaces: {
        main: {
          visible: true,
          layout: 'tab-panel',
          activeContainerKey: 'b',
          tabPanel: {
            tree: {
              kind: 'split',
              direction: 'row',
              first: { kind: 'leaf', id: 'l1', tabs: ['a', 'b'], activeKey: 'b' },
              second: { kind: 'leaf', id: 'l2', tabs: ['c', 'd'] },
            },
          },
        },
        'sidebar:right': { visible: true, activeContainerKey: 'e' },
        'sidebar:left': { visible: false, activeContainerKey: 'f' },
      },
    } as unknown as ScenaLayout;
    expect(shownMountKeys(layout, () => ['e', 'f'])).toEqual(['b', 'c', 'e']);
  });

  it('takes the newest open mount when the active key names a closed one', () => {
    const layout = { surfaces: { 'sidebar:right': { visible: true, activeContainerKey: 'closed' } } } as unknown as ScenaLayout;
    expect(shownMountKeys(layout, () => ['details', 'files'])).toEqual(['files']);
    expect(shownMountKeys(layout, () => [])).toEqual([]);
  });
});

describe('botsInShownChats', () => {
  const summary = (resource: string, meta?: Record<string, unknown>): SessionSummary =>
    ({ resource, ...(meta === undefined ? {} : { _meta: meta }) }) as unknown as SessionSummary;

  it('names the bot of each shown session that carries a mark, on its own host', () => {
    const sessions = [
      [summary('ahp://s/1', { bot: 'ember', name: 'Ember' }), summary('ahp://s/2')],
      [summary('ahp://s/1', { bot: 'tester' })],
    ];
    const shown = ['session:h1:ahp://s/1', 'session:h1:ahp://s/2', 'bot:h2:tester', 'session:h2:ahp://s/3'];
    expect([...botsInShownChats(shown, ['h1', 'h2'], sessions)]).toEqual([refKey('h1', 'ember')]);
  });
});
