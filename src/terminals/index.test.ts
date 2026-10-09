import { describe, expect, it, vi } from 'vitest';
import { createScena } from '@softov/scena/core';
import type { HostCtx, ResolvedMount } from '@softov/scena/types';
import { AHP_DETACHED, AHP_HOST } from '../connection/data.js';
import { registerPanel } from '../panel/index.js';
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

/** Let the store's queued notifications run. */
const settle = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));

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

  it('opens a terminal as a tab in the bottom panel, after the log, and shows the panel', async () => {
    const scena = createScena();
    registerPanel(scena);
    registerTerminals(scena);
    scena.store.set(AHP_HOST, host);
    const row = terminalItems(scena, 'bash')[0];
    if (row === undefined || !('onSelect' in row)) throw new Error('no row');
    await row.onSelect(menu);
    await vi.waitFor(() => expect(scena.layout.get().surfaces['panel:bottom']?.activeContainerKey).toBe('terminal:ahp-terminal:/a'));
    expect(scena.layout.get().surfaces['panel:bottom']?.visible).toBe(true);
  });

  it('opens a tab for every host terminal in the background, and closes the tab of one the host drops', async () => {
    const scena = createScena();
    registerPanel(scena);
    registerTerminals(scena);
    scena.store.set(AHP_HOST, host);
    await settle();
    const keys = (): string[] => scena.surfaces.listAt('panel:bottom').map((one) => one.key);
    expect(keys()).toEqual(['panel:log', 'terminal:ahp-terminal:/a', 'terminal:ahp-terminal:/b']);
    expect(scena.layout.get().surfaces['panel:bottom']?.activeContainerKey).toBe('panel:log');
    expect(scena.layout.get().surfaces['panel:bottom']?.visible).not.toBe(true);

    scena.store.set(AHP_HOST, { ...host, terminals: host.terminals.slice(0, 1) });
    await settle();
    expect(keys()).toEqual(['panel:log', 'terminal:ahp-terminal:/a']);
  });

  it('keeps a closed tab closed while the terminal runs, until it is opened again', async () => {
    const scena = createScena();
    registerPanel(scena);
    registerTerminals(scena);
    scena.store.set(AHP_HOST, host);
    await settle();
    scena.surfaces.close('terminal:ahp-terminal:/a');
    await settle();
    scena.store.set(AHP_HOST, { ...host, serverSeq: 1 });
    await settle();
    const keys = (): string[] => scena.surfaces.listAt('panel:bottom').map((one) => one.key);
    expect(keys()).toEqual(['panel:log', 'terminal:ahp-terminal:/b']);

    await scena.commands.execute('ahp.openTerminal', { uri: 'ahp-terminal:/a' });
    expect(keys()).toContain('terminal:ahp-terminal:/a');
  });

  it('disconnects the active tab and connects it again, keeping the tab', async () => {
    const scena = createScena();
    registerPanel(scena);
    registerTerminals(scena);
    scena.store.set(AHP_HOST, host);
    await settle();
    scena.store.set('$/tab/key', 'terminal:ahp-terminal:/b');
    await scena.commands.execute('ahp.disconnectTerminal');
    expect(scena.store.get(AHP_DETACHED)).toEqual(['ahp-terminal:/b']);
    expect(scena.surfaces.listAt('panel:bottom').map((one) => one.key)).toContain('terminal:ahp-terminal:/b');
    await scena.commands.execute('ahp.connectTerminal', { uri: 'ahp-terminal:/b' });
    expect(scena.store.get(AHP_DETACHED)).toEqual([]);
  });

  it('offers disconnect and kill on a terminal tab only', () => {
    const scena = createScena();
    registerTerminals(scena);
    const items = scena.mountMenus.collect('tab:context', { component: { component: 'TerminalPage', uri: 'ahp-terminal:/a' } } as unknown as ResolvedMount);
    expect(items.map((one) => 'title' in one && one.title)).toEqual(['New terminal', 'Disconnect terminal', 'Kill terminal']);
    const none = scena.mountMenus.collect('tab:context', { component: { component: 'FilePage', uri: 'file:///a' } } as unknown as ResolvedMount);
    expect(none).toEqual([]);
  });
});
