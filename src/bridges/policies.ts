/**
 * A host's policies, as ahpd keeps them: who may use which agent, model and
 * computer, and how much. The rows are the records channel `x-ahpd-policies`
 * and the `policy:` scheme, whose manifest is what a form is drawn from; a
 * row's `limits` leaf answers what each limit used and when it resets. A write
 * is the `x-ahpd/policies/put` or `/remove` command where the host offers it,
 * else the resource write the command stands for. `usage://limits` answers
 * the limits that hold the signed-in person.
 */

import { AhpErrorCodes } from '@microsoft/agent-host-protocol';
import type { LimitPool, Measure, Period as LimitPeriod, Policy, PolicyKind, PolicyLimit } from '@ahpd/sdk';
import { hostBridge } from './data.js';
import { allows, type Offers } from './offers.js';
import { recordsReducer, type PeopleState } from './people.js';

export type { LimitPool, LimitPeriod, Measure, Policy, PolicyKind, PolicyLimit };

export const POLICIES = { scheme: 'policy', channel: 'x-ahpd-policies://', put: 'x-ahpd/policies/put', remove: 'x-ahpd/policies/remove' } as const;

/** The channel's scheme, as a host names it among its channels. */
export const POLICIES_CHANNEL = 'x-ahpd-policies';

/** The leaf under a row that answers its limits. */
const LIMITS = 'limits';

export type PoliciesState = PeopleState<Policy>;

export const policiesReducer = recordsReducer<Policy>(POLICIES_CHANNEL);

/** Whether a host lists its policies on the channel. */
export function servesPolicies(offers: Offers): boolean {
  return offers.channels.includes(POLICIES_CHANNEL);
}

/** Whether a host takes writes to its policies; one that does not shows them read-only. */
export function writesPolicies(offers: Offers): boolean {
  const provider = offers.providers[POLICIES.scheme];
  return provider !== undefined && allows(provider, 'write');
}

/** The JSON schema a row is written by, as the host describes the scheme; undefined where it names none. */
export function policyManifest(offers: Offers): Record<string, unknown> | undefined {
  return offers.providers[POLICIES.scheme]?.manifest;
}

/** A row's resource URI, or a leaf under it, under the root the host names for the scheme. */
export function policyUri(offers: Offers, id: string, leaf?: string): string {
  const root = offers.providers[POLICIES.scheme]?.root ?? `${POLICIES.scheme}://`;
  return `${root.endsWith('/') ? root : `${root}/`}${encodeURIComponent(id)}${leaf === undefined ? '' : `/${leaf}`}`;
}

/** Makes or edits one row, written whole; `createOnly` refuses an id the host already holds. */
export async function putPolicy(host: string, offers: Offers, id: string, record: Record<string, unknown>, createOnly: boolean): Promise<void> {
  const bridge = hostBridge(host);
  if (offers.methods.includes(POLICIES.put)) {
    await bridge.request(POLICIES.put as never, { id, record, ...(createOnly ? { createOnly } : {}) } as never);
    return;
  }
  await bridge.writeResource(policyUri(offers, id), JSON.stringify(record), 'utf-8', createOnly);
}

/** Removes one row. */
export async function removePolicy(host: string, offers: Offers, id: string): Promise<void> {
  const bridge = hostBridge(host);
  if (offers.methods.includes(POLICIES.remove)) {
    await bridge.request(POLICIES.remove as never, { id } as never);
    return;
  }
  await bridge.deleteResource(policyUri(offers, id), false);
}

/**
 * One limit with what it used and when it resets, as `policy://<id>/limits`
 * answers it. @ahpd/sdk's `LimitFigure`, which 0.12.0 does not export yet;
 * swap for it when it does.
 */
export interface LimitFigure {
  amount: number;
  measure: Measure;
  period: LimitPeriod;
  pool: LimitPool;
  /** Whether the host counts the measure yet; one it does not never closes its row. */
  counted: boolean;
  /** What the period used, when the measure is counted. */
  used?: number;
  /** Every member with a figure of their own, for an `each` limit. */
  members?: { user: string; used: number }[];
  /** The first instant of the period. */
  from: string;
  /** When the period resets; absent for `total`. */
  resets?: string;
  /** The row's `until`, when it names one. */
  ends?: string;
}

/** One row's limits, as its `limits` leaf answers them; @ahpd/sdk's `PolicyLimits`, not exported by 0.12.0. */
export interface PolicyLimits {
  id: string;
  kind: PolicyKind;
  scope: string;
  limits: LimitFigure[];
}

