import { tryNotify } from './context.js';
import { DISMISS_SLOW_MS, type NotificationAction } from './types.js';

/** What a line can carry beyond its title. */
export interface Said {
  description?: string;
  icon?: string;
  actions?: NotificationAction[];
  /** Repeats from one source collapse into a count. */
  source?: string;
  /** False to keep it until it is dismissed by hand. */
  dismissAuto?: boolean;
}

function extras(extra: Said): Said {
  return {
    ...(extra.description === undefined ? {} : { description: extra.description }),
    ...(extra.actions === undefined ? {} : { actions: extra.actions }),
    ...(extra.source === undefined ? {} : { source: extra.source }),
    ...(extra.dismissAuto === undefined ? {} : { dismissAuto: extra.dismissAuto }),
  };
}

/** Something the reader just did worked. Say what, to what: "Terminal killed", not "Done". */
export function done(title: string, extra: Said = {}): void {
  tryNotify((notifications) => {
    notifications.publish({ type: 'action.done', tone: 'success', icon: extra.icon ?? '\u{2713}', title, ...extras(extra) });
  });
}

/** Something worked only in part, or needs a look. */
export function warn(title: string, extra: Said = {}): void {
  tryNotify((notifications) => {
    notifications.publish({ type: 'attention', tone: 'warning', icon: extra.icon ?? '\u{26A0}\u{FE0E}', title, dismissTime: DISMISS_SLOW_MS, ...extras(extra) });
  });
}

/** Something failed. The error's own words are the description; its stack, the detail. */
export function failed(title: string, error: unknown, extra: Omit<Said, 'description'> = {}): void {
  const description = error instanceof Error ? error.message : String(error);
  const detail = error instanceof Error ? error.stack : undefined;
  const published = tryNotify((notifications) => {
    notifications.publish({
      type: 'action.failed',
      tone: 'danger',
      icon: extra.icon ?? '\u{26A0}\u{FE0E}',
      title,
      dismissTime: DISMISS_SLOW_MS,
      ...extras({ ...extra, description }),
      ...(detail === undefined ? {} : { detail }),
    });
  });
  if (!published) console.error(title, error);
}
