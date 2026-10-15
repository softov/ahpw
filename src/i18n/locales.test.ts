import { describe, expect, it } from 'vitest';
import en from './en.json';
import es from './es.json';
import pt from './pt.json';
import { registerMessages, setLocale } from '@softov/scena';
import { dateFormat, english, initialLocale, intlLocale, plural } from './locales.js';

/** Every leaf key of a message tree, as `a/b/c`. */
function keys(tree: object, prefix = ''): string[] {
  return Object.entries(tree).flatMap(([key, value]) =>
    typeof value === 'object' && value !== null ? keys(value as object, `${prefix}${key}/`) : [`${prefix}${key}`]);
}

describe('messages', () => {
  it('Spanish and Portuguese have every English key and no other', () => {
    const english = keys(en).sort();
    expect(keys(es).sort()).toEqual(english);
    expect(keys(pt).sort()).toEqual(english);
  });
});

describe('initialLocale', () => {
  it('keeps a stored choice ahpw speaks', () => {
    expect(initialLocale('pt-BR', ['en-US'])).toBe('pt-BR');
  });

  it('follows the browser by language when nothing is stored', () => {
    expect(initialLocale(null, ['pt-PT', 'en'])).toBe('pt-BR');
    expect(initialLocale(null, ['es-MX'])).toBe('es-419');
    expect(initialLocale(null, ['fr-FR', 'es'])).toBe('es-419');
  });

  it('falls back to English for a stored or browser language it does not speak', () => {
    expect(initialLocale('fr', ['de-DE'])).toBe('en');
    expect(initialLocale(null, [])).toBe('en');
  });
});

describe('english', () => {
  it('reads a nested message', () => {
    expect(english('shell/commands/selectLocale')).toBe('Change language…');
  });

  it('refuses a key English does not have', () => {
    expect(() => english('shell/nope')).toThrow('No English message for shell/nope');
  });
});

describe('plural', () => {
  it('picks one or other by the language, and fills the count in', () => {
    registerMessages('en', { test: { files: { one: '{count} file', other: '{count} files' } } });
    expect(plural('test/files', 1)).toBe('1 file');
    expect(plural('test/files', 0)).toBe('0 files');
    expect(plural('test/files', 3)).toBe('3 files');
  });

  it('gives 0 the plural in Portuguese too, where CLDR counts 0 as one', () => {
    registerMessages('pt-BR', { test: { files: { one: '{count} arquivo', other: '{count} arquivos' } } });
    setLocale('pt-BR');
    expect(plural('test/files', 0)).toBe('0 arquivos');
    expect(plural('test/files', 1)).toBe('1 arquivo');
    expect(plural('test/files', 2)).toBe('2 arquivos');
    setLocale('en');
  });

  it('does not throw in a made-up language Intl does not know', () => {
    registerMessages('en', { test: { files: { one: '{count} file', other: '{count} files' } } });
    setLocale('x-aur');
    expect(plural('test/files', 1)).toBe('1 file');
    setLocale('en');
  });
});

describe('intlLocale and dateFormat', () => {
  it('a made-up language reads as English to Intl', () => {
    setLocale('x-aur');
    expect(intlLocale()).toBe('en');
    setLocale('pt-BR');
    expect(intlLocale()).toBe('pt-BR');
    setLocale('en');
  });

  it('a date follows a language switch', () => {
    const month = dateFormat({ month: 'long', timeZone: 'UTC' });
    const march = Date.UTC(2026, 2, 15);
    expect(month.format(march)).toBe('March');
    setLocale('pt-BR');
    expect(month.format(march)).toBe('março');
    setLocale('es-419');
    expect(month.format(march)).toBe('marzo');
    setLocale('en');
  });
});
