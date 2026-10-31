import type { EmbedNotifications } from '../embed/index.js';
import { isAlert, watchAway } from './browser-channel.js';
import type { NotificationChannel } from './types.js';

/**
 * The embedder's native notifications, for a reader who is away. It takes the
 * alerts the browser channel would show, and only their `alert` text.
 */
export function createEmbedChannel(notifications: EmbedNotifications): NotificationChannel & { dispose(): void } {
  const reader = watchAway();

  return {
    id: 'embed',
    handles: isAlert,
    available: () => reader.away(),
    present: (notification) => {
      const alert = notification.alert;
      if (alert === undefined) return;
      // Tagged by source, as the browser channel is, so a repeat replaces the one shown.
      notifications.show({ title: alert.title, ...(alert.body === undefined ? {} : { body: alert.body }), tag: notification.source ?? notification.id });
    },
    dispose: () => reader.dispose(),
  };
}
