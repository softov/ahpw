/**
 * How a bot looks: the body and colour ahpd keeps, drawn by bood. ahpd's
 * colours are copied, not imported: `@ahpd/bot` reads `node:fs` on load.
 */

import { BOOD_H, BOOD_RELEASED, BOOD_W, bodyOf, creatures, type BoodBody } from '@cofold/bood';

/**
 * The bodies a bot is offered: bood's released ones. A host keeps any word as
 * a body, so these are suggestions, not a limit.
 */
export const BOT_BODIES: readonly BoodBody[] = BOOD_RELEASED;

/** What a body bood does not know is drawn as. */
const UNKNOWN_BODY: BoodBody = 'square';

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

/** The bood body a host's body is drawn as: by its name or an old one (`semicircle` is `jelly`), else a square. */
export function boodBody(body: string): BoodBody {
  return bodyOf(body.trim().toLowerCase()) ?? UNKNOWN_BODY;
}

/** Whether bood draws this body as itself, rather than as a square. */
export const knowsBody = (body: string): boolean => bodyOf(body.trim().toLowerCase()) !== undefined;

/**
 * Where a bot looks to see a point on the page: from between its eyes, in
 * reaches of half its width on both axes, and held to one reach, so a far
 * point keeps its direction. A point just below the eyes and far to the right
 * looks right and a little down, not all the way down.
 */
export function gazeAt(body: BoodBody, box: { left: number; top: number; width: number; height: number }, x: number, y: number): { facing: number; lift: number } {
  // The drawing fits its box whole, centred, as an SVG viewBox does.
  const scale = Math.min(box.width / BOOD_W, box.height / BOOD_H);
  const { centerX, centerY } = creatures[body].eyes;
  const reach = box.width / 2;
  const dx = (x - (box.left + (box.width - BOOD_W * scale) / 2 + centerX * scale)) / reach;
  const dy = (y - (box.top + (box.height - BOOD_H * scale) / 2 + centerY * scale)) / reach;
  const far = Math.max(1, Math.hypot(dx, dy));
  return { facing: dx / far, lift: -dy / far };
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
