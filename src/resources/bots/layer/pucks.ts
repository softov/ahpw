/**
 * Where the floating bots rest: in pucks on the window's edges, as ahpapp
 * lays them out. A puck sits at a share along its edge, so it keeps its place
 * when the window is resized, and draws a few of its bots and a count of the rest.
 */

import { hostKey } from '../../../lib/storage-keys.js';

export type Edge = 'left' | 'right' | 'top' | 'bottom';

export interface Puck {
  id: string;
  edge: Edge;
  /** Where along its edge, from 0 (top or left) to 1. */
  at: number;
  /** The bots it holds, as `refKey(host, slug)`, front first. */
  bots: string[];
}

/** How many bots a puck draws before it counts the rest. */
export const CLUSTER_MAX = 4;

/** Where a new bot rests when no puck holds it. */
const HOME: Pick<Puck, 'edge' | 'at'> = { edge: 'right', at: 0.5 };

/**
 * The pucks for the bots there are: each keeps the bots it holds that still
 * exist, an empty one goes, and a bot no puck holds joins the first puck on
 * the right edge, or a new one there.
 */
export function fillPucks(bots: readonly string[], pucks: readonly Puck[]): Puck[] {
  const there = new Set(bots);
  const kept = pucks.map((puck) => ({ ...puck, bots: puck.bots.filter((bot) => there.has(bot)) })).filter((puck) => puck.bots.length > 0);
  const held = new Set(kept.flatMap((puck) => puck.bots));
  const loose = bots.filter((bot) => !held.has(bot));
  if (loose.length === 0) return kept;
  const home = kept.findIndex((puck) => puck.edge === HOME.edge);
  if (home < 0) return [...kept, { id: 'home', ...HOME, bots: loose }];
  return kept.map((puck, at) => (at === home ? { ...puck, bots: [...puck.bots, ...loose] } : puck));
}

/** The bots a puck draws, and how many more it holds. */
export function splitCluster(bots: readonly string[], max = CLUSTER_MAX): { shown: string[]; more: number } {
  return { shown: bots.slice(0, max), more: Math.max(0, bots.length - max) };
}

/** The pucks without `bots`, an emptied one gone. */
function without(pucks: readonly Puck[], bots: readonly string[]): Puck[] {
  const moving = new Set(bots);
  return pucks.map((puck) => ({ ...puck, bots: puck.bots.filter((bot) => !moving.has(bot)) })).filter((puck) => puck.bots.length > 0);
}

/** `bots` dropped on the puck `target`, at its back. */
export function joinPuck(pucks: readonly Puck[], bots: readonly string[], target: string): Puck[] {
  return without(pucks, bots).map((puck) => (puck.id === target ? { ...puck, bots: [...puck.bots, ...bots] } : puck));
}

/** `bots` taken out to a puck of their own, `id`, on `edge` at `at`. */
export function takeOut(pucks: readonly Puck[], bots: readonly string[], id: string, edge: Edge, at: number): Puck[] {
  return [...without(pucks, bots), { id, edge, at, bots: [...bots] }];
}

/** The edge nearest a point in a window of `width` by `height`, and where along it, kept off the corners. */
export function snapPuck(x: number, y: number, width: number, height: number): Pick<Puck, 'edge' | 'at'> {
  const away: [Edge, number][] = [['left', x], ['right', width - x], ['top', y], ['bottom', height - y]];
  const [edge] = away.reduce((best, one) => (one[1] < best[1] ? one : best));
  const share = edge === 'left' || edge === 'right' ? y / height : x / width;
  return { edge, at: Math.min(0.95, Math.max(0.05, share)) };
}

/** Where each browser keeps the pucks a person laid out; a host never sees them. */
export const PUCKS_KEY = hostKey('ahpd-web.bot-pucks');

const EDGES: readonly Edge[] = ['left', 'right', 'top', 'bottom'];

function isPuck(value: unknown): value is Puck {
  const held = value as Partial<Puck> | null;
  return typeof held === 'object' && held !== null && typeof held.id === 'string' && EDGES.includes(held.edge as Edge)
    && typeof held.at === 'number' && Array.isArray(held.bots) && held.bots.every((bot) => typeof bot === 'string');
}

export function readPucks(): Puck[] {
  try {
    const held: unknown = JSON.parse(localStorage.getItem(PUCKS_KEY) ?? '[]');
    return Array.isArray(held) ? held.filter(isPuck) : [];
  } catch {
    return [];
  }
}

export function writePucks(pucks: readonly Puck[]): void {
  try {
    localStorage.setItem(PUCKS_KEY, JSON.stringify(pucks));
  } catch {
    // Not kept, which only means the next visit rests every bot on the right edge.
  }
}
