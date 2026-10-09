import type { ReactiveStore } from '@softov/scena/types';
import { createNotifications } from './registry.js';
import type { Notifications } from './types.js';

/**
 * The page's one registry. A module value, because commands, data providers
 * and menu rows reach it, and none of them are React.
 */
let shared: Notifications | undefined;

export function initNotifications(store: ReactiveStore): Notifications {
  shared ??= createNotifications(store);
  return shared;
}

/** Drop the registry, so the next sign-in starts with an empty one. */
export function resetNotifications(): void {
  shared = undefined;
}

export function getNotifications(): Notifications {
  if (shared === undefined) throw new Error('Notifications were read before initNotifications ran.');
  return shared;
}

/** Publish if the registry exists. Returns whether it did. */
export function tryNotify(publish: (notifications: Notifications) => void): boolean {
  if (shared === undefined) return false;
  try {
    publish(shared);
    return true;
  } catch {
    return false;
  }
}
