import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createScena } from '@softov/scena/core';
import { RIGHT_SIDEBAR } from '../../shell/right-sidebar.js';
import { canvasKey, canvasName, joined } from './canvases.js';
import { registerCanvases } from './index.js';

const STATE = { instanceId: 'i', extensionId: 'me.canvas', canvasId: 'board' };

describe('canvasName', () => {
  it('is the title, then the canvas id, then nothing', () => {
    expect(canvasName({ ...STATE, title: 'Board' })).toBe('Board');
    expect(canvasName({ ...STATE, title: '' })).toBe('board');
    expect(canvasName({ ...STATE, canvasId: '' })).toBeNull();
    expect(canvasName(undefined)).toBeNull();
  });
});

describe('joined', () => {
  it('is the canvases the list did not hold before, in their order', () => {
    expect(joined(new Set(['ahp-canvas:a']), ['ahp-canvas:a', 'ahp-canvas:c', 'ahp-canvas:b'])).toEqual(['ahp-canvas:c', 'ahp-canvas:b']);
    expect(joined(new Set(['ahp-canvas:a', 'ahp-canvas:b']), ['ahp-canvas:a'])).toEqual([]);
  });
});

describe('ahp.openCanvas', () => {
  beforeEach(() => {
    const held = new Map<string, string>();
    vi.stubGlobal('localStorage', { getItem: (key: string) => held.get(key) ?? null, setItem: (key: string, value: string) => { held.set(key, value); } });
  });
  afterEach(() => vi.unstubAllGlobals());

  const opened = () => {
    const scena = createScena();
    registerCanvases(scena);
    const where = () => ({ main: scena.surfaces.listAt('main').map((one) => one.key), right: scena.surfaces.listAt(RIGHT_SIDEBAR).map((one) => one.key) });
    const open = (place?: 'main' | 'right') => scena.commands.execute('ahp.openCanvas', { host: 'h', chat: 'ahp-chat://c', resource: 'ahp-canvas:a', ...(place === undefined ? {} : { place }) });
    return { open, where };
  };

  it('opens in the main area by default, one tab per canvas', async () => {
    const { open, where } = opened();
    await open();
    await open();
    expect(where()).toEqual({ main: [canvasKey('h', 'ahp-canvas:a')], right: [] });
  });

  it('takes the tab from the main area when it opens on the right', async () => {
    const { open, where } = opened();
    await open('main');
    await open('right');
    expect(where()).toEqual({ main: [], right: [canvasKey('h', 'ahp-canvas:a')] });
  });
});
