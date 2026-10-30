import { describe, expect, it } from 'vitest';
import { createScena } from '@softov/scena/core';
import type { TabPanelNode } from '@softov/scena/types';
import { ACTIVE_SESSION } from '../resources/sessions/state.js';
import { RIGHT_SIDEBAR, SESSION_VIEWS, besideSession, mountRight, showView, viewEntries } from './right-sidebar.js';

describe('showView', () => {
  const setup = () => {
    const scena = createScena();
    scena.components.register({ component: 'Page', category: 'page', renderer: { kind: 'react', load: async () => ({ default: () => null }) } });
    const tab = (key: string) => ({ key, resource: { component: 'Page' }, props: { title: key } });
    const mounted = [mountRight(scena, tab('a'), '·'), mountRight(scena, tab('b'), '·', { keys: 'ctrl+shift+g' })];
    return { scena, dispose: () => mounted.forEach((one) => one.dispose()) };
  };
  const open = (scena: ReturnType<typeof createScena>) => scena.surfaces.listAt(RIGHT_SIDEBAR).map((one) => one.key);

  it('shows a hidden sidebar on the tab', () => {
    const { scena, dispose } = setup();
    scena.layout.setSurface(RIGHT_SIDEBAR, { visible: false, activeContainerKey: 'a' });
    showView(scena, 'b');
    expect(scena.layout.get().surfaces[RIGHT_SIDEBAR]).toMatchObject({ visible: true, activeContainerKey: 'b' });
    dispose();
  });

  it('mounts a closed tab again', () => {
    const { scena, dispose } = setup();
    scena.surfaces.close('a');
    expect(open(scena)).toEqual(['b']);
    showView(scena, 'a');
    expect(open(scena)).toContain('a');
    expect(scena.layout.get().surfaces[RIGHT_SIDEBAR]?.activeContainerKey).toBe('a');
    dispose();
  });

  it('lists each view with its title and icon, and drops a disposed one', () => {
    const scena = createScena();
    const tab = (key: string) => ({ key, resource: { component: 'Page' }, props: { title: key.toUpperCase() } });
    const a = mountRight(scena, tab('a'), '1');
    const b = mountRight(scena, tab('b'), '2');
    expect(viewEntries(scena)).toEqual([{ key: 'a', title: 'A', icon: '1' }, { key: 'b', title: 'B', icon: '2' }]);
    a.dispose();
    expect(viewEntries(scena).map((one) => one.key)).toEqual(['b']);
    b.dispose();
  });

  it('puts each tab in the palette, with its keys', () => {
    const { scena, dispose } = setup();
    expect(scena.commands.get('ahp.view.a')).toBeDefined();
    expect(scena.keybindings.resolve({ key: 'G', ctrlKey: true, shiftKey: true, altKey: false, metaKey: false })).toMatchObject({ kind: 'fire', commandId: 'ahp.view.b' });
    dispose();
  });
});

describe('besideSession', () => {
  const leaf = (id: string, tabs: string[], activeKey = tabs[0]): TabPanelNode => ({ kind: 'leaf', id, tabs, ...(activeKey === undefined ? {} : { activeKey }) });

  it('splits the only group, with the view to the right', () => {
    expect(besideSession(leaf('g1', ['s1', 's2']), 's1', 'v', 'g2')).toEqual({
      kind: 'split', direction: 'row', ratio: 0.5, first: leaf('g1', ['s1', 's2']), second: leaf('g2', ['v']),
    });
  });

  it('puts the view in the other group, and takes it out of the session\'s', () => {
    const tree: TabPanelNode = { kind: 'split', direction: 'row', first: leaf('g1', ['s1', 'v'], 'v'), second: leaf('g2', ['s2']) };
    expect(besideSession(tree, 's1', 'v', 'g3')).toEqual({ kind: 'split', direction: 'row', first: leaf('g1', ['s1']), second: leaf('g2', ['s2', 'v'], 'v') });
  });

  it('keeps the tree when the session is not in it', () => {
    const tree = leaf('g1', ['a']);
    expect(besideSession(tree, 's1', 'v', 'g2')).toBe(tree);
  });
});

describe('the views place', () => {
  it('moves a placed view to main and back; a view that is not placed stays', async () => {
    const settle = () => new Promise((done) => setTimeout(done, 0));
    const scena = createScena();
    scena.components.register({ component: 'Page', category: 'page', renderer: { kind: 'react', load: async () => ({ default: () => null }) } });
    const tab = (key: string) => ({ key, resource: { component: 'Page' }, props: { title: key } });
    const mounted = [mountRight(scena, tab('info'), '·', { placed: SESSION_VIEWS }), mountRight(scena, tab('files'), '·')];
    scena.surfaces.open({ surface: 'main', key: 'session:h1:echo:/a', resource: { component: 'Page' } } as never);
    scena.store.set(ACTIVE_SESSION, { host: 'h1', resource: 'echo:/a' });
    scena.layout.setSurface('main', { ...scena.layout.get().surfaces.main, visible: true, layout: 'tab-panel', tabPanel: { tree: { kind: 'leaf', id: 'g1', tabs: ['session:h1:echo:/a'], activeKey: 'session:h1:echo:/a' } } });
    const keys = (surface: string) => scena.surfaces.listAt(surface).map((one) => one.key);

    scena.store.set(SESSION_VIEWS.path, 'tab');
    await settle();
    expect(keys(RIGHT_SIDEBAR)).toEqual(['files']);
    expect(keys('main')).toContain('info');
    const tree = scena.layout.get().surfaces.main?.tabPanel?.tree;
    expect(tree?.kind === 'split' && tree.second).toMatchObject({ kind: 'leaf', tabs: ['info'] });

    showView(scena, 'files');
    expect(keys(RIGHT_SIDEBAR)).toEqual(['files']);

    scena.store.set(SESSION_VIEWS.path, 'sidebar');
    await settle();
    expect(keys('main')).not.toContain('info');
    expect(keys(RIGHT_SIDEBAR).sort()).toEqual(['files', 'info']);
    mounted.forEach((one) => one.dispose());
  });
});
