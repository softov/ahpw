import { translate } from '@softov/scena';

/**
 * The session status bitset, read as one activity.
 *
 * `SessionStatus` is an ambient `const enum` in the protocol's declarations,
 * so its wire values are spelled out here. `InputNeeded` (24) carries
 * `InProgress` (8), so it is tested first and as a whole.
 */

/** The session ended with an error. */
const ERROR = 1 << 1;
/** A turn is running. */
const IN_PROGRESS = 1 << 3;
/** A turn is running and waits for a person. */
const INPUT_NEEDED = IN_PROGRESS | (1 << 4);
/** The client has read the session since it last changed. */
const IS_READ = 1 << 5;
/** The session is archived. */
const IS_ARCHIVED = 1 << 6;

/** What a session is doing, most urgent first. */
export type Activity = 'input' | 'running' | 'error' | 'idle';

export function activityOf(status: number): Activity {
  if ((status & INPUT_NEEDED) === INPUT_NEEDED) return 'input';
  if ((status & IN_PROGRESS) !== 0) return 'running';
  if ((status & ERROR) !== 0) return 'error';
  return 'idle';
}

export function isRead(status: number): boolean {
  return (status & IS_READ) !== 0;
}

export function isArchived(status: number): boolean {
  return (status & IS_ARCHIVED) !== 0;
}

/** Which sessions the list shows, as the Sessions icon counts them: idle and not read, idle and read, or at work. */
export type SessionShow = 'all' | 'unread' | 'read' | 'running';

export const SESSION_SHOWS: readonly SessionShow[] = ['all', 'unread', 'read', 'running'];

/** Whether the list shows a session of this status; at work is running, or waiting on the person mid-turn. */
export function shows(status: number, show: SessionShow): boolean {
  const activity = activityOf(status);
  switch (show) {
    case 'all':
      return true;
    case 'unread':
      return activity === 'idle' && !isRead(status);
    case 'read':
      return activity === 'idle' && isRead(status);
    case 'running':
      return activity === 'running' || activity === 'input';
  }
}

/** The words a session's activity is shown with. */
export const activityLabel = (activity: Activity): string => translate(`sessions/status/${activity}`);

/** The badge tone of an activity. */
export const ACTIVITY_TONE: Record<Activity, 'warning' | 'info' | 'danger' | 'default'> = {
  input: 'warning',
  running: 'info',
  error: 'danger',
  idle: 'default',
};

/** The counts the Sessions icon carries: sessions idle and not read, and those with a turn running. Archived ones count for neither. */
export function countsOf(statuses: readonly number[]): { unread: number; working: number } {
  let unread = 0;
  let working = 0;
  for (const status of statuses) {
    if (isArchived(status)) continue;
    const activity = activityOf(status);
    if (activity === 'idle' && !isRead(status)) unread += 1;
    if (activity === 'running' || activity === 'input') working += 1;
  }
  return { unread, working };
}
