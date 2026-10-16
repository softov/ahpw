/**
 * How a bot looks: the body and colour ahpd keeps, drawn by bood. ahpd's
 * lists are copied, not imported: `@ahpd/bot` reads `node:fs` on load.
 */

import { bodyOf, type BoodBody } from '@cofold/bood';

/** The bodies a host takes, as `@ahpd/bot`'s `BOT_BODIES`. */
export const BOT_BODIES = [
  'robot', 'humanoid', 'alien', 'gumbo', 'circle', 'semicircle', 'smash', 'square',
  'triangle', 'pentagon', 'hexagon', 'drop', 'bean', 'cloud', 'ghost',
] as const;
export type BotBody = (typeof BOT_BODIES)[number];

/**
 * The colour names a host keeps, and the bood colour each is drawn in, as
 * ahpapp draws them. `black` has no bood swatch, so it gets a near black.
 */
export const COLOR_HEX: Readonly<Record<string, string>> = {
  red: '#d7263d', orange: '#f26b0f', yellow: '#f59e0b', green: '#2f9e5b', teal: '#2fa39a', blue: '#2f6fdf',
  purple: '#7c4fe0', pink: '#d6338a', brown: '#7a5230', grey: '#7a7a7a', black: '#1f1f23',
};

/** A host gives `red` to a bot made without a colour. */
const DEFAULT_COLOR = COLOR_HEX.red!;
const HEX = /^#[0-9a-f]{6}$/i;

/** A host's colour as a hex to draw: a name, or a hex as it is. */
export function colorOf(said: string | undefined): string {
  if (said === undefined) return DEFAULT_COLOR;
  if (HEX.test(said)) return said.toLowerCase();
  return COLOR_HEX[said.toLowerCase()] ?? DEFAULT_COLOR;
}

/** A hex as a host keeps it: the name where there is one, else the hex. */
export function colorName(hex: string): string {
  const lower = hex.toLowerCase();
  return Object.entries(COLOR_HEX).find(([, value]) => value === lower)?.[0] ?? lower;
}

/** The bood body a host's body is drawn as; ahpd's `semicircle` is bood's `jelly`. */
export function boodBody(body: string): BoodBody {
  return bodyOf(body) ?? 'robot';
}

/** Whether a host takes this as a bot's slug: lowercase letters, digits and dashes, 1 to 40, starting with a letter. */
export const isSlug = (value: string): boolean => /^[a-z][a-z0-9-]{0,39}$/.test(value);

/** A slug from a name, not one in `taken`. */
export function slugOf(name: string, taken: readonly string[]): string {
  const base = name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^[^a-z]+/, '').slice(0, 34).replace(/-+$/, '') || 'bot';
  if (!taken.includes(base)) return base;
  for (let n = 2; ; n += 1) {
    const slug = `${base}-${n}`;
    if (!taken.includes(slug)) return slug;
  }
}
