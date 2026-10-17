import { describe, expect, it } from 'vitest';
import { BOOD_BODIES } from '@cofold/bood';
import { BOT_BODIES, boodBody, colorName, colorOf, gazeAt, isSlug, slugOf } from './look.js';

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

describe('gazeAt', () => {
  // A 170 by 100 box: bood's 8500 by 5000 at a fiftieth; the circle's eyes sit at 85, 47.
  const box = { left: 0, top: 0, width: 170, height: 100 };
  const eyeX = 85;
  const eyeY = 47;

  it('looks ahead at a point between the eyes, and a little toward a near one', () => {
    expect(gazeAt('circle', box, eyeX, eyeY)).toEqual({ facing: 0, lift: -0 });
    const near = gazeAt('circle', box, eyeX + 42.5, eyeY);
    expect(near.facing).toBeCloseTo(0.5);
    expect(near.lift).toBeCloseTo(0);
  });

  it('keeps the direction of a far point: just below and far right looks right and barely down', () => {
    const far = gazeAt('circle', box, eyeX + 700, eyeY + 20);
    expect(far.facing).toBeGreaterThan(0.99);
    expect(far.lift).toBeLessThan(0);
    expect(far.lift).toBeGreaterThan(-0.05);
    expect(Math.hypot(far.facing, far.lift)).toBeCloseTo(1);
  });

  it('turns smoothly as a far point goes down, with no jump', () => {
    const lifts = [0, 50, 100, 200, 400, 700].map((down) => gazeAt('circle', box, eyeX + 700, eyeY + down).lift);
    for (let at = 1; at < lifts.length; at += 1) expect(lifts[at]).toBeLessThan(lifts[at - 1]!);
    expect(lifts[1]).toBeGreaterThan(-0.1);
  });
});
