import type { DataBinding } from '@softov/scena/types';

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
