import { describe, expect, it } from 'vitest';
import { refKey } from '../../bridges/hosts.js';
import { toggled } from './pins.js';

describe('pins', () => {
  it('adds a pin, and takes it out the second time', () => {
    expect(toggled([], 'h:a')).toEqual(['h:a']);
    expect(toggled(['h:a'], 'h:a')).toEqual([]);
  });

  it('keeps two hosts\' same session apart', () => {
    const pins = toggled(toggled([], refKey('alpha', 'cofold:/1')), refKey('beta', 'cofold:/1'));
    expect(pins).toHaveLength(2);
  });
});
