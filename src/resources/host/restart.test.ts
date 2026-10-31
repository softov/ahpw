import { beforeEach, describe, expect, it, vi } from 'vitest';
import { restartWithNotice } from './restart.js';

const { confirm, restartHost } = vi.hoisted(() => ({ confirm: vi.fn(), restartHost: vi.fn() }));

vi.mock('../../shell/notify/index.js', () => ({ confirm }));
vi.mock('../../shell/notify/say.js', () => ({ done: vi.fn(), failed: vi.fn() }));
vi.mock('../../bridges/restart.js', () => ({ restartHost, mayForce: () => true }));

beforeEach(() => {
  confirm.mockReset();
  restartHost.mockReset().mockResolvedValue({ restarting: true, pid: 7 });
});

describe('restarting from the page', () => {
  it('asks first, and restarts nothing on a no', async () => {
    confirm.mockResolvedValue(false);
    await restartWithNotice('h');
    expect(confirm).toHaveBeenCalledOnce();
    expect(restartHost).not.toHaveBeenCalled();
    confirm.mockResolvedValue(true);
    await restartWithNotice('h');
    expect(restartHost).toHaveBeenCalledWith('h', false);
  });

  it('does not ask again for Restart anyway', async () => {
    await restartWithNotice('h', true);
    expect(confirm).not.toHaveBeenCalled();
    expect(restartHost).toHaveBeenCalledWith('h', true);
  });
});
