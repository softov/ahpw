import { describe, expect, it } from 'vitest';
import type {
  AgentCustomization,
  AgentInfo,
  CustomizationEnablement,
  CustomizationLoadState,
  DirectoryCustomization,
  McpServerCustomization,
  McpServerState,
  PluginCustomization,
  RuleCustomization,
  SessionModelInfo,
  SkillCustomization,
} from '@microsoft/agent-host-protocol';
import { withoutFrontmatter, capabilitiesOf, childFlags, childLine, countOf, customizationRows, limitsOf, modelsLine, shortPath, signInOf, stateOf } from './words.js';

const agent = (fields: Partial<AgentInfo>): AgentInfo => ({ provider: 'echo', displayName: 'Echo', description: '', models: [], ...fields });

describe('modelsLine', () => {
  it('counts the models', () => {
    expect(modelsLine(agent({}))).toBe('No models listed');
    expect(modelsLine(agent({ models: [{ id: 'a', provider: 'echo', name: 'A' }] }))).toBe('1 model');
  });
});

describe('capabilitiesOf', () => {
  it('says what an agent does beyond one chat and one folder', () => {
    expect(capabilitiesOf(agent({ capabilities: { multipleChats: { fork: true }, multipleWorkingDirectories: { immutablePrimary: true } } }))).toEqual([
      'Several chats per session, and forks',
      'Several folders, the first one fixed',
    ]);
    expect(capabilitiesOf(agent({}))).toEqual([]);
  });
});

describe('limitsOf', () => {
  it('puts a model\'s limits on one line', () => {
    const model: SessionModelInfo = { id: 'm', provider: 'echo', name: 'M', maxContextWindow: 200000, maxOutputTokens: 8000, supportsVision: true };
    expect(limitsOf(model)).toBe('200k context \u{00B7} 8k out \u{00B7} images');
  });
});

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
const mcp = (state: McpServerState, fields: Partial<McpServerCustomization> = {}): McpServerCustomization => ({ type: 'mcpServer' as McpServerCustomization['type'], id: 'm', uri: 'file:///srv/mcp.json', name: 'files', state, ...fields });
const skill = (fields: Partial<SkillCustomization>): SkillCustomization => ({ type: 'skill' as SkillCustomization['type'], id: 's', uri: 'file:///x/SKILL.md', name: 'lint', ...fields });
const rule = (fields: Partial<RuleCustomization>): RuleCustomization => ({ type: 'rule' as RuleCustomization['type'], id: 'r', uri: 'file:///x/r.md', name: 'style', ...fields });
const subagent = (fields: Partial<AgentCustomization>): AgentCustomization => ({ type: 'agent' as AgentCustomization['type'], id: 'a', uri: 'file:///x/a.md', name: 'review', ...fields });
const state = <T extends McpServerState>(fields: Record<string, unknown>): T => fields as unknown as T;

describe('stateOf', () => {
  it('reads an MCP server\'s state by its kind', () => {
    expect(stateOf(mcp(state({ kind: 'ready' })))).toEqual({ tone: 'success', text: 'Ready' });
    expect(stateOf(mcp(state({ kind: 'starting' })))).toEqual({ tone: 'info', text: 'Starting' });
    expect(stateOf(mcp(state({ kind: 'starting', blocking: true })))).toEqual({ tone: 'info', text: 'Starting; blocks the next turn' });
    expect(stateOf(mcp(state({ kind: 'authRequired', reason: 'expired', resource: { resource: 'https://mcp' } })))).toEqual({ tone: 'warning', text: 'Sign-in expired' });
    expect(stateOf(mcp(state({ kind: 'error', error: { errorType: 'spawn', message: 'Not found: npx' } })))).toEqual({ tone: 'danger', text: 'Not found: npx' });
    expect(stateOf(mcp(state({ kind: 'stopped' })))).toEqual({ tone: 'default', text: 'Stopped' });
  });

  it('says a container\'s load only when it is not plainly loaded', () => {
    expect(stateOf(plugin({}))).toBeUndefined();
    expect(stateOf(plugin({ load: { kind: 'loaded' } as CustomizationLoadState }))).toBeUndefined();
    expect(stateOf(plugin({ load: { kind: 'loading' } as CustomizationLoadState }))).toEqual({ tone: 'busy', text: 'Loading' });
    expect(stateOf(folder({ load: { kind: 'degraded', message: '1 skill has no name' } as CustomizationLoadState }))).toEqual({ tone: 'warning', text: '1 skill has no name' });
    expect(stateOf(folder({ load: { kind: 'error', message: 'Not readable' } as CustomizationLoadState }))).toEqual({ tone: 'danger', text: 'Not readable' });
  });
});

