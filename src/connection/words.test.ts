import { describe, expect, it } from 'vitest';
import { folderLabel, folderUri, newId, textOf } from './words.js';

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
