import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RpcError } from '@microsoft/agent-host-protocol/client';
import { NO_OFFERS } from './offers.js';
import { mayForce, mayRestart, RESTART, restartHost } from './restart.js';

const request = vi.hoisted(() => vi.fn());

vi.mock('./data.js', () => ({ hostBridge: () => ({ request }) }));

beforeEach(() => {
  request.mockReset();
});

describe('the host restart', () => {
  it('asks with no params, and with force when forced', async () => {
    request.mockResolvedValue({ restarting: true, pid: 7 });
    await expect(restartHost('h')).resolves.toEqual({ restarting: true, pid: 7 });
    expect(request).toHaveBeenLastCalledWith(RESTART, {});
    await restartHost('h', true);
    expect(request).toHaveBeenLastCalledWith(RESTART, { force: true });
  });

  it('is offered only by a host that lists the method', () => {
    expect(mayRestart(NO_OFFERS)).toBe(false);
    expect(mayRestart({ ...NO_OFFERS, methods: [RESTART] })).toBe(true);
  });

  it('offers to force a busy refusal, not a caller who may never restart', () => {
    expect(mayForce(new RpcError(-32603, 'A turn is running in s1; pass force: true to restart anyway.'))).toBe(true);
    expect(mayForce(new RpcError(-32009, 'ana may not restart the daemon.'))).toBe(false);
  });
});
