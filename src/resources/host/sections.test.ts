import { describe, expect, it } from 'vitest';
import { interfaceGroups, settingsGroups } from './sections.js';

const schema = (keys: string[]) => ({ type: 'object' as const, properties: Object.fromEntries(keys.map((key) => [key, { type: 'string' as const }])) });

describe('settingsGroups', () => {
  it('gives each plugin key a section of its own, titled by its name', () => {
    const plugins = settingsGroups(schema(['port', 'plugins.@ahpd/agent-claude', 'plugins.bot'])).find((group) => group.id === 'plugins');
    expect(plugins?.sections.map((section) => [section.id, section.title, section.keys])).toEqual([
      ['plugins.@ahpd/agent-claude', '@ahpd/agent-claude', ['plugins.@ahpd/agent-claude']],
      ['plugins.bot', 'bot', ['plugins.bot']],
    ]);
  });

  it('names a key only once across every section', () => {
    const named = settingsGroups(schema([])).flatMap((group) => group.sections.flatMap((section) => section.keys));
    expect(new Set(named).size).toBe(named.length);
  });

  it('keeps the UI settings out of the host groups, for the Interface tab', () => {
    expect(settingsGroups(schema([])).flatMap((group) => group.sections.flatMap((section) => section.keys)).some((key) => key.startsWith('ui.'))).toBe(false);
    expect(interfaceGroups().flatMap((group) => group.sections.flatMap((section) => section.keys))).toEqual(['ui.theme', 'ui.themeMode', 'ui.language', 'ui.layout', 'ui.settingsPlace', 'ui.confirmStyle']);
  });

  it('leaves a key it does not know to the view, which lists it under Other', () => {
    const named = settingsGroups(schema(['somethingNew'])).flatMap((group) => group.sections.flatMap((section) => section.keys));
    expect(named).not.toContain('somethingNew');
  });
});
