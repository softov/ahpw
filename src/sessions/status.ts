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

/** The words a session's activity is shown with. */
export const ACTIVITY_LABEL: Record<Activity, string> = {
  input: 'Needs you',
  running: 'Running',
  error: 'Failed',
  idle: 'Idle',
};

/** The badge tone of an activity. */
export const ACTIVITY_TONE: Record<Activity, 'warning' | 'info' | 'danger' | 'default'> = {
  input: 'warning',
  running: 'info',
  error: 'danger',
  idle: 'default',
};

/** The counts the Sessions icon carries: sessions not archived, and those with a turn running. */
export function countsOf(statuses: readonly number[]): { open: number; working: number } {
  let open = 0;
  let working = 0;
  for (const status of statuses) {
    if (isArchived(status)) continue;
    open += 1;
    if (activityOf(status) === 'running' || activityOf(status) === 'input') working += 1;
  }
  return { open, working };
}
