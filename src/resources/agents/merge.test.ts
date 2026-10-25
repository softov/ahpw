import { describe, expect, it } from 'vitest';
import type { AgentInfo } from '@microsoft/agent-host-protocol';
import type { AgentRow } from '../../bridges/agents.js';
import { agentTitle, mergeAgents } from './merge.js';

const info = (provider: string, displayName: string): AgentInfo => ({ provider, displayName, description: '', models: [] });
const record = (id: string, fields: Partial<AgentRow> = {}): AgentRow => ({ id, engine: 'claude', owner: 'host', name: id, config: {}, state: 'ready', ...fields });

describe('mergeAgents', () => {
  it('gives each id one entry with its status', () => {
    const merged = mergeAgents(
      [info('claude', 'Claude Code'), info('bot-chat', 'Bot chat')],
      [record('claude'), record('pi-test', { engine: 'pi', state: 'unavailable' }), record('broken', { state: 'invalid' })],
    );
    expect(merged.map(({ id, status }) => [id, status])).toEqual([
      ['bot-chat', 'standalone'],
      ['broken', 'standby'],
      ['claude', 'configured'],
      ['pi-test', 'standby'],
    ]);
    expect(merged.find((one) => one.id === 'claude')?.info?.displayName).toBe('Claude Code');
    expect(merged.find((one) => one.id === 'claude')?.record?.engine).toBe('claude');
  });

  it('shows another owner\'s ready record as configured', () => {
    const [ana] = mergeAgents([], [record('ana-claude', { owner: 'user:ana', name: 'Ana\'s Claude' })]);
    expect(ana).toMatchObject({ id: 'ana-claude', status: 'configured' });
    expect(ana?.info).toBeUndefined();
    expect(agentTitle(ana!)).toBe('Ana\'s Claude');
  });

  it('keeps the root list as it is on a host with no agents channel', () => {
    expect(mergeAgents([info('echo', 'Echo')], []).map(({ id, status }) => [id, status])).toEqual([['echo', 'standalone']]);
  });
});
