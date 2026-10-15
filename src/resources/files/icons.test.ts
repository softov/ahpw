import { describe, expect, it } from 'vitest';
import { EMOJIcon } from '../emojis.js';
import { iconOf } from './icons.js';

describe('file icons', () => {
  it('draws a file by its kind, whatever the case of its extension', () => {
    expect(iconOf('file:///w/ahc-logo.PNG')).toBe(EMOJIcon.image);
    expect(iconOf('file:///w/ahc-logo.svg')).toBe(EMOJIcon.image);
    expect(iconOf('file:///w/clip.webm')).toBe(EMOJIcon.video);
    expect(iconOf('file:///w/note.mp3')).toBe(EMOJIcon.audio);
    expect(iconOf('file:///w/src/main.tsx')).toBe(EMOJIcon.code);
    expect(iconOf('file:///w/package.json')).toBe(EMOJIcon.data);
    expect(iconOf('file:///w/README.md')).toBe(EMOJIcon.markdown);
    expect(iconOf('file:///w/a.tar.gz')).toBe(EMOJIcon.archive);
  });

  it('draws the plain file icon for a kind it does not know, or no extension', () => {
    expect(iconOf('file:///w/LICENSE')).toBe(EMOJIcon.file);
    expect(iconOf('file:///w/.gitignore')).toBe(EMOJIcon.file);
    expect(iconOf('file:///w/notes.txt')).toBe(EMOJIcon.file);
  });
});
