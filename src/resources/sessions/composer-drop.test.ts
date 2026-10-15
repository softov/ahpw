import { describe, expect, it } from 'vitest';
import { pastedFiles } from './composer-drop.js';

const files = (count: number) => ({ length: count }) as unknown as FileList;

describe('pastedFiles', () => {
  it('takes the files of a screenshot or a copied file', () => {
    const list = files(1);
    expect(pastedFiles({ types: ['Files'], files: list })).toBe(list);
  });

  it('leaves text to paste as text, even with a picture of it beside', () => {
    expect(pastedFiles({ types: ['text/plain', 'text/html', 'Files'], files: files(1) })).toBeNull();
    expect(pastedFiles({ types: ['text/plain'], files: files(0) })).toBeNull();
  });
});
