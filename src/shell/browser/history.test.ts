import { describe, expect, it } from 'vitest';
import { back, canBack, canForward, current, follow, forward, go, NO_VISITS, visit } from './history.js';

const three = visit(visit(visit(NO_VISITS, 'https://a.test/'), 'https://b.test/'), 'https://c.test/');

describe('visits', () => {
  it('starts with no address and nowhere to go', () => {
    expect(current(NO_VISITS)).toBeUndefined();
    expect(canBack(NO_VISITS)).toBe(false);
    expect(canForward(NO_VISITS)).toBe(false);
  });

  it('shows each address it opens', () => {
    expect(three.entries).toEqual(['https://a.test/', 'https://b.test/', 'https://c.test/']);
    expect(current(three)).toBe('https://c.test/');
    expect(canBack(three)).toBe(true);
    expect(canForward(three)).toBe(false);
  });

  it('does not add the address it shows again', () => {
    expect(visit(three, 'https://c.test/')).toBe(three);
  });

  it('goes back and forward', () => {
    const before = back(back(three));
    expect(current(before)).toBe('https://a.test/');
    expect(canBack(before)).toBe(false);
    expect(back(before)).toEqual(before);
    expect(current(forward(before))).toBe('https://b.test/');
  });

  it('drops the forward entries on a new address after back', () => {
    const after = visit(back(back(three)), 'https://d.test/');
    expect(after.entries).toEqual(['https://a.test/', 'https://d.test/']);
    expect(canForward(after)).toBe(false);
  });

  it('goes to an entry of the list, and ignores one out of it', () => {
    expect(current(go(three, 0))).toBe('https://a.test/');
    expect(go(three, 3)).toBe(three);
    expect(go(three, -1)).toBe(three);
  });

  it('follows a page the browser reached by itself', () => {
    const middle = back(three);
    expect(current(follow(middle, 'https://a.test/'))).toBe('https://a.test/');
    expect(current(follow(middle, 'https://c.test/'))).toBe('https://c.test/');
    expect(follow(middle, 'https://b.test/')).toBe(middle);
    expect(follow(middle, 'https://e.test/').entries).toEqual(['https://a.test/', 'https://b.test/', 'https://e.test/']);
  });
});
