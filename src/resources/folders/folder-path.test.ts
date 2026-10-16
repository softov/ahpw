import { beforeEach, describe, expect, it, vi } from 'vitest';

const request = vi.fn();
vi.mock('../../bridges/data.js', () => ({ ROOT: 'ahp-root:/', request }));

const { childFolders, expandHome, parentPath, splitPath } = await import('./folder-path.js');

beforeEach(() => {
  request.mockReset();
});

describe('splitPath', () => {
  it('splits at the last slash', () => {
    expect(splitPath('/home/me/sr')).toEqual({ dir: '/home/me/', part: 'sr' });
    expect(splitPath('/home/me/')).toEqual({ dir: '/home/me/', part: '' });
    expect(splitPath('C:\\Users\\me')).toEqual({ dir: 'C:/Users/', part: 'me' });
    expect(splitPath('home')).toEqual({ dir: '', part: 'home' });
  });
});

describe('expandHome', () => {
  it('reads ~ as the home folder', () => {
    expect(expandHome('~', '/home/me')).toBe('/home/me/');
    expect(expandHome('~/src', '/home/me')).toBe('/home/me/src');
    expect(expandHome('/tmp/~', '/home/me')).toBe('/tmp/~');
    expect(expandHome('~', null)).toBe('~');
  });
});

describe('parentPath', () => {
  it('goes one folder up, and stops at a root', () => {
    expect(parentPath('/home/me/')).toBe('/home/');
    expect(parentPath('/home/')).toBe('/');
    expect(parentPath('/')).toBeNull();
    expect(parentPath('C:/Users/')).toBe('C:/');
    expect(parentPath('C:/')).toBeNull();
  });
});

describe('childFolders', () => {
  it("lists the folder's folders by name", async () => {
    request.mockResolvedValue({ entries: [{ name: 'src', type: 'directory' }, { name: 'a.txt', type: 'file' }, { name: 'Apps', type: 'directory' }] });
    expect(await childFolders('C:/work/')).toEqual(['Apps', 'src']);
    expect(request).toHaveBeenCalledWith('resourceList', { channel: 'ahp-root:/', uri: 'file:///C:/work/' });
  });
});
