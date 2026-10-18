import type { BindingPath } from '@softov/scena/types';
import { dayOf, type DayRange, type Period, type UsageKey } from '../../bridges/usage.js';

/** Whether any host this page connects to keeps usage; the activity bar entry shows while one does. */
export const USAGE_SERVED = '$/ahp/usage/served' as BindingPath;

/** The pool open in `main`, as `{ host, pool }`. */
export const ACTIVE_POOL = '$/ahp/usage/active' as BindingPath;

/** The list's period; null while it is the usual one, this month. */
export const USAGE_PERIOD = '$/ahp/usage/period' as BindingPath;

/** The keys the list sums by, together, in `USAGE_GROUPS`' order; null while it lists the pools. */
export const USAGE_GROUP = '$/ahp/usage/group' as BindingPath;

/** The days the list reads while its period is a range. */
export const USAGE_RANGE = '$/ahp/usage/range' as BindingPath;

/** Bumped by reload, since usage has no channel to say it changed. */
export const USAGE_ASKED = '$/ahp/usage/asked' as BindingPath;

export const USAGE_PERIODS: readonly Period[] = ['day', 'week', 'month', 'range'];
export const USAGE_GROUPS: readonly UsageKey[] = ['user', 'team', 'project'];
export const CHOICE_KEYS = { period: 'ahpd-web.usage-period', group: 'ahpd-web.usage-group' } as const;

/** The days a range starts on: the first of this month to today. */
export function monthSoFar(now: Date): Required<DayRange> {
  return { from: dayOf(new Date(now.getFullYear(), now.getMonth(), 1)), until: dayOf(now) };
}

/** A pool's tab key: one tab each. */
export const poolTab = (host: string, pool: string): string => `usage:${host}:${pool}`;
