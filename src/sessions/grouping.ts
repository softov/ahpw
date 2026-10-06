import type { SessionSummary } from '@microsoft/agent-host-protocol';
import { folderLabel } from '../connection/words.js';
import { activityOf, isArchived, isRead } from './status.js';

/** What the session list is grouped by. */
export type Grouping = 'none' | 'folder' | 'status' | 'agent';

export const GROUPINGS: { id: Grouping; label: string }[] = [
  { id: 'none', label: 'No groups' },
  { id: 'folder', label: 'Group by folder' },
  { id: 'status', label: 'Group by status' },
  { id: 'agent', label: 'Group by agent' },
];

/** A group a session falls in. */
export interface Group {
  key: string;
  label: string;
}

/** Status groups, in the order they are shown: what needs a person first. */
const STATUS: Group[] = [
  { key: 'input', label: 'Needs you' },
  { key: 'running', label: 'Running' },
  { key: 'error', label: 'Failed' },
  { key: 'unread', label: 'Unread' },
  { key: 'idle', label: 'Idle' },
  { key: 'archived', label: 'Archived' },
];

function statusOf(session: SessionSummary): Group {
  if (isArchived(session.status)) return STATUS[5]!;
  const activity = activityOf(session.status);
  if (activity === 'idle' && !isRead(session.status)) return STATUS[3]!;
  return STATUS.find((one) => one.key === activity)!;
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
      return folder === undefined ? { key: '', label: 'No folder' } : { key: folder, label: folderLabel(folder) };
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
  if (by === 'status') STATUS.forEach((one, index) => rank.set(one.key, index));
  for (const item of items) {
    const key = groupFor(item)?.key ?? '';
    if (!rank.has(key)) rank.set(key, rank.size + STATUS.length);
  }
  return items
    .map((item, index) => ({ item, index, rank: rank.get(groupFor(item)?.key ?? '')! }))
    .sort((a, b) => a.rank - b.rank || a.index - b.index)
    .map((one) => one.item);
}
