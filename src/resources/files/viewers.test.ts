import { describe, expect, it, vi } from 'vitest';
import { createScena } from '@softov/scena/core';
import type { HostCtx, ResolvedMount } from '@softov/scena/types';
import { registerFiles } from './index.js';
import { extOf, fileTabOf, openAsItems, viewersOf } from './viewers.js';

const setup = () => {
  const scena = createScena();
  registerFiles(scena);
  return scena;
};

describe('file viewers', () => {
  it('reads the extension, lower case', () => {
    expect(extOf('file:///w/README.MD')).toBe('md');
    expect(extOf('file:///w/.env')).toBe('');
    expect(extOf('file:///w/a.tar.gz#L3')).toBe('gz');
  });

  it('offers markdown first for a .md file and text alone for others', () => {
    const scena = setup();
    expect(viewersOf(scena, 'file:///w/a.md').map((one) => one.component)).toEqual(['MarkdownPage', 'FilePage']);
    expect(viewersOf(scena, 'file:///w/a.ts').map((one) => one.component)).toEqual(['FilePage']);
  });

  it('offers the image, video or audio viewer first for a media file, and text after it', () => {
    const scena = setup();
    expect(viewersOf(scena, 'file:///w/logo.PNG').map((one) => one.component)).toEqual(['ImagePage', 'FilePage']);
    expect(viewersOf(scena, 'file:///w/logo.svg').map((one) => one.component)).toEqual(['ImagePage', 'FilePage']);
    expect(viewersOf(scena, 'file:///w/clip.webm').map((one) => one.component)).toEqual(['VideoPage', 'FilePage']);
    expect(viewersOf(scena, 'file:///w/note.mp3').map((one) => one.component)).toEqual(['AudioPage', 'FilePage']);
  });

  it('offers the viewers a tab is not showing, and opens the one picked', async () => {
    const scena = setup();
    const items = openAsItems(scena, 'daemon', 'file:///w/a.md', 'MarkdownPage');
    expect(items.map((one) => 'title' in one && one.title)).toEqual(['Open as Text']);
    const open = vi.spyOn(scena.surfaces, 'open');
    const item = items[0]!;
    if ('onSelect' in item) await item.onSelect({ closeMenu: () => undefined } as unknown as HostCtx);
    await vi.waitFor(() => expect(open).toHaveBeenCalledWith(expect.objectContaining({ key: 'file:daemon:FilePage:file:///w/a.md' })));
  });

  it('opens a .md link with lines as text, and without lines as markdown', async () => {
    const scena = setup();
    const open = vi.spyOn(scena.surfaces, 'open');
    await scena.commands.execute('ahp.openFile', { uri: 'file:///w/a.md', line: 4 });
    await scena.commands.execute('ahp.openFile', { uri: 'file:///w/a.md' });
    expect(open.mock.calls.map(([decl]) => (decl.resource as { component: string }).component)).toEqual(['FilePage', 'MarkdownPage']);
  });

  it('adds the other viewers to a file tab menu and nothing to other tabs', () => {
    const scena = setup();
    const mount = (component: Record<string, unknown>) => ({ key: 'k', surface: 'main', component, policy: {}, openedAt: 0 }) as unknown as ResolvedMount;
    const titles = (component: Record<string, unknown>) => scena.mountMenus.collect('tab:context', mount(component)).map((one) => 'title' in one && one.title);
    expect(titles({ component: 'FilePage', host: 'daemon', uri: 'file:///w/a.md' })).toEqual(['Open as Markdown']);
    expect(titles({ component: 'FilePage', host: 'daemon', uri: 'file:///w/a.ts' })).toEqual([]);
    expect(titles({ component: 'DiffPage', file: 'file:///w/a.md' })).toEqual([]);
  });

  it('reads the host, the viewer and the file from a file tab key', () => {
    expect(fileTabOf('file:daemon:MarkdownPage:file:///w/a.md')).toEqual({ host: 'daemon', component: 'MarkdownPage', uri: 'file:///w/a.md' });
    expect(fileTabOf('terminal:x')).toBeUndefined();
    expect(fileTabOf(undefined)).toBeUndefined();
  });

  it('puts a text or Markdown switch on the strip of a .md tab in main only', () => {
    const scena = setup();
    const buttons = (key: string, surface = 'main') => scena.commands.list({ slot: 'surface/title' })
      .filter((cmd) => cmd.when === undefined || scena.when.evaluate(cmd.when, { '$/surface/name': surface, '$/tab/key': key }))
      .map((cmd) => cmd.id);
    expect(buttons('file:daemon:MarkdownPage:file:///w/a.md')).toEqual(['ahp.showFileText']);
    expect(buttons('file:daemon:FilePage:file:///w/a.md')).toEqual(['ahp.showFileMarkdown']);
    expect(buttons('file:daemon:FilePage:file:///w/a.ts')).toEqual([]);
    expect(buttons('file:daemon:FilePage:file:///w/a.md', 'panel:bottom')).toEqual([]);
  });

  it('replaces the tab with the other viewer of the same file', async () => {
    const scena = setup();
    const open = vi.spyOn(scena.surfaces, 'open');
    const close = vi.spyOn(scena.surfaces, 'close');
    scena.store.set('$/tab/key', 'file:daemon:MarkdownPage:file:///w/a.md');
    await scena.commands.execute('ahp.showFileText');
    expect(close).toHaveBeenCalledWith('file:daemon:MarkdownPage:file:///w/a.md');
    await vi.waitFor(() => expect(open).toHaveBeenCalledWith(expect.objectContaining({ key: 'file:daemon:FilePage:file:///w/a.md' })));
  });
});
