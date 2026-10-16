import { describe, expect, it } from 'vitest';
import { BOOD_BODIES } from '@cofold/bood';
import { BOT_BODIES, boodBody, colorName, colorOf, isSlug, slugOf } from './look.js';

describe('look', () => {
  it('draws every body a host takes, semicircle as jelly', () => {
    for (const body of BOT_BODIES) expect(BOOD_BODIES).toContain(boodBody(body));
    expect(boodBody('semicircle')).toBe('jelly');
    expect(boodBody('nothing')).toBe('robot');
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
