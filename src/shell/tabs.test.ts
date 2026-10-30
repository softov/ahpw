import { describe, expect, it, vi } from 'vitest';
import { createScena } from '@softov/scena/core';

describe('keepTabs', () => {
  it('gives the focus back to the tab that had it, not to the last tab opened', async () => {
    const held = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => held.get(key) ?? null,
      setItem: (key: string, value: string) => { held.set(key, value); },
      removeItem: (key: string) => { held.delete(key); },
    });
    const mount = (key: string) => ({ key, surface: 'main', component: { component: 'Page' }, state: {}, openedAt: 1 });
    held.set('ahpd-web.session.v1', JSON.stringify({ version: 1, capturedAt: 1, mounts: [mount('a'), mount('b')], surfaces: {} }));
    // The store is made on import, so it sees the stubbed storage.
    const { keepTabs } = await import('./tabs.js');
    const scena = createScena();
    scena.components.register({ component: 'Page', category: 'page', renderer: { kind: 'react', load: async () => ({ default: () => null }) } });
    scena.layout.setSurface('main', { visible: true, activeContainerKey: 'a' });

    const kept = await keepTabs(scena, () => true);
    expect(scena.surfaces.listAt('main').map((one) => one.key)).toEqual(['a', 'b']);
    expect(scena.layout.get().surfaces.main?.activeContainerKey).toBe('a');
    kept?.dispose();
    vi.unstubAllGlobals();
  });
});
