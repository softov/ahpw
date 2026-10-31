import type { Notification, NotificationChannel } from './types.js';

/** The types worth a browser notification while the reader is away. */
export const ALERT_TYPES = new Set(['attention', 'action.finished', 'connection.lost']);

/** How long the window is unfocused before the reader counts as away. */
const AWAY_AFTER_MS = 60_000;

function supported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

/** Whether the browser would still ask for permission. */
export function canAsk(): boolean {
  return supported() && window.Notification.permission === 'default';
}

export function granted(): boolean {
  return supported() && window.Notification.permission === 'granted';
}

/** Ask the browser for permission. Only from a command somebody ran. */
export async function requestAlerts(): Promise<NotificationPermission> {
  if (!supported()) return 'denied';
  return window.Notification.requestPermission();
}

/** Whether a notification is one an alert channel shows: an alert type, with its `alert` text. */
export const isAlert = (notification: Notification): boolean => ALERT_TYPES.has(notification.type) && notification.alert !== undefined;

/**
 * Whether the reader is away: the tab hidden, or the window unfocused for a
 * minute. `back` runs each time the window gets focus again.
 */
export function watchAway(back: () => void = () => undefined): { away(): boolean; dispose(): void } {
  let leftAt: number | null = typeof document === 'undefined' || document.hasFocus() ? null : Date.now();
  const onBlur = (): void => {
    leftAt ??= Date.now();
  };
  const onFocus = (): void => {
    leftAt = null;
    back();
  };
  window.addEventListener('blur', onBlur);
  window.addEventListener('focus', onFocus);
  return {
    away: () => document.visibilityState === 'hidden' || (leftAt !== null && Date.now() - leftAt >= AWAY_AFTER_MS),
    dispose: () => {
      window.removeEventListener('blur', onBlur);
      window.removeEventListener('focus', onFocus);
    },
  };
}

/**
 * Browser notifications, for a reader who is away. Only a notification with an
 * `alert` is shown, and only its `alert` text leaves the page.
 */
export function createBrowserChannel(): NotificationChannel & { dispose(): void } {
  const live = new Map<string, globalThis.Notification>();
  const reader = watchAway(() => {
    for (const shown of live.values()) shown.close();
    live.clear();
  });

  return {
    id: 'browser',
    handles: isAlert,
    available: () => granted() && reader.away(),
    present: (notification) => {
      const alert = notification.alert;
      if (alert === undefined) return;
      // Tagged by source, so the system replaces a repeat rather than stacking it.
      const shown = new window.Notification(alert.title, {
        ...(alert.body === undefined ? {} : { body: alert.body }),
        tag: notification.source ?? notification.id,
      });
      shown.onclick = () => {
        window.focus();
        shown.close();
      };
      live.set(notification.id, shown);
    },
    retract: (id) => {
      live.get(id)?.close();
      live.delete(id);
    },
    dispose: () => {
      reader.dispose();
      for (const shown of live.values()) shown.close();
      live.clear();
    },
  };
}
