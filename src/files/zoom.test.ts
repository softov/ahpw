import { describe, expect, it } from 'vitest';
import { percentOf } from './zoom.js';

describe('percentOf', () => {
  it('gives the drawn size against the image\'s own pixels', () => {
    expect(percentOf(1, 400, 1600)).toBe(25);
    expect(percentOf(2, 400, 1600)).toBe(50);
    expect(percentOf(1, 64, 64)).toBe(100);
  });

  it('falls back to the scale while the image is not measured', () => {
    expect(percentOf(1.5, 0, 0)).toBe(150);
  });
});