describe('countOf', () => {
  it('counts a folder by its contents and a plugin by its children\'s types', () => {
    expect(countOf(folder({ children: [skill({ id: '1' }), skill({ id: '2' })] }))).toBe('2 skills');
    expect(countOf(folder({ contents: 'agent' as DirectoryCustomization['contents'], children: [subagent({})] }))).toBe('1 agent');
    expect(countOf(folder({}))).toBeUndefined();
    expect(countOf(plugin({ children: [skill({}), rule({ id: '1' }), rule({ id: '2' }), rule({ id: '3' })] }))).toBe('1 skill, 3 rules');
    expect(countOf(plugin({ children: [] }))).toBe('Empty');
  });
});

describe('shortPath', () => {
  it('writes a home folder as ~', () => {
    expect(shortPath('file:///home/ana/work/.agents')).toBe('~/work/.agents');
    expect(shortPath('file:///Users/ana')).toBe('~');
    expect(shortPath('file:///srv/mcp.json')).toBe('/srv/mcp.json');
    expect(shortPath('https://plugins.example/tidy')).toBe('https://plugins.example/tidy');
  });
});

describe('childLine', () => {
  it('keeps the first line of a description and cuts it with an ellipsis', () => {
    expect(childLine(skill({ description: 'Lint the code.\nThen fix it.' }))).toBe('Lint the code.');
    expect(childLine(skill({ description: 'x'.repeat(100) }))).toBe(`${'x'.repeat(79)}\u{2026}`);
    expect(childLine(skill({}))).toBe('');
  });
});

describe('childFlags', () => {
  it('says who may call a child, its model and when a rule applies', () => {
    expect(childFlags(skill({}))).toEqual([]);
    expect(childFlags(skill({ disableModelInvocation: true }))).toEqual(['user only']);
    expect(childFlags(subagent({ disableUserInvocation: true, model: 'opus' }))).toEqual(['model only', 'pinned to opus']);
    expect(childFlags(rule({ alwaysApply: true }))).toEqual(['always']);
    expect(childFlags(rule({ alwaysApply: true, globs: ['*.ts', '*.tsx'] }))).toEqual(['*.ts, *.tsx']);
  });
});

describe('customizationRows', () => {
  it('puts containers first, then MCP servers, each in host order', () => {
    const rows = customizationRows([mcp(state({ kind: 'ready' })), folder({}), plugin({})]);
    expect(rows.map((row) => row.id)).toEqual(['d', 'p', 'm']);
  });

  it('words a row: path, count, read-only, version and on or off', () => {
    const [row] = customizationRows([plugin({ version: '1.2.0', enablement: [{ kind: 'session', enabled: false } as CustomizationEnablement], children: [skill({ enabled: false })] })]);
    expect(row).toMatchObject({ name: 'tidy', kind: 'Plugin', path: '~/.plugins/tidy', meta: ['1 skill', 'v1.2.0', 'off'], enabled: false });
    expect(row?.children).toEqual([{ id: 's', name: 'lint', line: '', description: '', flags: [], enabled: false, open: { uri: 'file:///x/SKILL.md', line: null } }]);
    expect(row?.open).toBeUndefined();
    const [read] = customizationRows([folder({ writable: false, children: [] })]);
    expect(read?.meta).toEqual(['0 skills', 'read-only', 'on']);
  });

  it('opens a child or MCP server file, at the line it is declared on', () => {
    const range = { start: { line: 4, character: 2 }, end: { line: 9, character: 3 } };
    const [row, server] = customizationRows([folder({ children: [subagent({})] }), mcp(state({ kind: 'ready' }), { range })]);
    expect(row?.open).toBeUndefined();
    expect(row?.children[0]?.open).toEqual({ uri: 'file:///x/a.md', line: null });
    expect(server?.open).toEqual({ uri: 'file:///srv/mcp.json', line: 5 });
    expect(customizationRows([mcp(state({ kind: 'ready' }), { uri: 'builtin:agents-md' })])[0]?.open).toBeUndefined();
    const [skills] = customizationRows([folder({ children: [skill({ uri: 'file:///x/skills/advisor/' })] })]);
    expect(skills?.children[0]?.open).toEqual({ uri: 'file:///x/skills/advisor/SKILL.md', line: null });
  });

  it('gives an MCP server child its dot', () => {
    const [row] = customizationRows([plugin({ children: [mcp(state({ kind: 'stopped' }), { id: 'c' })] })]);
    expect(row?.children[0]?.state).toEqual({ tone: 'default', text: 'Stopped' });
  });
});

describe('withoutFrontmatter', () => {
  it('drops the block at the top and nothing else', () => {
    expect(withoutFrontmatter('---\nname: a\ndescription: b\n---\n\n# A\n\n---\nmore')).toBe('# A\n\n---\nmore');
    expect(withoutFrontmatter('# Plain\n')).toBe('# Plain\n');
    expect(withoutFrontmatter('---\r\nname: a\r\n---\r\nbody')).toBe('body');
  });
});

describe('signInOf', () => {
  it('lists the resources and their scopes', () => {
    expect(signInOf(agent({ protectedResources: [{ resource: 'https://api', resource_name: 'API', scopes_supported: ['read', 'write'], required: true }] }))).toEqual([
      { name: 'API', scopes: 'read, write', required: true },
    ]);
  });
});
