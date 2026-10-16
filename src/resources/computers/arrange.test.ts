import { describe, expect, it } from 'vitest';
import { groupOf, keeps, type ComputerItem } from './arrange.js';

const item = (standing: ComputerItem['standing']): ComputerItem => ({ host: 'a', hostName: 'Alpha', standing });

describe('computers arrange', () => {
  it('groups by host or by state, problems first', () => {
    expect(groupOf(item('running'), 'none')).toBeUndefined();
    expect(groupOf(item('running'), 'host')).toEqual({ key: 'a', label: 'Alpha' });
    expect(groupOf(item('problem'), 'state')?.rank).toBe(0);
    expect(groupOf(item('stopped'), 'state')?.rank).toBe(2);
  });

  it('keeps what the filter asks for', () => {
    expect(keeps(item('running'), 'all')).toBe(true);
    expect(keeps(item('running'), 'stopped')).toBe(false);
    expect(keeps(item('problem'), 'problem')).toBe(true);
  });
});
