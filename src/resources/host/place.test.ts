import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { keepSettingsPlace, settingsPlace } from './place.js';

describe('settingsPlace', () => {
  let held: Map<string, string>;
  beforeEach(() => {
    held = new Map();
    vi.stubGlobal('localStorage', { getItem: (key: string) => held.get(key) ?? null, setItem: (key: string, value: string) => { held.set(key, value); } });
  });
  afterEach(() => vi.unstubAllGlobals());

  it('is the floating window when nothing was chosen', () => {
    expect(settingsPlace()).toBe('overlay');
  });

  it('reads back the place that was kept', () => {
    keepSettingsPlace('sidebar:right');
    expect(settingsPlace()).toBe('sidebar:right');
  });

  it('falls back to the window for a value it does not know', () => {
    held.set('ahpw.settingsPlace', 'somewhere');
    expect(settingsPlace()).toBe('overlay');
  });
});
