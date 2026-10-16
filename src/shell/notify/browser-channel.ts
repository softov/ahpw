import type { NotificationChannel } from './types.js';

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

/**
 * Browser notifications, for a reader who is not looking at the tab: the tab
 * hidden, or the window unfocused for a minute. Only a notification with an
 * `alert` is shown, and only its `alert` text leaves the page.
 */
export function createBrowserChannel(): NotificationChannel & { dispose(): void } {
  let leftAt: number | null = typeof document === 'undefined' || document.hasFocus() ? null : Date.now();
  const live = new Map<string, globalThis.Notification>();

  const onBlur = (): void => {
    leftAt ??= Date.now();
  };
  const onFocus = (): void => {
    leftAt = null;
    for (const shown of live.values()) shown.close();
    live.clear();
  };
  window.addEventListener('blur', onBlur);
  window.addEventListener('focus', onFocus);

  return {
    id: 'browser',
    handles: (notification) => ALERT_TYPES.has(notification.type) && notification.alert !== undefined,
    available: () => {
      if (!granted()) return false;
      if (document.visibilityState === 'hidden') return true;
      return leftAt !== null && Date.now() - leftAt >= AWAY_AFTER_MS;
    },
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
      window.removeEventListener('blur', onBlur);
      window.removeEventListener('focus', onFocus);
      for (const shown of live.values()) shown.close();
      live.clear();
    },
  };
}
