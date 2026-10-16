import { describe, expect, it } from 'vitest';
import { languageOf, loadLanguage } from './languages.js';

describe('editor languages', () => {
  it('names the language by the extension, in any case', () => {
    expect(languageOf('file:///w/src/main.ts')).toBe('typescript');
    expect(languageOf('file:///w/App.TSX')).toBe('tsx');
    expect(languageOf('file:///w/lib/x.mjs')).toBe('javascript');
    expect(languageOf('file:///w/a.hpp')).toBe('cpp');
    expect(languageOf('file:///w/a.h')).toBe('cpp');
    expect(languageOf('file:///w/index.xhtml')).toBe('html');
    expect(languageOf('file:///w/icon.svg')).toBe('xml');
    expect(languageOf('file:///w/tsconfig.jsonc')).toBe('json');
    expect(languageOf('file:///w/ci.yml')).toBe('yaml');
    expect(languageOf('file:///w/run.bash')).toBe('shell');
    expect(languageOf('file:///w/Main.kt')).toBe('kotlin');
    expect(languageOf('file:///w/Program.cs')).toBe('csharp');
  });

  it('knows a Dockerfile by its name', () => {
    expect(languageOf('file:///w/Dockerfile')).toBe('dockerfile');
    expect(languageOf('file:///w/Dockerfile.dev')).toBe('dockerfile');
    expect(languageOf('file:///w/app.dockerfile')).toBe('dockerfile');
  });

  it('leaves a link\'s line mark out', () => {
    expect(languageOf('file:///w/a.py#L3')).toBe('python');
    expect(languageOf('file:///w/a.rs?x=1')).toBe('rust');
  });

  it('is plain text for an unknown extension, a dotfile, or no extension', () => {
    expect(languageOf('file:///w/notes.txt')).toBeNull();
    expect(languageOf('file:///w/.env')).toBeNull();
    expect(languageOf('file:///w/Makefile')).toBeNull();
    expect(languageOf('file:///w/a.')).toBeNull();
  });

  it('loads nothing for plain text, and a support for a language', async () => {
    expect(await loadLanguage(null)).toEqual([]);
    expect(await loadLanguage('toml')).toBeTruthy();
    expect(await loadLanguage('json')).toBeTruthy();
  });
});
