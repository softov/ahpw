import type { DirectoryEntry, MessageAttachment } from '@microsoft/agent-host-protocol';
import { ROOT, request } from '../connection/data.js';
import { childUri, orderEntries } from '../folders/roots.js';
import { resourceAttachment, withToken } from './attachments.js';

/** How many entries `@` lists at once. */
const MAX_MENTIONS = 50;

/** One entry `@` offers: what it shows, what it writes, and what it attaches. */
export interface FolderMention {
  title: string;
  insert: string;
  attachment: MessageAttachment;
}

/** What follows the `@` at the caret, or null when the caret is not in an `@` word. */
export function mentionQuery(text: string, caret: number): string | null {
  return /(?:^|\s)@([^\s@]*)$/.exec(text.slice(0, caret))?.[1] ?? null;
}

/**
 * What `@` offers before a session exists, when there is no chat to ask: the
 * entries of the chosen folder that start with what was typed. A `/` in it goes
 * a folder down, as `src/ma` lists `src`'s entries that start with `ma`.
 */
export async function folderMentions(folder: string, query: string): Promise<FolderMention[]> {
  const cut = query.lastIndexOf('/');
  const under = query.slice(0, cut + 1);
  const start = query.slice(cut + 1).toLowerCase();
  const base = under.split('/').filter((part) => part !== '').reduce(childUri, folder);
  const found = (await request('resourceList', { channel: ROOT, uri: base } as never)) as { entries: DirectoryEntry[] };
  return orderEntries(found.entries)
    .filter((entry) => entry.name.toLowerCase().startsWith(start))
    .slice(0, MAX_MENTIONS)
    .map((entry) => {
      const directory = entry.type === 'directory';
      const path = `${under}${entry.name}${directory ? '/' : ''}`;
      const insert = `@${path}`;
      return { title: path, insert, attachment: withToken(resourceAttachment(childUri(base, entry.name), directory), insert) };
    });
}
