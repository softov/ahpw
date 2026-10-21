import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NO_OFFERS } from './offers.js';
import { listTokens, mintToken, revokeToken, servesTokens, TOKENS } from './tokens.js';

const request = vi.hoisted(() => vi.fn());

vi.mock('./data.js', () => ({ hostBridge: () => ({ request }) }));

const LAPTOP = { id: 't1', user: 'ana', label: 'laptop', grants: ['proxy:write'], created: 1_760_000_000_000 };

beforeEach(() => {
  request.mockReset();
});

describe('servesTokens', () => {
  it('is whether the host offers the list command', () => {
    expect(servesTokens({ ...NO_OFFERS, methods: [TOKENS.list] })).toBe(true);
    expect(servesTokens(NO_OFFERS)).toBe(false);
  });
});

describe('listTokens', () => {
  it('asks for the person own, naming nobody', async () => {
    request.mockResolvedValue([LAPTOP]);
    await expect(listTokens('h')).resolves.toEqual([LAPTOP]);
    expect(request).toHaveBeenCalledWith(TOKENS.list, {});
  });

  it('names somebody else when given', async () => {
    request.mockResolvedValue([]);
    await listTokens('h', 'bob');
    expect(request).toHaveBeenCalledWith(TOKENS.list, { user: 'bob' });
  });

  it('refuses an answer that is not a list of tokens', async () => {
    request.mockResolvedValue([{ id: 't1' }]);
    await expect(listTokens('h')).rejects.toThrow('answered no list of tokens');
  });
});

describe('mintToken', () => {
  it('sends only what was asked for', async () => {
    request.mockResolvedValue({ ...LAPTOP, secret: 's3cret' });
    await expect(mintToken('h', { label: 'laptop', grants: ['proxy:write'] })).resolves.toMatchObject({ secret: 's3cret' });
    expect(request).toHaveBeenCalledWith(TOKENS.mint, { label: 'laptop', grants: ['proxy:write'] });
  });

  it('sends the user and the expiry when given', async () => {
    request.mockResolvedValue({ ...LAPTOP, user: 'bob', secret: 's' });
    await mintToken('h', { user: 'bob', expires: 1_770_000_000_000 });
    expect(request).toHaveBeenCalledWith(TOKENS.mint, { user: 'bob', expires: 1_770_000_000_000 });
  });

  it('refuses an answer without its secret', async () => {
    request.mockResolvedValue(LAPTOP);
    await expect(mintToken('h', {})).rejects.toThrow('answered no token with a secret');
  });
});

describe('revokeToken', () => {
  it('sends the id, and the user when given', async () => {
    request.mockResolvedValue({});
    await revokeToken('h', 't1');
    expect(request).toHaveBeenLastCalledWith(TOKENS.revoke, { id: 't1' });
    await revokeToken('h', 't1', 'bob');
    expect(request).toHaveBeenLastCalledWith(TOKENS.revoke, { id: 't1', user: 'bob' });
  });
});
