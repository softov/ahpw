import type { SessionSummary } from '@microsoft/agent-host-protocol';
import { activityOf, isArchived } from './status.js';

/** What the session list is sorted by. */
export type SortBy = 'changed' | 'created' | 'name';

export const SORT_BYS: readonly SortBy[] = ['changed', 'created', 'name'];

/** The list's order: a key, newest or oldest first for the dates, and whether sessions waiting on the person come first. */
export interface Sorting {
  by: SortBy;
  newest: boolean;
  urgent: boolean;
}

/** The order the list had before it could be sorted: last changed, newest first. */
export const DEFAULT_SORTING: Sorting = { by: 'changed', newest: true, urgent: false };

/** Where the chosen order is kept, per browser. */
const SORTING_KEY = 'ahpd-web.session-sorting';

export function readSorting(): Sorting {
  try {
    const held = JSON.parse(localStorage.getItem(SORTING_KEY) ?? 'null') as Partial<Sorting> | null;
    if (held === null || typeof held !== 'object') return DEFAULT_SORTING;
    return {
      by: SORT_BYS.some((one) => one === held.by) ? held.by as SortBy : DEFAULT_SORTING.by,
      newest: typeof held.newest === 'boolean' ? held.newest : DEFAULT_SORTING.newest,
      urgent: held.urgent === true,
    };
  } catch {
    return DEFAULT_SORTING;
  }
}

export function writeSorting(sorting: Sorting): void {
  try {
    localStorage.setItem(SORTING_KEY, JSON.stringify(sorting));
  } catch {
    // Not kept, which only means the next visit starts in the usual order.
  }
}

export const isDefaultSorting = (sorting: Sorting): boolean =>
  sorting.by === DEFAULT_SORTING.by && sorting.newest === DEFAULT_SORTING.newest && sorting.urgent === DEFAULT_SORTING.urgent;

/** How much a session waits on the person: asking first, then failed, then the rest; an archived one waits on nobody. */
function urgencyOf(session: SessionSummary): number {
  if (isArchived(session.status)) return 2;
  const activity = activityOf(session.status);
  return activity === 'input' ? 0 : activity === 'error' ? 1 : 2;
}

/**
 * Whether a session is changing now. The host moves `modifiedAt` only when a
 * turn ends, so by last change a session at work counts as the newest, or it
 * would sink below one that finished after its turn began.
 */
const changingNow = (session: SessionSummary): number => (activityOf(session.status) === 'running' ? 1 : 0);

/** The items in the list's order; a name sorts A to Z, and ties keep the order they came in. */
export function sortSessions<T>(items: readonly T[], sessionOf: (item: T) => SessionSummary, sorting: Sorting): T[] {
  const key = (session: SessionSummary): string => (sorting.by === 'created' ? session.createdAt : sorting.by === 'changed' ? session.modifiedAt : session.title.toLocaleLowerCase());
  const direction = sorting.by === 'name' || !sorting.newest ? 1 : -1;
  return items
    .map((item, index) => ({ item, index, session: sessionOf(item) }))
    .sort((a, b) =>
      (sorting.urgent ? urgencyOf(a.session) - urgencyOf(b.session) : 0)
      || (sorting.by === 'changed' ? direction * (changingNow(a.session) - changingNow(b.session)) : 0)
      || direction * key(a.session).localeCompare(key(b.session))
      || a.index - b.index)
    .map((one) => one.item);
}
