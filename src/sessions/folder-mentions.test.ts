import { beforeEach, describe, expect, it, vi } from 'vitest';

const request = vi.fn();
vi.mock('../connection/data.js', () => ({ ROOT: 'ahp-root:/', request }));

const { folderMentions, mentionQuery } = await import('./folder-mentions.js');

beforeEach(() => {
  request.mockReset();
});

describe('mentionQuery', () => {
  it('reads the @ word the caret is in', () => {
    expect(mentionQuery('look at @src/ma', 15)).toBe('src/ma');
    expect(mentionQuery('@', 1)).toBe('');
  });

  it('is null outside an @ word', () => {
    expect(mentionQuery('look at src', 11)).toBeNull();
    expect(mentionQuery('mail@host', 9)).toBeNull();
    expect(mentionQuery('@src done', 9)).toBeNull();
  });
});

describe('folderMentions', () => {
  it("lists the folder's entries that start with what was typed, folders first", async () => {
    request.mockResolvedValue({ entries: [{ name: 'main.ts', type: 'file' }, { name: 'Maps', type: 'directory' }, { name: 'other.ts', type: 'file' }] });
    const found = await folderMentions('file:///work', 'ma');
    expect(request).toHaveBeenCalledWith('resourceList', { channel: 'ahp-root:/', uri: 'file:///work' });
    expect(found.map((one) => one.title)).toEqual(['Maps/', 'main.ts']);
    expect(found[1]?.insert).toBe('@main.ts');
    expect(found[1]?.attachment).toMatchObject({ type: 'resource', uri: 'file:///work/main.ts', displayKind: 'document', _meta: { token: '@main.ts' } });
  });

  it('goes a folder down for each / typed', async () => {
    request.mockResolvedValue({ entries: [{ name: 'index.ts', type: 'file' }] });
    const found = await folderMentions('file:///work', 'src/in');
    expect(request).toHaveBeenCalledWith('resourceList', { channel: 'ahp-root:/', uri: 'file:///work/src' });
    expect(found[0]).toMatchObject({ title: 'src/index.ts', insert: '@src/index.ts' });
  });
});
