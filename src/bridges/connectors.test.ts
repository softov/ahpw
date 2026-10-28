import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NO_OFFERS } from './offers.js';
import {
  ADAPTERS,
  adaptersReducer,
  CONNECTORS,
  connectorsReducer,
  finishSignIn,
  isSecretRef,
  putConnector,
  readConnectorModels,
  removeConnector,
  servesAdapters,
  servesConnectors,
  startSignIn,
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

describe('sign-in', () => {
  const WANTED = { id: 'or', adapter: 'openrouter', owner: 'user:ana' as const, title: 'Mine', config: { endpoint: 'https://x' } };
  const CODE = 'the-pasted-code';

  it('start sends what a put sends and answers the url and the state', async () => {
    request.mockResolvedValue({ url: 'https://idp/auth', state: 's1' });
    await expect(startSignIn('h', WANTED)).resolves.toEqual({ url: 'https://idp/auth', state: 's1' });
    expect(request).toHaveBeenLastCalledWith(CONNECTORS.signin, { id: 'or', adapter: 'openrouter', owner: 'user:ana', title: 'Mine', config: { endpoint: 'https://x' } });
  });

  it('start refuses an answer with no url or no state', async () => {
    request.mockResolvedValue({ state: 's1' });
    await expect(startSignIn('h', WANTED)).rejects.toThrow('answered no sign-in');
    request.mockResolvedValue({ url: 'https://idp/auth', state: '' });
    await expect(startSignIn('h', WANTED)).rejects.toThrow('answered no sign-in');
  });

  it('finish sends the state and the code and answers the row', async () => {
    request.mockResolvedValue(HOOK);
    await expect(finishSignIn('h', 's1', CODE)).resolves.toEqual(HOOK);
    expect(request).toHaveBeenLastCalledWith(CONNECTORS.signinFinish, { state: 's1', code: CODE });
  });

  it('finish says no code when the answer is no connector', async () => {
    request.mockResolvedValue({ code: CODE });
    const caught = await finishSignIn('h', 's1', CODE).catch((error: unknown) => error);
    expect(String((caught as Error).message)).toContain('answered no connector');
    expect(String((caught as Error).message)).not.toContain(CODE);
  });
});

describe('a connector\'s models', () => {
  it('are asked by id, and an answer keeps only the models it can show', async () => {
    request.mockResolvedValue({ models: [{ id: 'one', model: 'or/one', callable: true }, { id: 'bad' }], at: '2026-10-28T21:51:00.000Z' });
    await expect(readConnectorModels('h', 'or')).resolves.toEqual({ models: [{ id: 'one', model: 'or/one', callable: true }], at: '2026-10-28T21:51:00.000Z' });
    expect(request).toHaveBeenLastCalledWith(CONNECTORS.models, { id: 'or' });
  });

  it('refuse an answer that holds no list', async () => {
    request.mockResolvedValue({});
    await expect(readConnectorModels('h', 'or')).rejects.toThrow('answered no models');
  });
});
