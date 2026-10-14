import type { MessageAttachment, SessionSummary, TextPosition } from '@microsoft/agent-host-protocol';
import { folderLabel } from '../connection/words.js';
import { EMOJIcon } from '../emojis.js';

type Bag = Record<string, unknown>;

const bagOf = (value: unknown): Bag => (typeof value === 'object' && value !== null ? value as Bag : {});
const textOf = (value: unknown): string | undefined => (typeof value === 'string' ? value : undefined);

/** The largest file the composer embeds in a message, before base64. */
export const MAX_EMBEDDED_BYTES = 5 * 1024 * 1024;

/** Bytes as base64, a slice at a time so a large file does not overflow the call stack. */
export function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let at = 0; at < bytes.length; at += 0x8000) binary += String.fromCharCode(...bytes.subarray(at, at + 0x8000));
  return btoa(binary);
}

/** Content carried inside the message, base64 with its type. */
export function embeddedAttachment(label: string, data: string, contentType: string): MessageAttachment {
  return { type: 'embeddedResource', label, data, contentType, displayKind: contentType.startsWith('image/') ? 'image' : 'document' } as MessageAttachment;
}

/** A file or folder on the host, which the agent reads itself. */
export function resourceAttachment(uri: string, directory: boolean): MessageAttachment {
  const path = folderLabel(uri).replace(/\/+$/, '');
  return { type: 'resource', label: path.slice(path.lastIndexOf('/') + 1) || path, uri, displayKind: directory ? 'directory' : 'document' } as MessageAttachment;
}

/** Another session's chat, which the host reads up to its last finished turn. */
export function chatAttachment(session: SessionSummary): MessageAttachment {
  return { type: 'chat', label: session.title === '' ? 'Untitled' : session.title, resource: session.defaultChat } as MessageAttachment;
}

/** What the browser's files gave: the attachments made, and the names left out as too big or unreadable. */
export async function fromFiles(files: readonly File[]): Promise<{ attached: MessageAttachment[]; refused: string[] }> {
  const attached: MessageAttachment[] = [];
  const refused: string[] = [];
  for (const file of files) {
    if (file.size > MAX_EMBEDDED_BYTES) {
      refused.push(file.name);
      continue;
    }
    try {
      attached.push(embeddedAttachment(file.name, bytesToBase64(new Uint8Array(await file.arrayBuffer())), file.type || 'application/octet-stream'));
    } catch {
      refused.push(file.name);
    }
  }
  return { attached, refused };
}

/**
 * The image on the clipboard, as a file to attach, or why there is none, in
 * words for the greyed Add context row. The browser may ask for leave first.
 */
export async function clipboardImage(clipboard: Pick<Clipboard, 'read'> | undefined = globalThis.navigator?.clipboard): Promise<File | string> {
  if (typeof clipboard?.read !== 'function') return 'Needs https or localhost';
  let items: ClipboardItems;
  try {
    items = await clipboard.read();
  } catch {
    return 'The browser refused';
  }
  for (const item of items) {
    const type = item.types.find((one) => one.startsWith('image/'));
    if (type === undefined) continue;
    const blob = await item.getType(type);
    if (blob.size > MAX_EMBEDDED_BYTES) return 'Over 5 MB';
    return new File([blob], `clipboard.${type.slice('image/'.length).split('+')[0]}`, { type });
  }
  return 'No image on the clipboard';
}

/** The glyph a chip shows for an attachment. */
export function attachmentIcon(attachment: MessageAttachment): string {
  const held = bagOf(attachment);
  if (held.type === 'chat') return EMOJIcon.sessions;
  if (held.displayKind === 'directory') return EMOJIcon.folder;
  if (held.type === 'embeddedResource') return EMOJIcon.attach;
  return EMOJIcon.file;
}

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
  if (typeof x.resource === 'string') return x.resource === y.resource;
  return x.label === y.label && x.data === y.data;
}

/** The most text a preview draws, so a large file does not stall the page. */
const PREVIEW_TEXT_MAX = 200_000;

/** What a preview shows of an attachment the message carries: the image, the text, or its type and size alone. */
export interface AttachmentPreviewOf {
  label: string;
  meta: string;
  image?: string;
  text?: string;
}

/** A size as people read it: 512 B, 12.3 KB, 1.2 MB. */
export function byteWords(count: number): string {
  if (count < 1024) return `${count} B`;
  if (count < 1024 * 1024) return `${(count / 1024).toFixed(1)} KB`;
  return `${(count / 1024 / 1024).toFixed(1)} MB`;
}

/** Whether the message carries the attachment's bytes, so a preview can show them; cheap, for every render. */
export function hasPreview(attachment: MessageAttachment): boolean {
  const held = bagOf(attachment);
  return held.type === 'embeddedResource' && typeof held.data === 'string';
}

/**
 * The preview of an attachment carried inside the message, as ahpapp shows it;
 * nothing for a host file, a folder or a chat, whose bytes the page does not hold.
 */
export function previewOf(attachment: MessageAttachment): AttachmentPreviewOf | null {
  const held = bagOf(attachment);
  const data = textOf(held.data);
  if (!hasPreview(attachment) || data === undefined) return null;
  const contentType = textOf(held.contentType) ?? 'application/octet-stream';
  const binary = atob(data);
  const preview = { label: attachmentLabel(attachment), meta: `${contentType} · ${byteWords(binary.length)}` };
  if (contentType.startsWith('image/')) return { ...preview, image: `data:${contentType};base64,${data}` };
  if (contentType.startsWith('text/') || /\b(json|xml|javascript|typescript|yaml|x-sh)\b/.test(contentType)) {
    const bytes = Uint8Array.from(binary.slice(0, PREVIEW_TEXT_MAX * 4), (one) => one.charCodeAt(0));
    return { ...preview, text: new TextDecoder().decode(bytes).slice(0, PREVIEW_TEXT_MAX) };
  }
  return preview;
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
