import { describe, expect, it } from 'vitest';
import type { EngineRow } from '../../bridges/agents.js';
import { idFor } from '../connectors/form.js';
import { agentConfigForForm, agentConfigForPut, agentWanted, engineSchema, startOf } from './form.js';

const ENGINE: EngineRow = {
  name: 'claude',
  title: 'Claude Code',
  description: '',
  plugin: 'agent-claude',
  schema: {
    type: 'object',
    properties: {
      outputStyle: { type: 'string' },
      apiKey: { type: 'string', writeOnly: true },
      env: { type: 'object' },
      extraArgs: { type: 'object' },
    },
  },
  hostOnly: ['extraArgs'],
  keyVariables: ['ANTHROPIC_API_KEY'],
};

const KEPT = { $secret: 'host/agent/claude/env.ANTHROPIC_API_KEY' };

describe('engineSchema', () => {
  it('draws each key variable as a password, and says a stored one is kept', () => {
    const drawn = engineSchema(ENGINE, { env: { ANTHROPIC_API_KEY: KEPT } }, 'host', 'Kept') as { properties: Record<string, Record<string, unknown>> };
    expect(drawn.properties.ANTHROPIC_API_KEY).toEqual({ type: 'string', title: 'ANTHROPIC_API_KEY', format: 'password', description: 'Kept' });
    expect(drawn.properties.apiKey?.format).toBe('password');
    expect(Object.keys(drawn.properties)).toContain('extraArgs');
  });

  it('leaves the host-only fields and env out of a record the host does not own', () => {
    const drawn = engineSchema(ENGINE, {}, 'user:ana', 'Kept') as { properties: Record<string, unknown> };
    expect(Object.keys(drawn.properties)).toEqual(['outputStyle', 'apiKey', 'ANTHROPIC_API_KEY']);
  });
});

describe('the config', () => {
  it('shows a kept secret empty, with the key lifted out of env', () => {
    expect(agentConfigForForm(ENGINE, { apiKey: { $secret: 'x' }, env: { ANTHROPIC_API_KEY: KEPT, DEBUG: '1' } })).toEqual({ apiKey: '', env: { DEBUG: '1' }, ANTHROPIC_API_KEY: '' });
  });

  it('sends an untouched kept secret as "" to keep it', () => {
    const held = { apiKey: { $secret: 'x' }, env: { ANTHROPIC_API_KEY: KEPT } };
    const form = agentConfigForForm(ENGINE, held);
    expect(agentConfigForPut(ENGINE, form, held, 'host')).toEqual({ apiKey: '', env: { ANTHROPIC_API_KEY: '' } });
  });

  it('sends a typed key in env, and leaves an empty key out where none is stored', () => {
    expect(agentConfigForPut(ENGINE, { ANTHROPIC_API_KEY: 'sk-new' }, {}, 'host')).toEqual({ apiKey: '', env: { ANTHROPIC_API_KEY: 'sk-new' } });
    expect(agentConfigForPut(ENGINE, { ANTHROPIC_API_KEY: '' }, {}, 'host')).toEqual({ apiKey: '' });
  });

  it('drops the host-only fields and other variables from a record the host does not own', () => {
    expect(agentConfigForPut(ENGINE, { extraArgs: { x: null }, env: { DEBUG: '1' }, ANTHROPIC_API_KEY: 'k' }, {}, 'user:ana')).toEqual({ apiKey: '', env: { ANTHROPIC_API_KEY: 'k' } });
  });
});

describe('agentWanted', () => {
  it('trims the top and keeps the icon', () => {
    const icon = { src: 'data:image/svg+xml;base64,eA==' };
    expect(agentWanted(ENGINE, { id: 'claude', owner: 'host', name: ' Claude ', description: '', model: '' }, {}, {}, icon)).toEqual({
      icon, id: 'claude', engine: 'claude', owner: 'host', name: 'Claude', description: '', model: '', config: { apiKey: '' },
    });
  });
});

describe('a new record', () => {
  const engine: EngineRow = { ...ENGINE, templates: [{ name: 'Claude Code', description: 'As the host runs it.', model: 'opus', icon: { src: 'data:image/png;base64,eA==' }, config: { outputStyle: 'brief' } }] };

  it('starts from a template, with the key fields empty', () => {
    expect(startOf(engine, 0)).toEqual({
      top: { name: 'Claude Code', description: 'As the host runs it.', model: 'opus' },
      config: { outputStyle: 'brief', ANTHROPIC_API_KEY: '' },
      icon: { src: 'data:image/png;base64,eA==' },
    });
  });

  it('starts blank, and takes its id from its name', () => {
    expect(startOf(engine, -1)).toEqual({ top: { name: '', description: '', model: '' }, config: { ANTHROPIC_API_KEY: '' } });
    expect(idFor('Claude Code', 'claude', ['claude-code'])).toBe('claude-code-2');
    expect(idFor('', 'claude', [])).toBe('claude');
  });
});
