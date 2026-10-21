/**
 * What a host says each usage pool was charged, and the records behind it.
 *
 * ahpd answers usage by the `x-ahpd/usage/<name>` commands, and the same
 * values through its `usage:` scheme for a host that offers no command: the
 * root lists the pools, `usage://<pool>` reads its day, week and month, and
 * its `range` and `records` leaves a range's total and records. A pool is one
 * encoded path segment, since a pool key holds colons: `project:web:site` is
 * `usage://project%3Aweb%3Asite`. Usage has no channel; a page asks when it
 * shows.
 */

import type { UsageEntry, UsageKey, UsageNamedGroup, UsagePeriods, UsagePool, UsageTotal } from '@ahpd/sdk';
import { hostBridge, ROOT } from './data.js';
import type { Offers } from './offers.js';

export type { UsageEntry, UsageKey, UsageNamedGroup, UsagePeriods, UsagePool, UsageTotal };

const METHODS = {
  pools: 'x-ahpd/usage/pools',
  totals: 'x-ahpd/usage/totals',
  range: 'x-ahpd/usage/range',
  records: 'x-ahpd/usage/records',
  groups: 'x-ahpd/usage/groups',
} as const;

/** Two days, as `2026-10-01`; a bound left out is the first of the month, or now. */
export interface DayRange {
  from?: string;
  until?: string;
}

/** Whether a host keeps usage: it offers the commands, or the `usage` scheme. */
export function servesUsage(offers: Offers): boolean {
  return offers.methods.includes(METHODS.pools) || offers.providers.usage !== undefined;
}

/** The URI of a pool, or of a leaf under it, under the root the host names for the scheme; a query value left out is not sent. */
export function usageUri(offers: Offers, pool: string, leaf?: string, query: Record<string, string | undefined> = {}): string {
  const root = offers.providers.usage?.root ?? 'usage://';
  const asked = new URLSearchParams(Object.entries(query).filter((one): one is [string, string] => one[1] !== undefined)).toString();
  return `${root.endsWith('/') ? root : `${root}/`}${encodeURIComponent(pool)}${leaf === undefined ? '' : `/${leaf}`}${asked === '' ? '' : `?${asked}`}`;
}

/** The days of a range as a command's params, each only when given. */
const rangeParams = (range: DayRange | undefined): DayRange => ({
  ...(range?.from === undefined ? {} : { from: range.from }),
  ...(range?.until === undefined ? {} : { until: range.until }),
});

/** One usage answer: the command where the host offers it, else the `usage:` read it stands for, parsed. */
async function ask(host: string, offers: Offers, method: string, params: Record<string, unknown>, uri: string): Promise<unknown> {
  const bridge = hostBridge(host);
  if (offers.methods.includes(method)) return bridge.request(method as never, params as never);
  const { text } = await bridge.readText(uri);
  if (text === null) throw new Error(`${uri} did not read as text`);
  return JSON.parse(text) as unknown;
}

const listOf = <T>(value: unknown, what: string): T[] => {
  if (!Array.isArray(value)) throw new Error(`The host's ${what} is not a list`);
  return value as T[];
};

/** What a pool key names, by its prefix: `user`, `team`, `project`, `root`, or the whole key. */
export function poolKind(pool: string): string {
  const cut = pool.indexOf(':');
  return cut < 0 ? pool : pool.slice(0, cut);
}

/** The user, team or project a pool is kept for, by the domain whose page opens it. */
export interface PoolOwner {
  domain: 'users' | 'teams' | 'projects';
  id: string;
}

/**
 * Who a pool's key names: `user:<id>`, `team:<id>`, or `project:<team>:<id>`,
 * whose page is the project's. Undefined for any other pool, such as `root`.
 */
export function poolOwner(pool: string): PoolOwner | undefined {
  const [kind, ...rest] = pool.split(':');
  if (kind === 'user' && rest.length === 1 && rest[0] !== '') return { domain: 'users', id: rest[0]! };
  if (kind === 'team' && rest.length === 1 && rest[0] !== '') return { domain: 'teams', id: rest[0]! };
  if (kind === 'project' && rest.length === 2 && rest[1] !== '') return { domain: 'projects', id: rest[1]! };
  return undefined;
}

