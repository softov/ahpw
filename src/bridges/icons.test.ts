import { describe, expect, it } from 'vitest';
import { pickIcon, type Icon } from './icons.js';

const PLAIN: Icon = { src: 'data:image/svg+xml;base64,PHN2Zy8+', sizes: ['any'] };
const LIGHT: Icon = { src: 'data:image/png;base64,AAAA', theme: 'light' };
const DARK: Icon = { src: 'data:image/png;base64,BBBB', theme: 'dark' };

describe('pickIcon', () => {
  it('takes the icon made for the scheme shown', () => {
    expect(pickIcon([LIGHT, DARK], 'dark')).toBe(DARK);
    expect(pickIcon([LIGHT, DARK], 'light')).toBe(LIGHT);
  });

  it('takes one with no theme before one for the other scheme', () => {
    expect(pickIcon([LIGHT, PLAIN], 'dark')).toBe(PLAIN);
  });

  it('takes the other scheme when that is all there is', () => {
    expect(pickIcon([LIGHT], 'dark')).toBe(LIGHT);
  });

  it('draws no URL, and nothing that is not an image', () => {
    expect(pickIcon([{ src: 'https://example.com/a.svg' }], 'light')).toBeUndefined();
    expect(pickIcon([{ src: 'data:text/html;base64,PGI+' }], 'light')).toBeUndefined();
    expect(pickIcon([{ src: 'https://example.com/a.svg', theme: 'light' }, PLAIN], 'light')).toBe(PLAIN);
  });

  it('answers nothing for no icons', () => {
    expect(pickIcon(undefined, 'light')).toBeUndefined();
    expect(pickIcon([], 'dark')).toBeUndefined();
  });
});
