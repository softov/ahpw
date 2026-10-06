import { describe, expect, it } from 'vitest';
import type { AgentInfo, Customization, SessionModelInfo } from '@microsoft/agent-host-protocol';
import { capabilitiesOf, customizationOf, limitsOf, modelsLine, signInOf } from './words.js';

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

describe('customizationOf', () => {
  it('names the kind and the state', () => {
    const mcp = { type: 'mcpServer', id: '1', uri: 'x', name: 'files', state: { status: 'ready' } } as unknown as Customization;
    expect(customizationOf(mcp)).toEqual({ name: 'files', kind: 'MCP server', state: 'ready' });
    const folder = { type: 'directory', id: '2', uri: 'y', name: 'skills', enabled: false } as unknown as Customization;
    expect(customizationOf(folder)).toEqual({ name: 'skills', kind: 'Folder', state: 'off' });
  });
});

describe('signInOf', () => {
  it('lists the resources and their scopes', () => {
    expect(signInOf(agent({ protectedResources: [{ resource: 'https://api', resource_name: 'API', scopes_supported: ['read', 'write'], required: true }] }))).toEqual([
      { name: 'API', scopes: 'read, write', required: true },
    ]);
  });
});
