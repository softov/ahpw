import { describe, expect, it } from 'vitest';
import { EMOJIcon, toMonochromeEmoji } from './emojis.js';

describe('toMonochromeEmoji', () => {
  it('asks for the text form of a pictograph, and turns a colour request into a text one', () => {
    expect(toMonochromeEmoji('🤖')).toBe('🤖\u{FE0E}');
    expect(toMonochromeEmoji('⚙\u{FE0F}')).toBe('⚙\u{FE0E}');
    expect(toMonochromeEmoji('⏰\u{FE0E}')).toBe('⏰\u{FE0E}');
  });

  it('leaves letters alone', () => {
    expect(toMonochromeEmoji('AB')).toBe('AB');
  });
});

describe('EMOJIcon', () => {
  it('asks for no colour emoji', () => {
    for (const glyph of Object.values(EMOJIcon)) expect(glyph).not.toContain('\u{FE0F}');
  });
});
