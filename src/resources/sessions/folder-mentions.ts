import type { DirectoryEntry, MessageAttachment } from '@microsoft/agent-host-protocol';
import { hostBridge, ROOT } from '../../bridges/data.js';
import { folderLabel, folderUri } from '../../bridges/words.js';
import { childUri, orderEntries } from '../folders/roots.js';
import { resourceAttachment, withToken } from './attachments.js';

/** How many entries `@` lists at once. */
const MAX_MENTIONS = 50;

/**
 * One entry `@` offers. A folder is walked into: its `insert` ends in `/` and
 * keeps the list open. A file is taken: `insert` is its full path, and
 * `attachment` goes with the message.
 */
export interface FolderMention {
  title: string;
  insert: string;
  folder: boolean;
  attachment?: MessageAttachment;
}

/** What follows the `@` at the caret, or null when the caret is not in an `@` word. */
export function mentionQuery(text: string, caret: number): string | null {
  return /(?:^|\s)@([^\s@]*)$/.exec(text.slice(0, caret))?.[1] ?? null;
}

/** Whether a typed path names a folder from the root, as `/home/me` or `C:/work`. */
const isAbsolute = (path: string): boolean => path.startsWith('/') || /^[A-Za-z]:\//.test(path);

/**
 * What `@` offers before a session exists, when there is no chat to ask: the
 * entries of a folder on the host, folders first, that start with what was
 * typed, as ahpapp's `@` walks them. The typed path is relative to the
 * session's folder, or absolute; `src/ma` lists `src`'s entries that start
 * with `ma`. A file is cited by its full path, so two `README.md` in different
 * folders stay apart.
 */
export async function folderMentions(host: string, folder: string, query: string): Promise<FolderMention[]> {
  const typed = query.replace(/\\/g, '/');
  const cut = typed.lastIndexOf('/');
  const under = typed.slice(0, cut + 1);
  const start = typed.slice(cut + 1).toLowerCase();
  const base = isAbsolute(under) ? folderUri(under) : under.split('/').filter((part) => part !== '').reduce(childUri, folder);
  const basePath = folderLabel(base).replace(/\/+$/, '');
  const found = (await hostBridge(host).request('resourceList', { channel: ROOT, uri: base } as never)) as { entries: DirectoryEntry[] };
  return orderEntries(found.entries)
    .filter((entry) => entry.name.toLowerCase().startsWith(start))
    .slice(0, MAX_MENTIONS)
    .map((entry) => {
      const path = `${basePath}/${entry.name}`;
      if (entry.type === 'directory') return { title: `${entry.name}/`, insert: `@${path}/`, folder: true };
      const insert = `@${path}`;
      return { title: entry.name, insert, folder: false, attachment: withToken(resourceAttachment(childUri(base, entry.name), false), insert) };
    });
}
