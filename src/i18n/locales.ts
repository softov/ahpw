import { getLocale, translate } from '@softov/scena';
import type { DataBinding } from '@softov/scena/types';
import en from './en.json';

/** The languages ahpw speaks, English first: the one a missing key falls back to. */
export const LOCALES = ['en', 'es-419', 'pt-BR'] as const;

/** A mount prop bound to a message, so it follows a language switch. */
export function bound(key: string): DataBinding {
  return { path: `$/t/${key}` } as DataBinding;
}

/** The stored choice, else the browser's first language ahpw speaks, else English. */
export function initialLocale(stored: string | null, preferred: readonly string[]): string {
  if (stored !== null && (LOCALES as readonly string[]).includes(stored)) return stored;
  for (const tag of preferred) {
    const language = tag.toLowerCase().split('-')[0];
    const hit = LOCALES.find((one) => one.split('-')[0] === language);
    if (hit !== undefined) return hit;
  }
  return 'en';
}

/** A message's English text, so a command can still be found by its English name in another language. */
export function english(key: string): string {
  let node: unknown = en;
  for (const segment of key.split('/')) node = (node as Record<string, unknown> | undefined)?.[segment];
  if (typeof node !== 'string') throw new Error(`No English message for ${key}`);
  return node;
}

/** A date format that follows the chosen language; one Intl formatter is kept per language. */
export function dateFormat(options: Intl.DateTimeFormatOptions): { format(date: Date | number): string } {
  let held: { locale: string; format: Intl.DateTimeFormat } | null = null;
  return {
    format(date) {
      const locale = getLocale();
      if (held?.locale !== locale) held = { locale, format: new Intl.DateTimeFormat(locale, options) };
      return held.format.format(date);
    },
  };
}

/**
 * A message that changes with a count: `<key>/one` or `<key>/other`, as the
 * chosen language's plural rules pick, with `{count}` and `params` filled in.
 * scena's translate has no plurals of its own.
 */
export function plural(key: string, count: number, params: Record<string, unknown> = {}): string {
  // 0 takes the plural in every language ahpw speaks: "0 sessões", though CLDR counts 0 as one in Portuguese.
  const form = count !== 0 && new Intl.PluralRules(getLocale()).select(count) === 'one' ? 'one' : 'other';
  return translate(`${key}/${form}`, { ...params, count });
}
