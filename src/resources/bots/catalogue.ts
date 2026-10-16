/**
 * A host's bots, as ahpd's bot plugin serves them: the catalogue channel that
 * lists them, and the resource writes that make, edit and delete one. The
 * record is written here rather than imported: `@ahpd/bot` reads `node:fs`.
 */

import { AhpErrorCodes } from '@microsoft/agent-host-protocol';
import { hostBridge } from '../../bridges/data.js';
import type { Offers } from '../../bridges/offers.js';

export const BOTS_SCHEME = 'x-ahpd-bots';
export const BOTS = `${BOTS_SCHEME}://`;
/** The resource scheme each bot is a file of, its record as JSON. */
export const BOT_PROVIDER = 'bot';

/** A bot as a host keeps it, as `@ahpd/bot`'s `BotRecord`. */
export interface BotRecord {
  /** Its slug, which names its resource. */
  id: string;
  name: string;
  labels: string[];
  description?: string;
  body: string;
  /** A colour name, or `#rrggbb`. */
  color: string;
  instructions?: string;
  template?: string;
  harness?: string;
  model?: string;
  preset?: string;
  workspace: string;
  computer?: string;
  /** The bot's own session, on a host that does not run bot chats yet. */
  session?: string;
  /** `user:<id>`, `team:<team>`, `project:<team>:<project>` or `root:<host>`. */
  owner: string;
  createdAt: string;
  updatedAt: string;
}

export interface BotsState {
  bots: BotRecord[];
}

type BotsAction =
  | { type: `${typeof BOTS_SCHEME}/added` | `${typeof BOTS_SCHEME}/changed`; bot: BotRecord }
  | { type: `${typeof BOTS_SCHEME}/removed`; id: string };

/** Folds the catalogue's actions into its snapshot, `{ bots }`, kept in slug order as the host sends it. */
export function botsReducer(state: BotsState, action: BotsAction): BotsState {
  switch (action.type) {
    case `${BOTS_SCHEME}/added`:
    case `${BOTS_SCHEME}/changed`: {
      const others = state.bots.filter((one) => one.id !== action.bot.id);
      return { bots: [...others, action.bot].sort((a, b) => a.id.localeCompare(b.id)) };
    }
    case `${BOTS_SCHEME}/removed`:
      return { bots: state.bots.filter((one) => one.id !== action.id) };
    default:
      return state;
  }
}

/** The root of the host's bots, as its provider says; `bot://` when it does not. */
export const botsRoot = (offers: Offers): string => offers.providers[BOT_PROVIDER]?.root ?? `${BOT_PROVIDER}://`;

/** A bot's resource: its provider's root and its slug. */
export const botUri = (root: string, slug: string): string => `${root.endsWith('/') ? root : `${root}/`}${slug}`;

/** What a write sends: the fields a person sets; the host fills the rest. */
export type BotBody = Partial<Pick<BotRecord, 'name' | 'labels' | 'description' | 'body' | 'color' | 'instructions' | 'owner'>>;

const isTaken = (error: unknown): boolean => typeof error === 'object' && error !== null && (error as { code?: unknown }).code === AhpErrorCodes.AlreadyExists;

/**
 * Makes a bot under the first free slug from `slugs`: a host never gives a
 * deleted bot's slug again, so a refused one moves on to the next. Answers the slug.
 */
export async function makeBot(host: string, offers: Offers, slugs: readonly string[], body: BotBody): Promise<string> {
  const root = botsRoot(offers);
  for (const [at, slug] of slugs.entries()) {
    try {
      await hostBridge(host).writeResource(botUri(root, slug), JSON.stringify(body), 'utf-8', true);
      return slug;
    } catch (error) {
      if (!isTaken(error) || at === slugs.length - 1) throw error;
    }
  }
  throw new Error('No slug to make the bot under');
}

/** Edits a bot, refused when it changed on the host since `updatedAt`. */
export async function editBot(host: string, offers: Offers, bot: BotRecord, body: BotBody): Promise<void> {
  await hostBridge(host).writeText(botUri(botsRoot(offers), bot.id), JSON.stringify(body), bot.updatedAt);
}

/** The agent a host runs bot chats with; a host without it keeps one session per bot. */
export const BOT_CHAT_AGENT = 'bot-chat';

/** Whether a host runs bot chats, by the agents it lists. */
export const servesBotChats = (agents: readonly { provider: string }[] | undefined): boolean =>
  agents?.some((one) => one.provider === BOT_CHAT_AGENT) ?? false;

/**
 * The session a person chats with a bot in. On a host that runs bot chats, a
 * read of the bot answers `chat`, the reader's own chat, which the first read
 * starts. On one that does not yet, it is the bot's own session. Null when
 * this person may not chat with the bot.
 */
export async function readBotChat(host: string, offers: Offers, bot: BotRecord, chats: boolean): Promise<string | null> {
  if (!chats) return bot.session ?? null;
  const { text } = await hostBridge(host).readText(botUri(botsRoot(offers), bot.id));
  const record = JSON.parse(text ?? '{}') as { chat?: unknown };
  return typeof record.chat === 'string' && record.chat !== '' ? record.chat : null;
}

export async function deleteBot(host: string, offers: Offers, slug: string): Promise<void> {
  await hostBridge(host).deleteResource(botUri(botsRoot(offers), slug), false);
}
