import type { Disposable } from '@softov/scena/types';

export type NotificationTone = 'info' | 'success' | 'warning' | 'danger';

export type NotificationAnimation = 'slide-up' | 'pop';

/** How long a notification stays when nothing is said about it. */
export const DISMISS_AFTER_MS = 2_000;

/** How long one with something to read stays: a failure, a warning. */
export const DISMISS_SLOW_MS = 8_000;

/** A button on a notification: a registered command, so the record stays plain data. */
export interface NotificationAction {
  label: string;
  command: string;
  args?: unknown;
  /** Close the notification once the command ran. Default true. */
  dismisses?: boolean;
}

export interface Notification {
  id: string;
  /** What kind of event this is; a channel decides from it whether it wants it. `default` when unclassified. */
  type: string;
  tone: NotificationTone;
  icon?: string;
  title: string;
  description?: string;
  /** Long text, folded by default: a stack, a raw answer. */
  detail?: string;
  actions?: NotificationAction[];
  /** What may be shown outside the page, by the browser. Without it, nothing is. */
  alert?: { title: string; body?: string };
  /** Whether it takes itself away. Default true. */
  dismissAuto?: boolean;
  /** How long it stays when it takes itself away. Default `DISMISS_AFTER_MS`. */
  dismissTime?: number;
  /** How it arrives. Default is the toaster's own. */
  animation?: NotificationAnimation;
  /** Who raised it. Repeats from one source collapse into one entry with a count. */
  source?: string;
  at: string;
  /** How many times this same notification was raised. */
  count: number;
}

export type NotificationInput = Omit<Notification, 'id' | 'at' | 'count'> & Partial<Pick<Notification, 'id'>>;

/** Somewhere a notification is shown. Every channel that wants one shows it. */
export interface NotificationChannel {
  id: string;
  /** Which notifications this channel wants. Absent means all. */
  handles?: (notification: Notification) => boolean;
  /** False when it cannot be used now: no permission, the tab in front. */
  available(): boolean;
  present(notification: Notification): void;
  /** Called when the notification is dismissed elsewhere. */
  retract?(id: string): void;
}

export interface Notifications {
  publish(input: NotificationInput): string;
  dismiss(id: string): void;
  /** Stop one entry's clock while somebody reads it. */
  hold(id: string): void;
  /** Start its clock again, from the top. */
  release(id: string): void;
  /** Change an entry still on screen: progress, a count. */
  update(id: string, patch: Partial<Omit<Notification, 'id'>>): void;
  list(): Notification[];
  /** What was said, newest first, dismissed or not. Bounded by `HISTORY_LIMIT`. */
  history(): Notification[];
  /** Empty the history. What is on screen stays. */
  forget(): void;
  channels: { register(channel: NotificationChannel): Disposable };
}
