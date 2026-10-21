import { describe, expect, it } from 'vitest';
import { expiresAt } from './expiry.js';

const NOW = new Date(2026, 9, 21, 10, 0, 0).getTime();

describe('expiresAt', () => {
  it('is nothing for a key that never expires', () => {
    expect(expiresAt('never', '', NOW)).toBeUndefined();
  });

  it('is a number of days from now', () => {
    expect(expiresAt('7', '', NOW)).toBe(NOW + 7 * 24 * 60 * 60 * 1000);
    expect(expiresAt('365', '', NOW)).toBe(NOW + 365 * 24 * 60 * 60 * 1000);
  });

  it('is the end of a picked day, where the person is', () => {
    expect(expiresAt('date', '2026-12-31', NOW)).toBe(new Date(2026, 11, 31, 23, 59, 59, 999).getTime());
  });

  it('is nothing for a date with no day picked', () => {
    expect(expiresAt('date', '', NOW)).toBeUndefined();
  });
});
