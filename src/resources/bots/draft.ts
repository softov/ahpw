/** What the bot form holds, and what a write sends from it. */

import type { BotBody, BotRecord } from './catalogue.js';
import { BOT_BODIES, COLOR_HEX, colorName, colorOf } from './look.js';

export interface BotDraft {
  name: string;
  /** One line, comma separated. */
  labels: string;
  description: string;
  instructions: string;
  body: string;
  /** A hex, as the swatches draw it. */
  color: string;
  /** Empty for the maker, the host's default. */
  owner: string;
}

/** Labels from one comma separated line: trimmed, blank and repeated ones left out. */
export function parseLabels(line: string): string[] {
  return [...new Set(line.split(',').map((one) => one.trim()).filter((one) => one !== ''))];
}

/**
 * A look for a new bot: a random body, and the colour the fewest bots on the
 * host have, so a new one stands out among them.
 */
export function freshLook(bots: readonly BotRecord[], random = Math.random): { body: string; color: string } {
  const used = new Map<string, number>(Object.values(COLOR_HEX).map((hex) => [hex, 0]));
  for (const bot of bots) {
    const hex = colorOf(bot.color);
    if (used.has(hex)) used.set(hex, used.get(hex)! + 1);
  }
  const least = Math.min(...used.values());
  const color = [...used].find(([, count]) => count === least)![0];
  return { body: BOT_BODIES[Math.floor(random() * BOT_BODIES.length)]!, color };
}

/** The form's start: the bot as it is, or a fresh one. */
export function draftOf(bot: BotRecord | undefined, bots: readonly BotRecord[]): BotDraft {
  if (bot !== undefined) {
    return {
      name: bot.name,
      labels: bot.labels.join(', '),
      description: bot.description ?? '',
      instructions: bot.instructions ?? '',
      body: bot.body,
      color: colorOf(bot.color),
      owner: bot.owner,
    };
  }
  return { name: '', labels: '', description: '', instructions: '', owner: '', ...freshLook(bots) };
}

/**
 * What a write sends. The owner goes only on a new bot, since a host keeps it.
 * A blank description or instructions on an edit is sent blank, which a host
 * reads as absent.
 */
export function recordBody(draft: BotDraft, fresh: boolean): BotBody {
  const description = draft.description.trim();
  const instructions = draft.instructions.trim();
  return {
    name: draft.name.trim(),
    labels: parseLabels(draft.labels),
    body: draft.body.trim(),
    color: colorName(draft.color),
    ...(fresh ? (description === '' ? {} : { description }) : { description }),
    ...(fresh ? (instructions === '' ? {} : { instructions }) : { instructions }),
    ...(fresh && draft.owner !== '' ? { owner: draft.owner } : {}),
  };
}
