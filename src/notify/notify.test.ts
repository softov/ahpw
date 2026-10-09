import { afterEach, describe, expect, it, vi } from 'vitest';
import { createScena } from '@softov/scena/core';
import { NOTIFICATIONS, NOTIFICATION_HISTORY, createNotifications } from './registry.js';
import { CONFIRM_REQUEST, confirm, initConfirm, resetConfirm, settle } from './confirm.js';
import type { Notification } from './types.js';

afterEach(() => {
  vi.useRealTimers();
  resetConfirm();
});

describe('notifications', () => {
  it('lists newest first and dismisses after its time', () => {
    vi.useFakeTimers();
    const { store } = createScena();
    const notifications = createNotifications(store);
    notifications.publish({ type: 'default', tone: 'info', title: 'one' });
    notifications.publish({ type: 'default', tone: 'info', title: 'two', dismissTime: 5_000 });
    expect(store.get<Notification[]>(NOTIFICATIONS)?.map((one) => one.title)).toEqual(['two', 'one']);
    vi.advanceTimersByTime(2_000);
    expect(store.get<Notification[]>(NOTIFICATIONS)?.map((one) => one.title)).toEqual(['two']);
    expect(store.get<Notification[]>(NOTIFICATION_HISTORY)).toHaveLength(2);
  });

  it('counts a repeat instead of stacking it', () => {
    const { store } = createScena();
    const notifications = createNotifications(store);
    notifications.publish({ type: 'default', tone: 'danger', title: 'down', source: 'host', dismissAuto: false });
    notifications.publish({ type: 'default', tone: 'danger', title: 'down', source: 'host', dismissAuto: false });
    expect(notifications.list()).toHaveLength(1);
    expect(notifications.list()[0]?.count).toBe(2);
  });

  it('keeps one that is held until it is released', () => {
    vi.useFakeTimers();
    const { store } = createScena();
    const notifications = createNotifications(store);
    const id = notifications.publish({ type: 'default', tone: 'info', title: 'read me' });
    notifications.hold(id);
    vi.advanceTimersByTime(10_000);
    expect(notifications.list()).toHaveLength(1);
    notifications.release(id);
    vi.advanceTimersByTime(2_000);
    expect(notifications.list()).toHaveLength(0);
  });

  it('shows a channel only what it handles', () => {
    const { store } = createScena();
    const notifications = createNotifications(store);
    const present = vi.fn();
    notifications.channels.register({ id: 'x', handles: (one) => one.type === 'attention', available: () => true, present });
    notifications.publish({ type: 'default', tone: 'info', title: 'no' });
    notifications.publish({ type: 'attention', tone: 'warning', title: 'yes' });
    expect(present).toHaveBeenCalledTimes(1);
  });
});

describe('confirm', () => {
  it('asks in the dialog and answers with the button pressed', async () => {
    const { store } = createScena();
    initConfirm(store, 'modal');
    const answer = confirm({ title: 'Delete?', confirmLabel: 'Delete', tone: 'danger' });
    expect(store.get<{ title: string }>(CONFIRM_REQUEST)?.title).toBe('Delete?');
    settle(true);
    await expect(answer).resolves.toBe(true);
    expect(store.get(CONFIRM_REQUEST)).toBeNull();
  });

  it('answers an open question with no when a new one is asked', async () => {
    const { store } = createScena();
    initConfirm(store, 'modal');
    const first = confirm({ title: 'One?' });
    const second = confirm({ title: 'Two?' });
    await expect(first).resolves.toBe(false);
    settle(true);
    await expect(second).resolves.toBe(true);
  });
});
