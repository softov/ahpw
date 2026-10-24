import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NO_OFFERS } from './offers.js';
import {
  ADAPTERS,
  adaptersReducer,
  CONNECTORS,
  connectorsReducer,
  isSecretRef,
  putConnector,
  removeConnector,
  servesAdapters,
  servesConnectors,
  type AdapterRow,
  type ConnectorRow,
} from './connectors.js';

const request = vi.hoisted(() => vi.fn());

vi.mock('./data.js', () => ({ hostBridge: () => ({ request }) }));

const WEBHOOK: AdapterRow = { name: 'webhook', title: 'Webhook', description: 'Calls in.', schema: { type: 'object' }, capabilities: [], plugin: 'webhook' };
const HOOK: ConnectorRow = { id: 'ci', adapter: 'webhook', owner: 'user:ana', config: { secret: { $secret: 'user:ana/connector/ci/secret' } }, state: 'ready' };

beforeEach(() => {
  request.mockReset();
});

describe('the two channels', () => {
  it('fold their own rows', () => {
    expect(adaptersReducer({ records: [] }, { type: 'x-ahpd-adapters/added', id: 'webhook', record: WEBHOOK }).records).toEqual([{ id: 'webhook', record: WEBHOOK }]);
    let state = connectorsReducer({ records: [] }, { type: 'x-ahpd-connectors/added', id: 'ci', record: HOOK });
    expect(state.records).toEqual([{ id: 'ci', record: HOOK }]);
    state = connectorsReducer(state, { type: 'x-ahpd-connectors/removed', id: 'ci' });
    expect(state.records).toEqual([]);
  });

  it('are served while the host offers them', () => {
    expect(servesConnectors({ ...NO_OFFERS, channels: [CONNECTORS.scheme] })).toBe(true);
    expect(servesAdapters({ ...NO_OFFERS, channels: [ADAPTERS.scheme] })).toBe(true);
    expect(servesConnectors(NO_OFFERS)).toBe(false);
  });

  it('know a secret reference from a value', () => {
    expect(isSecretRef({ $secret: 'x' })).toBe(true);
    expect(isSecretRef('x')).toBe(false);
    expect(isSecretRef(null)).toBe(false);
  });
});

describe('put and remove', () => {
  it('put sends the connector with its adapter, leaving an empty title out, and answers the row', async () => {
    request.mockResolvedValue(HOOK);
    await expect(putConnector('h', { id: 'ci', adapter: 'webhook', owner: 'user:ana', title: '', config: { secret: '' } })).resolves.toEqual(HOOK);
    expect(request).toHaveBeenLastCalledWith(CONNECTORS.put, { id: 'ci', adapter: 'webhook', owner: 'user:ana', config: { secret: '' } });
  });

  it('put refuses an answer that is no connector', async () => {
    request.mockResolvedValue({});
    await expect(putConnector('h', { id: 'ci', adapter: 'webhook', owner: 'host', config: {} })).rejects.toThrow('answered no connector');
  });

  it('remove sends the id', async () => {
    request.mockResolvedValue({});
    await removeConnector('h', 'ci');
    expect(request).toHaveBeenLastCalledWith(CONNECTORS.remove, { id: 'ci' });
  });
});
