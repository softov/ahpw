import type { MessageAttachment, TextPosition } from '@microsoft/agent-host-protocol';
import { folderLabel } from '../connection/words.js';

type Bag = Record<string, unknown>;

const bagOf = (value: unknown): Bag => (typeof value === 'object' && value !== null ? value as Bag : {});
const textOf = (value: unknown): string | undefined => (typeof value === 'string' ? value : undefined);

/** An attachment the host offered for a completion, holding the text the composer wrote for it. */
export function withToken(attachment: MessageAttachment, token: string): MessageAttachment {
  const held = bagOf(attachment);
  return { ...held, _meta: { ...bagOf(held._meta), token } } as unknown as MessageAttachment;
}

/** Whether two attachments are the same thing, so a second pick adds nothing. */
export function sameAttachment(a: MessageAttachment, b: MessageAttachment): boolean {
  const x = bagOf(a);
  const y = bagOf(b);
  if (x.type !== y.type) return false;
  if (typeof x.uri === 'string') return x.uri === y.uri;
  return x.label === y.label && x.data === y.data;
}

/** What a chip names an attachment by. */
export const attachmentLabel = (attachment: MessageAttachment): string => textOf(bagOf(attachment).label) ?? 'Attachment';

/** Where an attachment lives: its path under the workspace, or its whole path outside it. */
export function attachmentPath(attachment: MessageAttachment, workspace: string | undefined): string | undefined {
  const uri = textOf(bagOf(attachment).uri);
  if (uri === undefined) return undefined;
  const path = folderLabel(uri);
  const root = workspace === undefined ? undefined : folderLabel(workspace).replace(/\/+$/, '');
  return root !== undefined && path.startsWith(`${root}/`) ? path.slice(root.length + 1) : path;
}

/** Where an offset stands in a text: its line, zero-based, and how far into that line. */
function positionOf(text: string, offset: number): TextPosition {
  const before = text.slice(0, offset);
  const breaks = before.match(/\r\n|\r|\n/g);
  const start = Math.max(before.lastIndexOf('\n'), before.lastIndexOf('\r')) + 1;
  return { line: breaks === null ? 0 : breaks.length, character: offset - start };
}

/**
 * The attachments as they go on the wire: each one's `range` set to where its
 * token stands in the text, and the token taken off. Set at send, because every
 * edit before a token moves it. A token deleted from the text keeps the
 * attachment, without a range.
 */
export function withRanges(text: string, attachments: readonly MessageAttachment[]): MessageAttachment[] {
  return attachments.map((attachment) => {
    const held = bagOf(attachment);
    const { token, ...meta } = bagOf(held._meta);
    const { _meta: _old, ...base } = held;
    const out: Bag = { ...base };
    if (Object.keys(meta).length > 0) out._meta = meta;
    if (typeof token === 'string') {
      delete out.range;
      const start = text.indexOf(token);
      if (start >= 0) out.range = { start: positionOf(text, start), end: positionOf(text, start + token.length) };
    }
    return out as unknown as MessageAttachment;
  });
}
