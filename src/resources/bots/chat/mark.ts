/**
 * A chat with a bot: a session whose `_meta` carries the bot's mark. A
 * session is a chat because of the mark, whatever its provider. The chat
 * shows only what is said: the person's messages, the bot's text and files,
 * and notices; the bot's tools and thinking stay in its own work.
 */

import type { ActiveTurn, ResponsePart, Turn } from '@microsoft/agent-host-protocol';

/** Who a chat is with, as the session's `_meta` names the bot. */
export interface BotMark {
  /** The bot's slug. */
  bot: string;
  name: string;
  /** A colour name, or `#rrggbb`. */
  color?: string;
  labels: string[];
  body: string;
  /** `direct` for one person and one bot. */
  kind: string;
}

function bag(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}
const text = (value: unknown): string | undefined => (typeof value === 'string' && value !== '' ? value : undefined);

/** The bot's mark in a session's `_meta`, or undefined for a session that is not a chat with a bot. */
export function botMarkOf(meta: unknown): BotMark | undefined {
  const held = bag(meta);
  const bot = text(held?.bot);
  if (held === null || bot === undefined) return undefined;
  const color = text(held.color);
  return {
    bot,
    name: text(held.name) ?? bot,
    ...(color === undefined ? {} : { color }),
    labels: Array.isArray(held.labels) ? held.labels.filter((one): one is string => typeof one === 'string') : [],
    body: text(held.body) ?? 'robot',
    kind: text(held.kind) ?? 'direct',
  };
}

/** A file a bot's reply carries. */
export interface ChatFile {
  uri: string;
  name: string;
  contentType?: string;
}

/** One thing the chat shows for a turn, in order. */
export type ChatItem =
  | { kind: 'said'; text: string }
  | { kind: 'reply'; texts: string[]; files: ChatFile[] }
  | { kind: 'notice'; text: string; tone: 'quiet' | 'danger' }
  | { kind: 'noReply' };

const fileName = (uri: string): string => decodeURIComponent(uri.replace(/[?#].*$/, '').replace(/\/+$/, '').split('/').pop() ?? uri) || uri;

/**
 * A turn as the chat shows it: what the person said, then the bot's text and
 * files in bubbles, broken where a notice comes between them. A turn that
 * ended with nothing for the person says so in a notice.
 */
export function chatItems(turn: Turn | ActiveTurn, live: boolean): ChatItem[] {
  const items: ChatItem[] = [];
  if (turn.message.text !== '') items.push({ kind: 'said', text: turn.message.text });
  let reply: Extract<ChatItem, { kind: 'reply' }> | null = null;
  const replyNow = (): Extract<ChatItem, { kind: 'reply' }> => {
    if (reply === null) {
      reply = { kind: 'reply', texts: [], files: [] };
      items.push(reply);
    }
    return reply;
  };
  for (const part of turn.responseParts as readonly ResponsePart[]) {
    switch (String(part.kind)) {
      case 'markdown': {
        const content = 'content' in part && typeof part.content === 'string' ? part.content : '';
        if (content.trim() !== '') replyNow().texts.push(content);
        break;
      }
      case 'contentRef': {
        const uri = 'uri' in part ? String(part.uri) : '';
        if (uri !== '') replyNow().files.push({ uri, name: fileName(uri), ...('contentType' in part && typeof part.contentType === 'string' ? { contentType: part.contentType } : {}) });
        break;
      }
      case 'systemNotification': {
        const content = 'content' in part ? part.content : '';
        const said = typeof content === 'string' ? content : bag(content)?.markdown;
        if (typeof said === 'string' && said !== '') items.push({ kind: 'notice', text: said, tone: 'quiet' });
        reply = null;
        break;
      }
      case 'error': {
        const message = 'error' in part ? part.error.message : '';
        if (message !== '') items.push({ kind: 'notice', text: message, tone: 'danger' });
        reply = null;
        break;
      }
      default:
        // Tools, thinking and questions are the bot's own work, not the chat.
        break;
    }
  }
  if (!live && !items.some((item) => item.kind === 'reply' || item.kind === 'notice')) items.push({ kind: 'noReply' });
  return items;
}
