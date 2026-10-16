import { translate } from '@softov/scena';
import { dateFormat } from '../../i18n/locales.js';
import type { Group } from './grouping.js';

const DAY = 86_400_000;
const weekday = dateFormat({ weekday: 'long' });
const shortDate = dateFormat({ month: 'short', day: 'numeric' });

/** Midnight of the local day `date` falls on. */
const startOfDay = (date: Date): number => new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

/** Midnight of the Monday of the local week `date` falls on. */
const startOfWeek = (date: Date): number => startOfDay(date) - ((date.getDay() + 6) % 7) * DAY;

/** Whole days between the day of `iso` and today; a date not read, or in the future, is today. Rounded, so a summer-time day still counts as one. */
export function daysAgo(iso: string, now: Date): number {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 0;
  return Math.max(0, Math.round((startOfDay(now) - startOfDay(date)) / DAY));
}

/** Whole weeks, Monday to Sunday, between the week of `iso` and this week. */
export function weeksAgo(iso: string, now: Date): number {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 0;
  return Math.max(0, Math.round((startOfWeek(now) - startOfWeek(date)) / (7 * DAY)));
}

/** The day group of `iso`: Today, Yesterday, a weekday within the week, then Older. Its rank keeps that order whatever the list is sorted by. */
export function dayGroup(iso: string, now: Date): Group {
  const ago = daysAgo(iso, now);
  if (ago === 0) return { key: 'day:0', label: translate('sessions/grouping/today'), rank: 0 };
  if (ago === 1) return { key: 'day:1', label: translate('sessions/grouping/yesterday'), rank: 1 };
  if (ago < 7) return { key: `day:${ago}`, label: weekday.format(new Date(iso)), rank: ago };
  return { key: 'day:older', label: translate('sessions/grouping/older'), rank: 7 };
}

/** The week group of `iso`: This week, Last week, then the week of its Monday. */
export function weekGroup(iso: string, now: Date): Group {
  const ago = weeksAgo(iso, now);
  if (ago === 0) return { key: 'week:0', label: translate('sessions/grouping/thisWeek'), rank: 0 };
  if (ago === 1) return { key: 'week:1', label: translate('sessions/grouping/lastWeek'), rank: 1 };
  return { key: `week:${ago}`, label: translate('sessions/grouping/weekOf', { date: shortDate.format(startOfWeek(new Date(iso))) }), rank: ago };
}
