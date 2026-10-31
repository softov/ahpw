import { describe, expect, it } from 'vitest';
import type { AgentCustomization, CustomizationEnablement, DirectoryCustomization, McpServerCustomization, McpServerState, PluginCustomization, SkillCustomization } from '@microsoft/agent-host-protocol';
import { customizationKinds, emptyKinds, kindCount, kindTabKey, kindTabTitle, searchKind } from './kinds.js';

const plugin = (fields: Partial<PluginCustomization>): PluginCustomization => ({ type: 'plugin' as PluginCustomization['type'], id: 'p', uri: 'file:///home/ana/.plugins/tidy', name: 'tidy', ...fields });
const folder = (fields: Partial<DirectoryCustomization>): DirectoryCustomization => ({
  type: 'directory' as DirectoryCustomization['type'],
  id: 'd',
  uri: 'file:///home/ana/work/.agents/skills',
  name: 'skills',
  enabled: true,
  contents: 'skill' as DirectoryCustomization['contents'],
  writable: true,
  ...fields,
});
const mcp = (fields: Partial<McpServerCustomization> = {}): McpServerCustomization => ({ type: 'mcpServer' as McpServerCustomization['type'], id: 'm', uri: 'file:///srv/mcp.json', name: 'files', state: { kind: 'ready' } as unknown as McpServerState, ...fields });
const skill = (fields: Partial<SkillCustomization>): SkillCustomization => ({ type: 'skill' as SkillCustomization['type'], id: 's', uri: 'file:///x/SKILL.md', name: 'lint', ...fields });
const subagent = (fields: Partial<AgentCustomization>): AgentCustomization => ({ type: 'agent' as AgentCustomization['type'], id: 'a', uri: 'file:///x/a.md', name: 'review', ...fields });

describe('customizationKinds', () => {
  it('makes one tab per kind in order, with a folder group, a Plugins group and the host group', () => {
    const tabs = customizationKinds([
      mcp(),
      plugin({ children: [skill({ id: 'p1', name: 'tidy-up' }), subagent({})] }),
      folder({ children: [skill({}), skill({ id: 's2', name: 'ship' })] }),
    ]);
    expect(tabs.map((tab) => [tab.kind, tab.count])).toEqual([['agent', 1], ['skill', 3], ['mcpServer', 1], ['plugin', 1]]);
    const skills = tabs.find((tab) => tab.kind === 'skill');
    expect(skills?.groups.map((group) => [group.title, group.items.map((item) => item.label)])).toEqual([
      ['Plugins', ['/tidy-up']],
      ['~/work/.agents/skills', ['/lint', '/ship']],
    ]);
    expect(skills?.groups[0]?.items[0]?.plugin).toBe('tidy');
    expect(skills?.groups[1]?.items[0]).toMatchObject({ key: 'd/s', path: '/x/SKILL.md', editable: true });
    expect(tabs.find((tab) => tab.kind === 'mcpServer')?.groups).toMatchObject([{ key: 'host', title: '', items: [{ name: 'files' }] }]);
    expect(tabs.find((tab) => tab.kind === 'plugin')?.groups[0]?.items[0]).toMatchObject({ name: 'tidy', line: '1 skill, 1 agent · on' });
  });

  it('keeps a writable folder as an empty group, and offers New in its kind', () => {
    const [agents] = customizationKinds([folder({ id: 'e', uri: 'file:///home/ana/.claude/agents', contents: 'agent' as DirectoryCustomization['contents'] })]);
    expect(agents).toMatchObject({ kind: 'agent', count: 0, newFolder: 'file:///home/ana/.claude/agents', newKind: 'agent', groups: [{ key: 'e', items: [] }] });
  });

  it('dims the children of a plugin that is off', () => {
    const [skills] = customizationKinds([plugin({ enablement: [{ kind: 'session', enabled: false } as CustomizationEnablement], children: [skill({})] })]);
    expect(skills?.groups[0]?.items[0]?.enabled).toBe(false);
  });
});

describe('emptyKinds and the kind tabs', () => {
  it('names the kinds with no tab, and titles and counts the kinds with items', () => {
    const tabs = customizationKinds([mcp(), folder({ children: [skill({})] })]);
    expect(emptyKinds(tabs)).toEqual(['Agents', 'Prompts', 'Rules', 'Hooks', 'Plugins']);
    expect(tabs.map(kindTabTitle)).toEqual(['Skills 1', 'MCP servers 1']);
    expect(tabs.map(kindCount)).toEqual(['1 skill', '1 MCP server']);
    expect(tabs.map((tab) => kindTabKey(tab.kind))).toEqual(['kind:skill', 'kind:mcpServer']);
  });
});

describe('searchKind', () => {
  it('filters on the name and description, ignoring case, and drops empty groups', () => {
    const [skills] = customizationKinds([
      plugin({ children: [skill({ id: 'p1', name: 'tidy-up' })] }),
      folder({ children: [skill({}), skill({ id: 's2', name: 'ship', description: 'Release a LINT-free build' })] }),
    ]);
    if (skills === undefined) throw new Error('no skills tab');
    expect(searchKind(skills, '  ')).toBe(skills.groups);
    expect(searchKind(skills, 'lint').map((group) => group.items.map((item) => item.name))).toEqual([['lint', 'ship']]);
  });
});
