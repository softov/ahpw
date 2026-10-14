import { describe, expect, it } from 'vitest';
import type { MessageAttachment } from '@microsoft/agent-host-protocol';
import { attachmentPath, byteWords, clipboardImage, embeddedAttachment, hasPreview, MAX_EMBEDDED_BYTES, previewOf, resourceAttachment, sameAttachment, withRanges, withToken } from './attachments.js';

const file = (path: string): MessageAttachment => ({ type: 'resource', label: path.split('/').pop(), uri: `file://${path}` } as MessageAttachment);

describe('attachmentPath', () => {
  it('reads a file under the workspace from the workspace', () => {
    expect(attachmentPath(file('/home/me/repo/docs/README.md'), 'file:///home/me/repo/')).toBe('docs/README.md');
  });

  it('keeps the whole path of a file outside it', () => {
    expect(attachmentPath(file('/etc/hosts'), 'file:///home/me/repo')).toBe('/etc/hosts');
  });
});

describe('withRanges', () => {
  it('sets the range where the token stands and takes the token off', () => {
    const picked = withToken(file('/r/a.md'), '@a.md');
    const [sent] = withRanges('look\nat @a.md now', [picked]);
    expect(sent).toEqual({ type: 'resource', label: 'a.md', uri: 'file:///r/a.md', range: { start: { line: 1, character: 3 }, end: { line: 1, character: 8 } } });
  });

  it('keeps an attachment whose token was deleted, without a range', () => {
    const [sent] = withRanges('nothing here', [withToken(file('/r/a.md'), '@a.md')]);
    expect(sent).not.toHaveProperty('range');
    expect(sent).not.toHaveProperty('_meta');
  });
});

describe('sameAttachment', () => {
  it('matches a resource by its uri', () => {
    expect(sameAttachment(withToken(file('/r/a.md'), '@a.md'), file('/r/a.md'))).toBe(true);
    expect(sameAttachment(file('/r/a.md'), file('/s/a.md'))).toBe(false);
  });
});

describe('clipboardImage', () => {
  const item = (type: string, size: number): ClipboardItem => ({
    types: [type],
    getType: async () => new Blob([new Uint8Array(size)], { type }),
  } as unknown as ClipboardItem);

  it('says why when the page cannot read the clipboard', async () => {
    expect(await clipboardImage(undefined)).toBe('Needs https or localhost');
  });

  it('says the browser refused when reading throws', async () => {
    expect(await clipboardImage({ read: () => Promise.reject(new Error('denied')) })).toBe('The browser refused');
  });

  it('says there is no image when the clipboard holds text', async () => {
    expect(await clipboardImage({ read: async () => [item('text/plain', 4)] })).toBe('No image on the clipboard');
  });

  it('refuses an image over 5 MB', async () => {
    expect(await clipboardImage({ read: async () => [item('image/png', MAX_EMBEDDED_BYTES + 1)] })).toBe('Over 5 MB');
  });

  it('gives a small image as a file named by its type', async () => {
    const got = await clipboardImage({ read: async () => [item('text/plain', 4), item('image/png', 8)] });
    expect(got).toBeInstanceOf(File);
    expect((got as File).name).toBe('clipboard.png');
    expect((got as File).type).toBe('image/png');
  });
});

describe('previewOf', () => {
  it('shows an image as itself, with its type and size', () => {
    const got = previewOf(embeddedAttachment('shot.png', btoa('\x89PNG'), 'image/png'));
    expect(got).toEqual({ label: 'shot.png', meta: 'image/png · 4 B', image: `data:image/png;base64,${btoa('\x89PNG')}` });
  });

  it('shows text as text, decoded as UTF-8', () => {
    const data = btoa(String.fromCharCode(...new TextEncoder().encode('olá')));
    expect(previewOf(embeddedAttachment('a.md', data, 'text/markdown'))?.text).toBe('olá');
    expect(previewOf(embeddedAttachment('a.json', btoa('{}'), 'application/json'))?.text).toBe('{}');
  });

  it('gives anything else its type and size alone, and nothing for a host file', () => {
    expect(previewOf(embeddedAttachment('a.zip', btoa('zip'), 'application/zip'))).toEqual({ label: 'a.zip', meta: 'application/zip · 3 B' });
    const file = resourceAttachment('file:///w/a.ts', false);
    expect(hasPreview(file)).toBe(false);
    expect(previewOf(file)).toBeNull();
  });
});

describe('byteWords', () => {
  it('reads bytes, kilobytes and megabytes', () => {
    expect(byteWords(512)).toBe('512 B');
    expect(byteWords(12_600)).toBe('12.3 KB');
    expect(byteWords(1_300_000)).toBe('1.2 MB');
  });
});
