import type { SessionSummary } from '@microsoft/agent-host-protocol';
import { translate } from '@softov/scena';
import { folderLabel } from '../../bridges/words.js';
import { dayGroup, weekGroup } from './days.js';
import { activityOf, isArchived, isRead } from './status.js';

/** What the session list is grouped by; `host` only in a window with every host. */
export type Grouping = 'none' | 'folder' | 'status' | 'agent' | 'host' | 'day' | 'week';

export const GROUPINGS: readonly Grouping[] = ['none', 'folder', 'status', 'agent', 'host', 'day', 'week'];

/** Where the first and the second grouping are kept, per browser. */
const GROUPING_KEY = 'ahpd-web.session-grouping';
const THEN_BY_KEY = 'ahpd-web.session-then-by';

function read(key: string): Grouping {
  try {
    const held = localStorage.getItem(key);
    return GROUPINGS.some((one) => one === held) ? held as Grouping : 'none';
  } catch {
    return 'none';
  }
}

function write(key: string, grouping: Grouping): void {
  try {
    localStorage.setItem(key, grouping);
  } catch {
    // Not kept, which only means the next visit starts ungrouped.
  }
}

export const readGrouping = (): Grouping => read(GROUPING_KEY);
export const writeGrouping = (grouping: Grouping): void => write(GROUPING_KEY, grouping);
export const readThenBy = (): Grouping => read(THEN_BY_KEY);
export const writeThenBy = (grouping: Grouping): void => write(THEN_BY_KEY, grouping);

/** The words a grouping is offered with. */
export const groupingLabel = (grouping: Grouping): string => translate(`sessions/grouping/${grouping}`);

/** A group a session falls in; `rank` fixes its place, as status and time groups have one, and the others go in the order of their first row. */
export interface Group {
  key: string;
  label: string;
  rank?: number;
}

/** Status groups, in the order they are shown: what needs a person first. Each one's label is `sessions/status/<key>`. */
const STATUS = ['input', 'running', 'error', 'unread', 'idle', 'archived'] as const;

const statusGroup = (key: (typeof STATUS)[number]): Group => ({ key, label: translate(`sessions/status/${key}`), rank: STATUS.indexOf(key) });

function statusOf(session: SessionSummary): Group {
  if (isArchived(session.status)) return statusGroup('archived');
  const activity = activityOf(session.status);
  if (activity === 'idle' && !isRead(session.status)) return statusGroup('unread');
  return statusGroup(activity);
}

/** The group of one session on its host, or undefined when the list is not grouped. */
export function groupOf(session: SessionSummary, by: Grouping, agentName: (provider: string) => string, host: Group, now = new Date()): Group | undefined {
  switch (by) {
    case 'none':
      return undefined;
    case 'host':
      return host;
    case 'status':
      return statusOf(session);
    case 'agent':
      return { key: session.provider, label: agentName(session.provider) };
    case 'day':
      return dayGroup(session.modifiedAt, now);
    case 'week':
      return weekGroup(session.modifiedAt, now);
    case 'folder': {
      const folder = session.workingDirectories?.[0];
      return folder === undefined ? { key: '', label: translate('sessions/grouping/noFolder') } : { key: folder, label: folderLabel(folder) };
    }
  }
}

/**
 * Sessions in the order a grouped list shows them: group by group, each
 * keeping the order it was given. A group with a rank goes in its place; the
 * others in the order of their first session, after the ranked ones.
 */
export function arrange<T>(items: readonly T[], groupFor: (item: T) => Group | undefined): T[] {
  const RANKED = 1_000_000;
  const order = new Map<string, number>();
  for (const item of items) {
    const group = groupFor(item);
    const key = group?.key ?? '';
    if (!order.has(key)) order.set(key, group?.rank ?? RANKED + order.size);
  }
  return items
    .map((item, index) => ({ item, index, rank: order.get(groupFor(item)?.key ?? '')! }))
    .sort((a, b) => a.rank - b.rank || a.index - b.index)
    .map((one) => one.item);
}

/** Sessions grouped by `first`, then within each group by `second`: arranged by the second key, then, keeping that order, by the first. */
export function arrangeTwo<T>(items: readonly T[], first: (item: T) => Group | undefined, second?: (item: T) => Group | undefined): T[] {
  return arrange(second === undefined ? items : arrange(items, second), first);
}
