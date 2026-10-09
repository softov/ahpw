import { expect, test } from 'vitest';
import type { SessionSummary } from '@microsoft/agent-host-protocol';
import { chainTo, childUri, orderEntries, rootsOf } from './roots.js';
import { HOST_FILE_TYPE, droppedHostFile } from './drag.js';

const session = (folder?: string): SessionSummary => ({ workingDirectories: folder === undefined ? undefined : [folder] }) as SessionSummary;

test('the default folder comes first, then each session folder once', () => {
  const roots = rootsOf('file:///home/me', [session('file:///src/a/'), session(), session('file:///src/b'), session('file:///src/a'), session('file:///home/me/')]);
  expect(roots).toEqual([
    { uri: 'file:///home/me', isDefault: true },
    { uri: 'file:///src/a', isDefault: false },
    { uri: 'file:///src/b', isDefault: false },
  ]);
});

test('without a default folder, the session folders alone', () => {
  expect(rootsOf(null, [session('file:///src/a')])).toEqual([{ uri: 'file:///src/a', isDefault: false }]);
  expect(rootsOf(undefined, [])).toEqual([]);
});

test('a child URI encodes its name', () => {
  expect(childUri('file:///src/a/', 'my file.ts')).toBe('file:///src/a/my%20file.ts');
  expect(childUri('file:///', 'etc')).toBe('file:///etc');
});

test('folders come before files, each in the host order', () => {
  const entries = [{ name: 'b.ts', type: 'file' }, { name: 'z', type: 'directory' }, { name: 'a.ts', type: 'file' }, { name: 'c', type: 'directory' }] as const;
  expect(orderEntries([...entries]).map((one) => one.name)).toEqual(['z', 'c', 'b.ts', 'a.ts']);
});

test('a drop gives its host file, and anything else gives null', () => {
  const data = (held: string): DataTransfer => ({ getData: (type: string) => (type === HOST_FILE_TYPE ? held : '') }) as DataTransfer;
  expect(droppedHostFile(data(JSON.stringify({ uri: 'file:///a', directory: false })))).toEqual({ uri: 'file:///a', directory: false });
  expect(droppedHostFile(data(''))).toBeNull();
  expect(droppedHostFile(data(JSON.stringify({ uri: 1 })))).toBeNull();
});

test('a revealed folder opens from the deepest root that holds it', () => {
  expect(chainTo(['file:///github', 'file:///github/textui'], 'file:///github/textui/packages/my%20core')).toEqual([
    'file:///github/textui',
    'file:///github/textui/packages',
    'file:///github/textui/packages/my%20core',
  ]);
  expect(chainTo(['file:///github/textui/'], 'file:///github/textui')).toEqual(['file:///github/textui/']);
});

test('a folder outside every root becomes its own', () => {
  expect(chainTo(['file:///github/textui'], 'file:///github/text')).toEqual(['file:///github/text']);
  expect(chainTo([], 'file:///tmp/a b')).toEqual(['file:///tmp/a%20b']);
});
