import { afterEach, describe, expect, it, vi } from 'vitest';
import { NEW_TIPS, readTipCount, TIP_KEY, tipAt, tipsFor, writeTipCount } from './tips.js';

/** A window whose storage holds `held`, or throws when `held` is null. */
function stubStorage(held: Map<string, string> | null): void {
  const refuse = (): never => { throw new Error('blocked'); };
  vi.stubGlobal('window', {
    localStorage: held === null
      ? { getItem: refuse, setItem: refuse }
      : { getItem: (key: string) => held.get(key) ?? null, setItem: (key: string, value: string) => { held.set(key, value); } },
  });
}

afterEach(() => vi.unstubAllGlobals());

describe('tipsFor', () => {
  it('leaves out the / tip for an agent with no commands', () => {
    expect(tipsFor(false).some((one) => one.keys === '/')).toBe(false);
    expect(tipsFor(true)[0]?.keys).toBe('/');
    expect(tipsFor(true)).toHaveLength(NEW_TIPS.length);
  });
});

describe('tipAt', () => {
  it('walks the list in order and starts again after the last tip', () => {
    const tips = tipsFor(true);
    expect(tipAt(tips, 0)).toBe(tips[0]);
    expect(tipAt(tips, 1)).toBe(tips[1]);
    expect(tipAt(tips, tips.length)).toBe(tips[0]);
  });
});

describe('the tip count', () => {
  it('reads what was written', () => {
    stubStorage(new Map());
    writeTipCount(3);
    expect(readTipCount()).toBe(3);
  });

  it('reads 0 for blocked storage and for a value that is not a whole number', () => {
    stubStorage(null);
    expect(readTipCount()).toBe(0);
    expect(() => writeTipCount(1)).not.toThrow();
    stubStorage(new Map([[TIP_KEY, 'two']]));
    expect(readTipCount()).toBe(0);
  });
});
