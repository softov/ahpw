import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createScena } from '@softov/scena/core';
import { THEME_MODE_PATH } from '@softov/scena/styles';
import { registerBuiltinThemes } from '@softov/scena/themes';
import { initConfirm, resetConfirm, setConfirmStyle } from '../notify/confirm.js';
import { registerView } from '../view/index.js';
import { registerProfile } from './profile.js';
import { readUi, uiFields, watchUi, writeUi } from './settings.js';

let held: Map<string, string>;

function scenaWithOwners(): ReturnType<typeof createScena> {
  registerBuiltinThemes();
  const scena = createScena();
  initConfirm(scena.store, 'modal');
  registerView(scena);
  return scena;
}

/** Lets a promise chain run out. */
const settle = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));

describe('UI settings', () => {
  beforeEach(() => {
    held = new Map();
    const storage = { getItem: (key: string) => held.get(key) ?? null, setItem: (key: string, value: string) => { held.set(key, value); } };
    vi.stubGlobal('localStorage', storage);
    // The layout is kept through `window.localStorage`.
    vi.stubGlobal('window', { localStorage: storage });
  });
  afterEach(() => {
    resetConfirm();
    vi.unstubAllGlobals();
  });

  it('reads each setting from its owner, and offers each as a field with its values', () => {
    const scena = scenaWithOwners();
    expect(readUi(scena)).toMatchObject({ 'ui.themeMode': 'system', 'ui.layout': 'tab', 'ui.settingsPlace': 'overlay', 'ui.confirmStyle': 'modal' });
    const fields = uiFields(scena);
    expect(fields['ui.confirmStyle']).toMatchObject({ enum: ['modal', 'native'], default: 'modal', title: 'Confirmations' });
    expect(fields['ui.layout']?.enum).toContain('split');
    expect(readUi(scena)['ui.sessionViewsPlace']).toBe('sidebar');
    expect(fields['ui.sessionViewsPlace']).toMatchObject({ enum: ['sidebar', 'tab'], default: 'sidebar', title: 'Session Info and Changes' });
  });

  it('writes through the owner, which keeps it; a value it does not take goes back to the usual one', async () => {
    const scena = scenaWithOwners();
    writeUi(scena, 'ui.confirmStyle', 'native');
    expect(held.get('ahpw.confirmStyle')).toBe('native');
    writeUi(scena, 'ui.settingsPlace', 'panel:bottom');
    expect(held.get('ahpw.settingsPlace')).toBe('panel:bottom');
    writeUi(scena, 'ui.layout', 'split');
    await settle();
    expect(readUi(scena)['ui.layout']).toBe('split');
    expect(held.get('ahpd-web.main-layout')).toBe('split');
    writeUi(scena, 'ui.themeMode', 'dark');
    expect(scena.store.get(THEME_MODE_PATH)).toBe('dark');
    writeUi(scena, 'ui.themeMode', 'purple');
    expect(scena.store.get(THEME_MODE_PATH)).toBe('system');
    writeUi(scena, 'ui.confirmStyle', undefined);
    expect(readUi(scena)['ui.confirmStyle']).toBe('modal');
    writeUi(scena, 'ui.sessionViewsPlace', 'tab');
    expect(held.get('ahpw.sessionViewsPlace')).toBe('tab');
    expect(readUi(scena)['ui.sessionViewsPlace']).toBe('tab');
    writeUi(scena, 'ui.sessionViewsPlace', 'floor');
    expect(readUi(scena)['ui.sessionViewsPlace']).toBe('sidebar');
  });

  it('starts tool calls collapsed and the text as Markdown, and keeps a change in the browser', () => {
    const scena = scenaWithOwners();
    const fields = uiFields(scena);
    expect(readUi(scena)).toMatchObject({ 'ui.toolsExpanded': 'collapsed', 'ui.sessionMarkdown': 'enabled' });
    expect(fields['ui.toolsExpanded']).toMatchObject({ enum: ['expanded', 'collapsed'], default: 'collapsed', title: 'Tool calls' });
    expect(fields['ui.sessionMarkdown']?.['x-enumOptions']).toEqual([{ value: 'enabled', label: 'Enabled' }, { value: 'disabled', label: 'Disabled' }]);
    writeUi(scena, 'ui.toolsExpanded', 'expanded');
    writeUi(scena, 'ui.sessionMarkdown', 'disabled');
    expect(held.get('ahpw.toolsExpanded')).toBe('expanded');
    expect(held.get('ahpw.sessionMarkdown')).toBe('disabled');
    expect(readUi(scenaWithOwners())).toMatchObject({ 'ui.toolsExpanded': 'expanded', 'ui.sessionMarkdown': 'disabled' });
    writeUi(scena, 'ui.sessionMarkdown', 'loud');
    expect(readUi(scena)['ui.sessionMarkdown']).toBe('enabled');
  });

  it('asks where a bot chat opens until a place is kept', () => {
    const scena = scenaWithOwners();
    expect(readUi(scena)['ui.botChatOpens']).toBe('ask');
    expect(uiFields(scena)['ui.botChatOpens']).toMatchObject({ enum: ['ask', 'main', 'right'], default: 'ask', title: 'Bot chat', 'x-enumOptions': [{ value: 'ask', label: 'Ask' }, { value: 'main', label: 'Main area' }, { value: 'right', label: 'Right sidebar' }] });
    writeUi(scena, 'ui.botChatOpens', 'right');
    expect(held.get('ahpw.botChatOpens')).toBe('right');
    expect(readUi(scenaWithOwners())['ui.botChatOpens']).toBe('right');
  });

  it('opens an agent file in a new panel until a modal is kept', () => {
    const scena = scenaWithOwners();
    expect(readUi(scena)['ui.customFileOpens']).toBe('panel');
    expect(uiFields(scena)['ui.customFileOpens']).toMatchObject({ enum: ['panel', 'modal'], default: 'panel', title: 'Agent files' });
    writeUi(scena, 'ui.customFileOpens', 'modal');
    expect(held.get('ahpw.customFileOpens')).toBe('modal');
  });

  it('sees a change made from a menu, not only from the form', async () => {
    const scena = scenaWithOwners();
    const changed = vi.fn();
    const watching = watchUi(scena, changed);
    setConfirmStyle('native');
    await settle();
    expect(changed).toHaveBeenCalled();
    watching.dispose();
    changed.mockClear();
    setConfirmStyle('modal');
    await settle();
    expect(changed).not.toHaveBeenCalled();
  });

  it('applies what an embedder\'s profile holds, then writes the whole list to it on each change', async () => {
    const scena = scenaWithOwners();
    const write = vi.fn(async () => {});
    const profile = { read: async () => ({ 'ui.confirmStyle': 'native', 'ui.themeMode': 'dark', 'someone.else': 1 }), write };
    const keeping = registerProfile(scena, profile);
    // The read, then the one write it coalesces into.
    await settle();
    await settle();
    expect(readUi(scena)).toMatchObject({ 'ui.confirmStyle': 'native', 'ui.themeMode': 'dark' });
    // The browser keeps its copy.
    expect(held.get('ahpw.confirmStyle')).toBe('native');
    expect(write).toHaveBeenLastCalledWith(expect.objectContaining({ 'ui.confirmStyle': 'native', 'ui.themeMode': 'dark', 'ui.layout': 'tab' }));
    expect(write).toHaveBeenCalledTimes(1);
    writeUi(scena, 'ui.settingsPlace', 'main');
    await settle();
    await settle();
    expect(write).toHaveBeenLastCalledWith(expect.objectContaining({ 'ui.settingsPlace': 'main' }));
    keeping.dispose();
  });

  it('changes nothing when the embedder gives no profile', () => {
    const scena = scenaWithOwners();
    const before = readUi(scena);
    registerProfile(scena, undefined).dispose();
    expect(readUi(scena)).toEqual(before);
  });
});
