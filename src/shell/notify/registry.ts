import type { BindingPath, ReactiveStore } from '@softov/scena/types';
import { DISMISS_AFTER_MS, type Notification, type NotificationChannel, type NotificationInput, type Notifications } from './types.js';

/** The notifications on screen, newest first. */
export const NOTIFICATIONS = '$/notify/list' as BindingPath;
/** How many are on screen. */
export const NOTIFICATION_COUNT = '$/notify/count' as BindingPath;
/** Everything said this session, newest first, dismissed or not. */
export const NOTIFICATION_HISTORY = '$/notify/history' as BindingPath;

/** How many entries the history keeps. */
export const HISTORY_LIMIT = 100;

/** What a reader would call the same line: two of them are one, raised twice. */
function fingerprint(input: NotificationInput): string {
  return [input.source ?? '', input.type, input.title, input.description ?? ''].join(' ');
}

/**
 * The registry: the list in the store, each entry handed to every channel that
 * wants it. It owns each entry's lifetime, so a toast that re-mounts does not
 * restart its clock and nothing outlives its time when no toaster is drawn.
 */
export function createNotifications(store: ReactiveStore): Notifications {
  const channels = new Map<string, NotificationChannel>();
  const timers = new Map<string, ReturnType<typeof setTimeout>>();
  const holds = new Set<string>();
  let live: Notification[] = [];
  let past: Notification[] = [];
  let sequence = 0;

  function commit(next: Notification[]): void {
    live = next;
    store.set(NOTIFICATIONS, [...live]);
    store.set(NOTIFICATION_COUNT, live.length);
  }

  function remember(notification: Notification): void {
    past = [notification, ...past.filter((entry) => entry.id !== notification.id)].slice(0, HISTORY_LIMIT);
    store.set(NOTIFICATION_HISTORY, [...past]);
  }

  function deliver(notification: Notification): void {
    for (const channel of channels.values()) {
      if (channel.handles !== undefined && !channel.handles(notification)) continue;
      if (!channel.available()) continue;
      try {
        channel.present(notification);
      } catch {
        // One channel failing does not keep the others from showing it.
      }
    }
  }

  function stopTimer(id: string): void {
    const timer = timers.get(id);
    if (timer === undefined) return;
    clearTimeout(timer);
    timers.delete(id);
  }

  function startTimer(notification: Notification): void {
    stopTimer(notification.id);
    if (notification.dismissAuto === false || holds.has(notification.id)) return;
    timers.set(notification.id, setTimeout(() => {
      timers.delete(notification.id);
      dismiss(notification.id);
    }, notification.dismissTime ?? DISMISS_AFTER_MS));
  }

  function dismiss(id: string): void {
    stopTimer(id);
    holds.delete(id);
    if (!live.some((entry) => entry.id === id)) return;
    commit(live.filter((entry) => entry.id !== id));
    for (const channel of channels.values()) channel.retract?.(id);
  }

  return {
    publish(input) {
      // By id when the publisher named one, so a notice whose words change keeps one entry.
      const existing = input.id === undefined
        ? live.find((entry) => fingerprint(entry) === fingerprint(input))
        : live.find((entry) => entry.id === input.id);
      if (existing !== undefined) {
        const raised: Notification = { ...existing, ...input, id: existing.id, count: existing.count + 1, at: new Date().toISOString() };
        commit([raised, ...live.filter((entry) => entry.id !== existing.id)]);
        remember(raised);
        deliver(raised);
        startTimer(raised);
        return raised.id;
      }
      sequence += 1;
      const notification: Notification = { ...input, id: input.id ?? `n${sequence}`, at: new Date().toISOString(), count: 1 };
      commit([notification, ...live]);
      remember(notification);
      deliver(notification);
      startTimer(notification);
      return notification.id;
    },

    dismiss,

    hold(id) {
      holds.add(id);
      stopTimer(id);
    },

    release(id) {
      if (!holds.delete(id)) return;
      const found = live.find((entry) => entry.id === id);
      if (found !== undefined) startTimer(found);
    },

    update(id, patch) {
      const found = live.find((entry) => entry.id === id);
      if (found === undefined) return;
      const updated = { ...found, ...patch, id };
      commit(live.map((entry) => (entry.id === id ? updated : entry)));
      remember(updated);
      deliver(updated);
      startTimer(updated);
    },

    list: () => [...live],

    history: () => [...past],

    forget() {
      past = [];
      store.set(NOTIFICATION_HISTORY, []);
    },

    channels: {
      register(channel) {
        channels.set(channel.id, channel);
        return { dispose: () => void channels.delete(channel.id) };
      },
    },
  };
}
