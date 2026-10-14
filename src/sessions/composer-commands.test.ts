import { describe, expect, it } from 'vitest';
import type { MessageAttachment } from '@microsoft/agent-host-protocol';
import type { PickerAction } from '@softov/scena/types';
import { contextItems, showsPill, typeTrigger, valueWords, type ChangedFile, type ComposerApi } from './composer-commands.js';

describe('valueWords', () => {
  it('reads plain values, lists and objects', () => {
    expect(valueWords(undefined)).toBe('default');
    expect(valueWords('ask')).toBe('ask');
    expect(valueWords([])).toBe('none');
    expect(valueWords(['Read', 'Edit'])).toBe('Read, Edit');
    expect(valueWords(['a', 'b', 'c'])).toBe('3 items');
    expect(valueWords({ allow: ['Bash', 'Read', 'Edit'], deny: [] })).toBe('allow 3 items');
    expect(valueWords({})).toBe('none');
  });
});

describe('showsPill', () => {
  it('leaves out a setting that holds nothing and cannot be changed', () => {
    expect(showsPill({ key: 'permissions', schema: { type: 'object', title: 'Permissions' }, value: {} })).toBe(false);
    expect(showsPill({ key: 'permissions', schema: { type: 'object', title: 'Permissions' }, value: { allow: ['Read'] } })).toBe(true);
    expect(showsPill({ key: 'mode', schema: { type: 'string', title: 'Mode', enum: ['ask', 'auto'] }, value: undefined })).toBe(true);
  });
});

describe('contextItems', () => {
  const api = (changed: ChangedFile[] = []): ComposerApi => ({
    models: () => [], model: () => undefined, setModel: () => undefined, options: () => [], setOption: () => undefined,
    running: () => false, stop: () => undefined, session: () => 'claude:/one', attach: () => undefined,
    type: () => undefined, upload: () => undefined, changed: () => changed,
  });
  // Every item is a row of its own, not a command.
  const rows = (items: PickerAction[]) => items as Extract<PickerAction, { title: string }>[];
  const titles = (items: PickerAction[]) => rows(items).map((one) => one.title.replace(/^\S+\s/, ''));
  const file = (name: string): ChangedFile => ({ title: name, description: 'src', attachment: { type: 'resource', label: name, uri: `file:///r/src/${name}` } as MessageAttachment });

  it('lists the items in order, with no changed file before a session exists', () => {
    expect(titles(contextItems(api(), [], 'No image on the clipboard'))).toEqual(['Files and folders', 'Upload', 'Image from clipboard', 'Sessions', 'Commands']);
  });

  it('greys the clipboard row with the reason, and enables it for an image', () => {
    const greyed = rows(contextItems(api(), [], 'The browser refused'))[2]!;
    expect(greyed.disabled).toBe(true);
    expect(greyed.description).toBe('The browser refused');
    const image = rows(contextItems(api(), [], new File([new Uint8Array(4)], 'clipboard.png', { type: 'image/png' })))[2]!;
    expect(image.disabled).toBeUndefined();
  });

  it('lists the changed files after the items, in their own group', () => {
    const items = rows(contextItems(api([file('a.ts'), file('b.ts')]), [], 'No image on the clipboard'));
    expect(items.slice(5).map((one) => [one.title, one.group])).toEqual([['a.ts', 'changed'], ['b.ts', 'changed']]);
  });
});

describe('typeTrigger', () => {
  it('puts / at the start of an empty box and @ at the caret, spaced from a word', () => {
    expect(typeTrigger('', 0, '/')).toEqual({ text: '/', caret: 1 });
    expect(typeTrigger('fix', 3, '@')).toEqual({ text: 'fix @', caret: 5 });
    expect(typeTrigger('fix ', 4, '@')).toEqual({ text: 'fix @', caret: 5 });
  });

  it('replaces an @ or / already at the caret, so choosing twice leaves one', () => {
    expect(typeTrigger('@', 1, '/')).toEqual({ text: '/', caret: 1 });
    expect(typeTrigger('@', 1, '@')).toEqual({ text: '@', caret: 1 });
    expect(typeTrigger('fix @src', 8, '/')).toEqual({ text: 'fix /', caret: 5 });
  });
});
