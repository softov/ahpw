import { describe, expect, it } from 'vitest';
import { codePath, fileLink } from './link.js';

describe('fileLink', () => {
  it('resolves a relative path against the folder and reads the lines', () => {
    expect(fileLink('src/a.ts#L42-L50', 'file:///work/app')).toEqual({ uri: 'file:///work/app/src/a.ts', name: 'a.ts', line: 42, end: 50 });
  });

  it('takes a file URI or an absolute path as given, folding dot segments', () => {
    expect(fileLink('file:///work/app/./b/../c.md', null)?.uri).toBe('file:///work/app/c.md');
    expect(fileLink('/etc/hosts#L3', null)).toMatchObject({ uri: 'file:///etc/hosts', line: 3, end: null });
  });

  it('reads a :line suffix, which is how agents write a line into a link', () => {
    expect(fileLink('/w/src/layout.ts:448', null)).toMatchObject({ uri: 'file:///w/src/layout.ts', line: 448, end: null });
    expect(fileLink('file:///w/a.ts:12:5', null)).toMatchObject({ uri: 'file:///w/a.ts', line: 12 });
    expect(fileLink('layout.ts:448', 'file:///w')).toMatchObject({ uri: 'file:///w/layout.ts', line: 448 });
    expect(fileLink('/w/a.ts:12#L3', null)).toMatchObject({ uri: 'file:///w/a.ts:12', line: 3 });
  });

  it('leaves the web and anchors alone', () => {
    expect(fileLink('https://example.com/a.ts', '/w')).toBeNull();
    expect(fileLink('#section', '/w')).toBeNull();
    expect(fileLink('a.ts', null)).toBeNull();
  });
});

describe('codePath', () => {
  it('reads a path with a line', () => {
    expect(codePath('src/a.ts:12', 'file:///w')).toMatchObject({ uri: 'file:///w/src/a.ts', line: 12 });
    expect(codePath('README.md', 'file:///w')?.uri).toBe('file:///w/README.md');
  });

  it('does not take code for a path', () => {
    expect(codePath('npm install', '/w')).toBeNull();
    expect(codePath('foo()', '/w')).toBeNull();
    expect(codePath('1.2.3', '/w')).toBeNull();
    expect(codePath('true', '/w')).toBeNull();
  });
});
