import { describe, expect, it } from 'vitest';
import { elapsed, folderLabel, folderUri, newId, textOf } from './words.js';

describe('newId', () => {
  it('is a version 4 UUID', () => {
    expect(newId()).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });

  it('differs each call', () => {
    expect(newId()).not.toBe(newId());
  });
});

describe('folderUri', () => {
  it('turns a path into a file URI, encoding what needs it', () => {
    expect(folderUri('/home/me/my project')).toBe('file:///home/me/my%20project');
  });

  it('keeps a URI as it is', () => {
    expect(folderUri('file:///tmp')).toBe('file:///tmp');
    expect(folderUri(' vscode-remote://box/src ')).toBe('vscode-remote://box/src');
  });
});

describe('folderLabel', () => {
  it('reads a file URI as its path', () => {
    expect(folderLabel('file:///home/me/my%20project')).toBe('/home/me/my project');
  });

  it('leaves any other URI alone', () => {
    expect(folderLabel('vscode-remote://box/src')).toBe('vscode-remote://box/src');
  });
});

describe('textOf', () => {
  it('reads a string or a markdown object', () => {
    expect(textOf('plain')).toBe('plain');
    expect(textOf({ markdown: '**bold**' })).toBe('**bold**');
    expect(textOf(undefined)).toBe('');
  });
});

describe('elapsed', () => {
  it('keeps the two largest units', () => {
    expect(elapsed(13_000)).toBe('13s');
    expect(elapsed(313_000)).toBe('5m13s');
    expect(elapsed(7_500_000)).toBe('2h5m');
    expect(elapsed(266_400_000)).toBe('3d2h');
  });

  it('reads a negative or partial second as whole seconds from zero', () => {
    expect(elapsed(-5)).toBe('0s');
    expect(elapsed(999)).toBe('0s');
  });
});