/** A row's limits with what each used; a host with no usage store, or older than the leaf, refuses the read. */
export async function readLimits(host: string, offers: Offers, id: string): Promise<PolicyLimits> {
  const uri = policyUri(offers, id, LIMITS);
  const { text } = await hostBridge(host).readText(uri);
  if (text === null) throw new Error(`${uri} did not read as text`);
  const answer = JSON.parse(text) as unknown;
  if (typeof answer !== 'object' || answer === null || !Array.isArray((answer as PolicyLimits).limits)) throw new Error(`${uri} answered no limits`);
  return answer as PolicyLimits;
}

/** Whether an error is the host saying the resource is not there. */
function isNotFound(error: unknown): boolean {
  return typeof error === 'object' && error !== null && (error as { code?: unknown }).code === AhpErrorCodes.NotFound;
}

/**
 * The limits that hold the signed-in person, from `usage://limits`. A host with
 * `policies.ownLimits` off answers not found, which is no limits rather than a
 * failure; any other error is the host's and is thrown.
 */
export async function ownLimits(host: string, offers: Offers): Promise<PolicyLimits[] | undefined> {
  const root = offers.providers.usage?.root ?? 'usage://';
  const uri = `${root.endsWith('/') ? root : `${root}/`}limits`;
  try {
    const { text } = await hostBridge(host).readText(uri);
    if (text === null) throw new Error(`${uri} did not read as text`);
    const answer = JSON.parse(text) as unknown;
    if (!Array.isArray(answer)) throw new Error(`${uri} answered no list`);
    return answer as PolicyLimits[];
  } catch (error) {
    if (isNotFound(error)) return undefined;
    throw error;
  }
}

/** A limit's figures as words for its meter, in a locale. */
export interface LimitWords {
  /** What the period used. Absent when the measure is not counted. */
  used?: string;
  /** How much the limit allows. */
  amount: string;
  /** The window it is counted over. */
  period: LimitPeriod;
  /** When the period resets, as a local date; absent for `total`. */
  resets?: string;
  /** When the row ends, as a local date; absent when it names none. */
  ends?: string;
  /** What the meter fills: used over amount, capped at 1; 0 when nothing is counted. */
  fraction: number;
  /** Whether the meter is full. */
  full: boolean;
}

function measureWords(value: number, measure: Measure, locale: string): string {
  switch (measure) {
    case 'usd': return new Intl.NumberFormat(locale, { style: 'currency', currency: 'USD' }).format(value);
    case 'tokens': return new Intl.NumberFormat(locale, { notation: 'compact' }).format(value);
    default: return new Intl.NumberFormat(locale).format(value);
  }
}

export function limitWords(figure: LimitFigure, locale: string): LimitWords {
  const counted = figure.counted && figure.used !== undefined;
  const used = figure.used ?? 0;
  const fraction = !counted ? 0 : figure.amount <= 0 ? 1 : Math.min(used / figure.amount, 1);
  const date = (instant: string): string => new Date(instant).toLocaleDateString(locale);
  return {
    ...(counted ? { used: measureWords(used, figure.measure, locale) } : {}),
    amount: measureWords(figure.amount, figure.measure, locale),
    period: figure.period,
    ...(figure.resets === undefined ? {} : { resets: date(figure.resets) }),
    ...(figure.ends === undefined ? {} : { ends: date(figure.ends) }),
    fraction,
    full: counted && used >= figure.amount,
  };
}

/** How the explorer lists the rows: under their kind, under their scope, or in one list. */
export type PolicyGrouping = 'kind' | 'scope' | 'none';

export const POLICY_GROUPINGS: readonly PolicyGrouping[] = ['kind', 'scope', 'none'];

/** The kinds in the order a host names them. */
const KIND_ORDER: readonly string[] = ['model', 'agent', 'computer'];

/** A row's group under a grouping, as a key the groups sort by; undefined in one list. */
export function policyGroup(row: Policy, by: PolicyGrouping): string | undefined {
  if (by === 'none') return undefined;
  return by === 'kind' ? row.kind : row.scope;
}

/**
 * The groups' order: kinds as the host names them, any other kind after;
 * scopes with `all` first, then by name. Within a group the rows go by id.
 */
export function comparePolicies(by: PolicyGrouping): (a: Policy, b: Policy) => number {
  const rank = (row: Policy): number => {
    if (by === 'kind') {
      const at = KIND_ORDER.indexOf(row.kind);
      return at < 0 ? KIND_ORDER.length : at;
    }
    return by === 'scope' && row.scope === 'all' ? 0 : 1;
  };
  return (a, b) => rank(a) - rank(b) || (policyGroup(a, by) ?? '').localeCompare(policyGroup(b, by) ?? '') || a.id.localeCompare(b.id);
}

/** Whether a row is valid at `now`: from its `from`, before its `until`. The host stores a bare day as the instants it holds, so both parse. */
export function policyActive(row: Policy, now: Date): boolean {
  if (row.from !== undefined && now.getTime() < Date.parse(row.from)) return false;
  if (row.until !== undefined && now.getTime() >= Date.parse(row.until)) return false;
  return true;
}
