import { describe, expect, it } from 'vitest';
import { BOOD_BODIES } from '@cofold/bood';
import { BOT_BODIES, boodBody, colorName, colorOf, isSlug, slugOf } from './look.js';

describe('look', () => {
  it('offers bood\'s released bodies, draws each as itself, an old name as its body, and any other word as a square', () => {
    expect(BOT_BODIES).toContain('flame');
    expect(BOT_BODIES).not.toContain('logo');
    for (const body of BOT_BODIES) expect(boodBody(body)).toBe(body);
    expect(BOOD_BODIES).toContain(boodBody('semicircle'));
    expect(boodBody('semicircle')).toBe('jelly');
    expect(boodBody(' Flame ')).toBe('flame');
    expect(boodBody('zebra')).toBe('square');
  });

  it('turns colour names into hex and back, and keeps a hex', () => {
    expect(colorOf('Blue')).toBe('#2f6fdf');
    expect(colorName('#2F6FDF')).toBe('blue');
    expect(colorOf('#ABCDEF')).toBe('#abcdef');
    expect(colorName('#abcdef')).toBe('#abcdef');
    expect(colorOf(undefined)).toBe('#d7263d');
  });

  it('makes a slug a host takes, the next free one when taken', () => {
    expect(slugOf('Café Bot!', [])).toBe('cafe-bot');
    expect(slugOf('Café Bot', ['cafe-bot'])).toBe('cafe-bot-2');
    expect(slugOf('42', [])).toBe('bot');
    expect(isSlug(slugOf('x'.repeat(60), []))).toBe(true);
  });
});
