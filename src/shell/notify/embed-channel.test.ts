import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createEmbedChannel } from './embed-channel.js';
import type { Notification } from './types.js';

/** A waiting session's alert, as the sessions resource raises it. */
const waiting: Notification = {
  id: 'n1',
  type: 'attention',
  tone: 'warning',
  title: 'Waiting',
  alert: { title: 'A session waits', body: 'It asks to run a command' },
  source: 'session-alert:daemon:copilot:/s1',
  at: '2026-10-31T12:00:00.000Z',
  count: 1,
};

let visibility: 'visible' | 'hidden';

beforeEach(() => {
  visibility = 'visible';
  vi.stubGlobal('window', { addEventListener: vi.fn(), removeEventListener: vi.fn() });
  vi.stubGlobal('document', { hasFocus: () => true, get visibilityState() { return visibility; } });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('the embedder channel', () => {
  it('shows an alert while the reader is away, and none while the window has focus', () => {
    const show = vi.fn();
    const channel = createEmbedChannel({ show });
    expect(channel.available()).toBe(false);
    visibility = 'hidden';
    expect(channel.available()).toBe(true);
    channel.present(waiting);
    expect(show).toHaveBeenCalledWith({ title: 'A session waits', body: 'It asks to run a command', tag: 'session-alert:daemon:copilot:/s1' });
  });

  it('takes only alerts, as the browser channel does', () => {
    const channel = createEmbedChannel({ show: vi.fn() });
    expect(channel.handles?.(waiting)).toBe(true);
    expect(channel.handles?.({ ...waiting, type: 'default' })).toBe(false);
    const { alert: _alert, ...plain } = waiting;
    expect(channel.handles?.(plain)).toBe(false);
  });
});
