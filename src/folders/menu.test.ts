import { expect, test } from 'vitest';
import { base64Of, bytesOf, copyNameOf, entryActions, folderUriOf, leafOf, nameProblem, parentOf, siblingUri } from './menu.js';
import { withFolder, withoutFolder } from './added.js';

test('a folder offers to add, then to read and change, Delete last', () => {
  expect(entryActions({ uri: 'file:///src/a', directory: true, added: false, root: false })).toEqual(['newFile', 'newFolder', 'upload', 'copyPath', 'rename', 'copy', 'delete']);
});

test('a file offers Download and nothing that adds', () => {
  expect(entryActions({ uri: 'file:///src/a.ts', directory: false, added: false, root: false })).toEqual(['copyPath', 'download', 'rename', 'copy', 'delete']);
});

test('an added root offers Remove folder, and no root offers Rename, Copy or Delete', () => {
  expect(entryActions({ uri: 'file:///opt/x', directory: true, added: true, root: true })).toEqual(['newFile', 'newFolder', 'upload', 'copyPath', 'removeFolder']);
  expect(entryActions({ uri: 'file:///w', directory: true, added: false, root: true })).toEqual(['newFile', 'newFolder', 'upload', 'copyPath']);
});

test('a row that is no file or folder offers nothing', () => {
  expect(entryActions(null)).toEqual([]);
  expect(entryActions(undefined)).toEqual([]);
});

test('a URI splits into its folder and its decoded name', () => {
  expect(leafOf('file:///src/my%20file.ts')).toBe('my file.ts');
  expect(leafOf('file:///src/a/')).toBe('a');
  expect(parentOf('file:///src/a/b.ts')).toBe('file:///src/a');
  expect(parentOf('file:///etc')).toBe('file:///');
  expect(siblingUri('file:///src/a.ts', ' b c.ts ')).toBe('file:///src/b%20c.ts');
});

test('a name is one segment that is not a dot', () => {
  expect(nameProblem('a.ts')).toBeNull();
  expect(nameProblem('  ')).toBe('Give a name.');
  expect(nameProblem('a/b')).toBe('A name has no slash.');
  expect(nameProblem('a\\b')).toBe('A name has no slash.');
  expect(nameProblem('..')).toBe('Give a name other than a dot.');
});

test('a copy keeps its extension', () => {
  expect(copyNameOf('a.test.ts')).toBe('a.test copy.ts');
  expect(copyNameOf('Makefile')).toBe('Makefile copy');
  expect(copyNameOf('.env')).toBe('.env copy');
});

test('a path or a URI names a folder, and anything else does not', () => {
  expect(folderUriOf(' /home/me/my src/ ')).toBe('file:///home/me/my%20src');
  expect(folderUriOf('file:///opt/x/')).toBe('file:///opt/x');
  expect(folderUriOf('/')).toBe('file:///');
  expect(folderUriOf('src')).toBeNull();
  expect(folderUriOf('')).toBeNull();
});

test('bytes go to base64 and back', () => {
  const bytes = new Uint8Array(70_000).map((_, at) => at % 256);
  expect(Array.from(bytesOf(base64Of(bytes)))).toEqual(Array.from(bytes));
  expect(base64Of(new TextEncoder().encode('hi'))).toBe('aGk=');
});

test('an added folder is kept once, and removed by any spelling', () => {
  expect(withFolder(['file:///a'], 'file:///a/')).toEqual(['file:///a']);
  expect(withFolder(['file:///a'], 'file:///b/')).toEqual(['file:///a', 'file:///b']);
  expect(withoutFolder(['file:///a', 'file:///b'], 'file:///a/')).toEqual(['file:///b']);
});
