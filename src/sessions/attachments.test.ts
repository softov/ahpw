import { describe, expect, it } from 'vitest';
import type { MessageAttachment } from '@microsoft/agent-host-protocol';
import { attachmentPath, sameAttachment, withRanges, withToken } from './attachments.js';

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
