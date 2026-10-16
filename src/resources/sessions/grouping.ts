import type { SessionSummary } from '@microsoft/agent-host-protocol';
import { translate } from '@softov/scena';
import { folderLabel } from '../../bridges/words.js';
import { activityOf, isArchived, isRead } from './status.js';

/** What the session list is grouped by. */
export type Grouping = 'none' | 'folder' | 'status' | 'agent';

export const GROUPINGS: readonly Grouping[] = ['none', 'folder', 'status', 'agent'];

/** Where the chosen grouping is kept, per browser. */
const GROUPING_KEY = 'ahpd-web.session-grouping';

export function readGrouping(): Grouping {
  try {
    const held = localStorage.getItem(GROUPING_KEY);
    return GROUPINGS.some((one) => one === held) ? held as Grouping : 'none';
  } catch {
    return 'none';
  }
}

export function writeGrouping(grouping: Grouping): void {
  try {
    localStorage.setItem(GROUPING_KEY, grouping);
  } catch {
    // Not kept, which only means the next visit starts ungrouped.
  }
}

/** The words a grouping is offered with. */
export const groupingLabel = (grouping: Grouping): string => translate(`sessions/grouping/${grouping}`);

/** A group a session falls in. */
export interface Group {
  key: string;
  label: string;
}

/** Status groups, in the order they are shown: what needs a person first. Each one's label is `sessions/status/<key>`. */
const STATUS = ['input', 'running', 'error', 'unread', 'idle', 'archived'] as const;

const statusGroup = (key: (typeof STATUS)[number]): Group => ({ key, label: translate(`sessions/status/${key}`) });

function statusOf(session: SessionSummary): Group {
  if (isArchived(session.status)) return statusGroup('archived');
  const activity = activityOf(session.status);
  if (activity === 'idle' && !isRead(session.status)) return statusGroup('unread');
  return statusGroup(activity);
}

/** The group of one session, or undefined when the list is not grouped. */
export function groupOf(session: SessionSummary, by: Grouping, agentName: (provider: string) => string): Group | undefined {
  switch (by) {
    case 'none':
      return undefined;
    case 'status':
      return statusOf(session);
    case 'agent':
      return { key: session.provider, label: agentName(session.provider) };
    case 'folder': {
      const folder = session.workingDirectories?.[0];
      return folder === undefined ? { key: '', label: translate('sessions/grouping/noFolder') } : { key: folder, label: folderLabel(folder) };
    }
  }
}

/**
 * Sessions in the order a grouped list shows them: group by group, each
 * keeping the order it was given. Status groups go in their fixed order; the
 * others in the order of their first session, so the busiest comes first.
 */
export function arrange<T>(items: readonly T[], groupFor: (item: T) => Group | undefined, by: Grouping): T[] {
  if (by === 'none') return [...items];
  const rank = new Map<string, number>();
  if (by === 'status') STATUS.forEach((key, index) => rank.set(key, index));
  for (const item of items) {
    const key = groupFor(item)?.key ?? '';
    if (!rank.has(key)) rank.set(key, rank.size + STATUS.length);
  }
  return items
    .map((item, index) => ({ item, index, rank: rank.get(groupFor(item)?.key ?? '')! }))
    .sort((a, b) => a.rank - b.rank || a.index - b.index)
    .map((one) => one.item);
}
