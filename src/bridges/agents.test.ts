import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NO_OFFERS } from './offers.js';
import {
  AGENT_KINDS,
  AGENTS,
  agentKindsReducer,
  agentsReducer,
  checkAgent,
  putAgent,
  removeAgent,
  servesAgentKinds,
  servesAgents,
  type AgentKindRow,
  type AgentRow,
} from './agents.js';

const request = vi.hoisted(() => vi.fn());

vi.mock('./data.js', () => ({ hostBridge: () => ({ request }) }));

const KIND: AgentKindRow = { name: 'claude', title: 'Claude', description: 'Claude Code.', schema: { type: 'object' }, plugin: 'claude', icons: [{ src: 'data:image/svg+xml;base64,eA==' }] };
const AGENT: AgentRow = { id: 'claude', kind: 'claude', owner: 'host', name: 'Claude', config: { apiKey: { $secret: 'host/agent/claude/apiKey' } }, state: 'ready' };

beforeEach(() => {
  request.mockReset();
});

describe('the two channels', () => {
  it('fold their own rows', () => {
    expect(agentKindsReducer({ records: [] }, { type: 'x-ahpd-agent-kinds/added', id: 'claude', record: KIND }).records).toEqual([{ id: 'claude', record: KIND }]);
    let state = agentsReducer({ records: [] }, { type: 'x-ahpd-agents/added', id: 'claude', record: AGENT });
    expect(state.records).toEqual([{ id: 'claude', record: AGENT }]);
    state = agentsReducer(state, { type: 'x-ahpd-agents/removed', id: 'claude' });
    expect(state.records).toEqual([]);
  });

  it('are served while the host offers them', () => {
    expect(servesAgents({ ...NO_OFFERS, channels: [AGENTS.scheme] })).toBe(true);
    expect(servesAgentKinds({ ...NO_OFFERS, channels: [AGENT_KINDS.scheme] })).toBe(true);
    expect(servesAgents(NO_OFFERS)).toBe(false);
    expect(servesAgentKinds(NO_OFFERS)).toBe(false);
  });
});

describe('put, check and remove', () => {
  it('put sends the record, leaving an empty description and model out, and answers the row', async () => {
    request.mockResolvedValue(AGENT);
    await expect(putAgent('h', { id: 'claude', kind: 'claude', owner: 'host', name: 'Claude', description: '', model: '', config: { apiKey: '' } })).resolves.toEqual(AGENT);
    expect(request).toHaveBeenLastCalledWith(AGENTS.put, { id: 'claude', kind: 'claude', owner: 'host', name: 'Claude', config: { apiKey: '' } });
  });

  it('put refuses an answer that is no agent', async () => {
    request.mockResolvedValue({});
    await expect(putAgent('h', { id: 'claude', kind: 'claude', owner: 'host', name: 'Claude', config: {} })).rejects.toThrow('answered no agent');
  });

  it('check sends the id and answers the row with its health', async () => {
    const checked: AgentRow = { ...AGENT, health: { result: 'ok', at: '2026-10-24T10:00:00Z' } };
    request.mockResolvedValue(checked);
    await expect(checkAgent('h', 'claude')).resolves.toEqual(checked);
    expect(request).toHaveBeenLastCalledWith(AGENTS.check, { id: 'claude' });
  });

  it('check refuses an answer that is no agent', async () => {
    request.mockResolvedValue(null);
    await expect(checkAgent('h', 'claude')).rejects.toThrow('answered no agent');
  });

  it('remove sends the id', async () => {
    request.mockResolvedValue({});
    await removeAgent('h', 'claude');
    expect(request).toHaveBeenLastCalledWith(AGENTS.remove, { id: 'claude' });
  });
});
