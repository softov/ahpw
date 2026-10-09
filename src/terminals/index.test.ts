import { describe, expect, it, vi } from 'vitest';
import { createScena } from '@softov/scena/core';
import type { HostCtx, ResolvedMount } from '@softov/scena/types';
import { AHP_HOST } from '../connection/data.js';
import { registerTerminals } from './index.js';
import { terminalItems } from './rows.js';

const host = {
  label: 'h',
  clientId: 'me',
  protocolVersion: null,
  serverSeq: 0,
  connectedAt: null,
  activeSessions: null,
  subscriptions: 0,
  terminals: [
    { resource: 'ahp-terminal:/a', title: 'bash', claim: { kind: 'client', clientId: 'me' }, lifecycle: { status: 'running' } },
    { resource: 'ahp-terminal:/b', title: 'npm test', claim: { kind: 'session', session: 's://1' }, lifecycle: { status: 'exited', exitCode: 1 } },
  ],
};

const menu = { closeMenu: vi.fn() } as unknown as HostCtx;

describe('terminals', () => {
  it('lists the host terminals in the palette, filtered by the query', () => {
    const scena = createScena();
    scena.store.set(AHP_HOST, host);
    const rows = terminalItems(scena, '');
    expect(rows.map((one) => 'title' in one && one.title)).toEqual(['Terminal: bash', 'Terminal: npm test']);
    expect(rows.map((one) => 'description' in one && one.description)).toEqual(['Yours', 'Held by a session, exited with 1']);
    expect(terminalItems(scena, 'npm')).toHaveLength(1);
    expect(terminalItems(scena, 'terminal')).toHaveLength(2);
  });

  it('opens a terminal as a tab in the bottom panel and shows the panel', async () => {
    const scena = createScena();
    registerTerminals(scena);
    scena.store.set(AHP_HOST, host);
    const row = terminalItems(scena, 'bash')[0];
    if (row === undefined || !('onSelect' in row)) throw new Error('no row');
    await row.onSelect(menu);
    await vi.waitFor(() => expect(scena.surfaces.listAt('panel:bottom').map((one) => one.key)).toEqual(['terminal:ahp-terminal:/a']));
    expect(scena.layout.get().surfaces['panel:bottom']?.visible).toBe(true);
  });

  it('offers kill on a terminal tab only', () => {
    const scena = createScena();
    registerTerminals(scena);
    const items = scena.mountMenus.collect('tab:context', { component: { component: 'TerminalPage', uri: 'ahp-terminal:/a' } } as unknown as ResolvedMount);
    expect(items.map((one) => 'title' in one && one.title)).toEqual(['New terminal', 'Kill terminal']);
    const none = scena.mountMenus.collect('tab:context', { component: { component: 'FilePage', uri: 'file:///a' } } as unknown as ResolvedMount);
    expect(none).toEqual([]);
  });
});
