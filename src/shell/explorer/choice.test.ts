import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { readTicks } from './choice.js';

const KEY = 'test.ticks';
const VALUES = ['user', 'team', 'project'] as const;
const held = new Map<string, string>();

beforeEach(() => {
  held.clear();
  vi.stubGlobal('localStorage', { getItem: (key: string) => held.get(key) ?? null, setItem: (key: string, value: string) => { held.set(key, value); } });
});
afterEach(() => vi.unstubAllGlobals());

test('ticks come back in the values\' order, unknown and blank ones left out', () => {
  held.set(KEY, 'project,,teapot,user');
  expect(readTicks(KEY, VALUES)).toEqual(['user', 'project']);
});

test('a single choice kept before ticks comes back ticked, and nothing kept is none ticked', () => {
  held.set(KEY, 'team');
  expect(readTicks(KEY, VALUES)).toEqual(['team']);
  held.set(KEY, 'none');
  expect(readTicks(KEY, VALUES)).toEqual([]);
  held.delete(KEY);
  expect(readTicks(KEY, VALUES)).toEqual([]);
});
