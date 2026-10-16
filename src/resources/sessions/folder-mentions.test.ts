import { beforeEach, describe, expect, it, vi } from 'vitest';

const request = vi.fn();
vi.mock('../../bridges/data.js', () => ({ ROOT: 'ahp-root:/', hostBridge: () => ({ request }) }));

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
  it("lists the folder's entries that start with what was typed, folders first, files by full path", async () => {
    request.mockResolvedValue({ entries: [{ name: 'main.ts', type: 'file' }, { name: 'Maps', type: 'directory' }, { name: 'other.ts', type: 'file' }] });
    const found = await folderMentions('daemon', 'file:///work', 'ma');
    expect(request).toHaveBeenCalledWith('resourceList', { channel: 'ahp-root:/', uri: 'file:///work' });
    expect(found.map((one) => one.title)).toEqual(['Maps/', 'main.ts']);
    expect(found[0]).toMatchObject({ insert: '@/work/Maps/', folder: true });
    expect(found[1]).toMatchObject({ insert: '@/work/main.ts', folder: false });
    expect(found[1]?.attachment).toMatchObject({ type: 'resource', uri: 'file:///work/main.ts', displayKind: 'document', _meta: { token: '@/work/main.ts' } });
  });

  it('goes a folder down for each / typed', async () => {
    request.mockResolvedValue({ entries: [{ name: 'index.ts', type: 'file' }] });
    const found = await folderMentions('daemon', 'file:///work', 'src/in');
    expect(request).toHaveBeenCalledWith('resourceList', { channel: 'ahp-root:/', uri: 'file:///work/src' });
    expect(found[0]).toMatchObject({ title: 'index.ts', insert: '@/work/src/index.ts' });
  });

  it('reads a path from the root as it is, as the inserted text is', async () => {
    request.mockResolvedValue({ entries: [{ name: 'logo.svg', type: 'file' }] });
    await folderMentions('daemon', 'file:///work', '/github/app/lo');
    expect(request).toHaveBeenCalledWith('resourceList', { channel: 'ahp-root:/', uri: 'file:///github/app/' });
    await folderMentions('daemon', 'file:///C:/work', 'C:/Users/me/');
    expect(request).toHaveBeenLastCalledWith('resourceList', { channel: 'ahp-root:/', uri: 'file:///C:/Users/me/' });
  });

  it('cites a Windows file by its drive path', async () => {
    request.mockResolvedValue({ entries: [{ name: 'a.md', type: 'file' }] });
    const [one] = await folderMentions('daemon', 'file:///C:/work', '');
    expect(one?.insert).toBe('@C:/work/a.md');
  });
});