/** The pools something was charged to that this person may read. */
export async function usagePools(host: string, offers: Offers): Promise<UsagePool[]> {
  const bridge = hostBridge(host);
  if (offers.methods.includes(METHODS.pools)) return listOf<UsagePool>(await bridge.request(METHODS.pools as never, {} as never), 'pools');
  // A listing names each pool by its key, and nothing more.
  const listed = await bridge.request('resourceList' as never, { channel: ROOT, uri: offers.providers.usage?.root ?? 'usage://' } as never) as { entries?: unknown };
  return listOf<{ name: string }>(listed.entries, 'pools').map(({ name }) => ({ pool: name, kind: poolKind(name), name }));
}

/** A pool's day, week and month. */
export async function usagePeriods(host: string, offers: Offers, pool: string): Promise<UsagePeriods> {
  return await ask(host, offers, METHODS.totals, { pool }, usageUri(offers, pool)) as UsagePeriods;
}

/** A pool's total over a range. */
export async function usageRange(host: string, offers: Offers, pool: string, range: DayRange): Promise<UsageTotal> {
  return await ask(host, offers, METHODS.range, { pool, ...rangeParams(range) }, usageUri(offers, pool, 'range', { ...range })) as UsageTotal;
}

/** The records charged to a pool over a range, newest first; at most the newest 200. */
export async function usageRecords(host: string, offers: Offers, pool: string, range?: DayRange): Promise<UsageEntry[]> {
  return listOf<UsageEntry>(await ask(host, offers, METHODS.records, { pool, ...rangeParams(range) }, usageUri(offers, pool, 'records', { ...range })), 'records');
}

/** The records this person may read over a range, summed by these keys. */
export async function usageGroups(host: string, offers: Offers, by: readonly UsageKey[], range: DayRange): Promise<UsageNamedGroup[]> {
  const uri = usageUri(offers, 'groups', undefined, { by: by.length === 0 ? undefined : by.join(','), ...range });
  return listOf<UsageNamedGroup>(await ask(host, offers, METHODS.groups, { ...(by.length === 0 ? {} : { by }), ...rangeParams(range) }, uri), 'groups');
}

/** A local day as `YYYY-MM-DD`. */
export function dayOf(at: Date): string {
  return `${String(at.getFullYear())}-${String(at.getMonth() + 1).padStart(2, '0')}-${String(at.getDate()).padStart(2, '0')}`;
}

export type Period = 'day' | 'week' | 'month' | 'range';

/** The days a period covers, as a grouped read is bounded: today, or this week from Monday; the month is the host's own default. */
export function periodRange(period: Period, range: DayRange, now: Date): DayRange {
  if (period === 'day') return { from: dayOf(now) };
  if (period === 'week') return { from: dayOf(new Date(now.getFullYear(), now.getMonth(), now.getDate() - ((now.getDay() + 6) % 7))) };
  return period === 'range' ? range : {};
}

/** The words a total is shown in; a measure the host left out is absent. */
export interface TotalWords {
  cost?: string;
  tokens?: string;
  calls?: string;
  hours?: string;
}

/**
 * A total as a person reads it, in their locale. The cost is `usd`, what the
 * pool was charged; with calls and no cost, no price was known, so none shows.
 */
export function totalWords(total: UsageTotal, locale: string): TotalWords {
  const usd = total.usd ?? ((total.calls ?? 0) > 0 ? undefined : 0);
  return {
    ...(usd === undefined ? {} : { cost: new Intl.NumberFormat(locale, { style: 'currency', currency: 'USD' }).format(usd) }),
    ...(total.tokens === undefined ? {} : { tokens: new Intl.NumberFormat(locale, { notation: 'compact' }).format(total.tokens) }),
    ...(total.calls === undefined ? {} : { calls: total.calls.toLocaleString(locale) }),
    ...(total.hours === undefined ? {} : { hours: new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(total.hours) }),
  };
}
