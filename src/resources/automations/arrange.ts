import { translate } from '@softov/scena';
import { dateFormat } from '../../i18n/locales.js';
import type { Group } from '../sessions/grouping.js';
import type { AutomationState } from './words.js';

/** What the automations list is grouped by, sorted by, and filtered to; as ahpapp's list offers. */
export type AutoGroup = 'none' | 'host' | 'status' | 'next';
export type AutoSort = 'name' | 'next' | 'last';
export type AutoFilter = 'all' | AutomationState;

export const AUTO_GROUPS: readonly AutoGroup[] = ['none', 'host', 'status', 'next'];
export const AUTO_SORTS: readonly AutoSort[] = ['name', 'next', 'last'];
export const AUTO_FILTERS: readonly AutoFilter[] = ['all', 'running', 'on', 'off', 'failed'];

/** One automation as the list arranges it. */
export interface AutoItem {
  host: string;
  hostName: string;
  title: string;
  state: AutomationState;
  /** When it runs next, while it is on. */
  nextRunAt?: string;
  /** When its last run started. */
  lastRunAt?: string;
}

const DAY = 86_400_000;
const weekday = dateFormat({ weekday: 'long' });
const startOfDay = (date: Date): number => new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

/** The status groups, in the order a person reads them: what runs, what failed, then the rest. */
const STATUS_ORDER: readonly AutomationState[] = ['running', 'failed', 'on', 'off'];

/** The next-run group: Now while it runs, Overdue, Today, Tomorrow, a weekday within the week, Later, or Not scheduled. */
export function nextGroup(item: AutoItem, now: Date): Group {
  const day = (key: string, rank: number, label = translate(`automations/next/${key}`)): Group => ({ key: `next:${key}`, label, rank });
  if (item.state === 'running') return day('now', 0);
  if (item.nextRunAt === undefined) return day('none', 10);
  const date = new Date(item.nextRunAt);
  if (Number.isNaN(date.getTime())) return day('none', 10);
  if (date.getTime() < now.getTime()) return day('overdue', 1);
  const ahead = Math.round((startOfDay(date) - startOfDay(now)) / DAY);
  if (ahead === 0) return day('today', 2);
  if (ahead === 1) return day('tomorrow', 3);
  if (ahead < 7) return day(`in${ahead}`, 2 + ahead, weekday.format(date));
  return day('later', 9);
}

/** The group of one automation, or undefined when the list is not grouped. */
export function groupOf(item: AutoItem, by: AutoGroup, now = new Date()): Group | undefined {
  switch (by) {
    case 'none':
      return undefined;
    case 'host':
      return { key: item.host, label: item.hostName };
    case 'status':
      return { key: item.state, label: translate(`automations/state/${item.state}`), rank: STATUS_ORDER.indexOf(item.state) };
    case 'next':
      return nextGroup(item, now);
  }
}

/** Earlier first for the next run, latest first for the last run, A to Z for the name; one with no date goes last. */
export function sortAutomations<T>(items: readonly T[], itemOf: (one: T) => AutoItem, by: AutoSort): T[] {
  const dated = (a: string | undefined, b: string | undefined, sign: number): number =>
    a === undefined ? (b === undefined ? 0 : 1) : b === undefined ? -1 : sign * a.localeCompare(b);
  return items
    .map((one, index) => ({ one, index, item: itemOf(one) }))
    .sort((a, b) => {
      const order = by === 'next' ? dated(a.item.nextRunAt, b.item.nextRunAt, 1)
        : by === 'last' ? dated(a.item.lastRunAt, b.item.lastRunAt, -1)
          : 0;
      return order || a.item.title.localeCompare(b.item.title) || a.index - b.index;
    })
    .map((entry) => entry.one);
}

export const keeps = (item: AutoItem, filter: AutoFilter): boolean => filter === 'all' || item.state === filter;

/** Where each choice is kept, per browser. */
export const CHOICE_KEYS = { group: 'ahpd-web.automation-group', sort: 'ahpd-web.automation-sort', filter: 'ahpd-web.automation-filter' } as const;
