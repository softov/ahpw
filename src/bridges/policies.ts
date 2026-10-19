/**
 * A host's policies, the limits they place on a person, and the edits to them.
 *
 * The rows are the channel `x-ahpd-policies://` and the resources of the
 * `policy:` scheme. A write is the `x-ahpd/policies/put` or `/remove` command
 * where the host offers it, else the resource write the command stands for.
 *
 * A limit is read twice: `usage://limits` answers the ones that hold the
 * person, and `policy://<id>/limits` answers one row's, with every member of an
 * `each` limit. Usage has no channel, so a page asks when it shows.
 */

import { AhpErrorCodes } from '@microsoft/agent-host-protocol';
import type { LimitPool, Measure, Period, Policy, PolicyLimit } from '@ahpd/sdk';
import { hostBridge } from './data.js';
import { allows, type Offers } from './offers.js';

export type { LimitPool, Measure, Period, Policy, PolicyLimit };

/** One member of an `each` limit, as ahpd's `packages/sdk/src/charge.ts` defines it. */
export interface LimitMember {
  /** The user id after `user:` in the key. */
  user: string;
  /** What the member used of the measure in the period. */
  used: number;
}

/** What one limit allows, what is used and when the period resets, as ahpd's `packages/sdk/src/charge.ts` defines it. */
export interface LimitFigure {
  /** How much the limit allows. */
  amount: number;
  /** What it is counted in. */
  measure: Measure;
  /** The window it is counted over. */
  period: Period;
  /** Whether a group shares the total or every member has their own. */
  pool: LimitPool;
  /** Whether this plan counts the measure. A limit it does not count never closes its row. */
  counted: boolean;
  /** What the period used, when the measure is counted. Absent for an `each` read without a person. */
  used?: number;
  /** Every member with a key of their own, when an `each` limit is read without a person. */
  members?: LimitMember[];
  /** The first instant of the period. */
  from: string;
  /** When the period resets; absent for `total`. */
  resets?: string;
  /** The row's `until`, when it names one. */
  ends?: string;
}

/** One row's limits, as ahpd's `packages/sdk/src/policy.ts` defines them. */
export interface PolicyLimits {
  /** The row's id. */
  id: string;
  /** What the row is about. */
  kind: Policy['kind'];
  /** Who the row is about. */
  scope: Policy['scope'];
  /** Each limit, with what is used and when it resets. */
  limits: LimitFigure[];
}

/** The policy scheme, its channel and its commands. */
export const POLICIES = {
  scheme: 'policy',
  channel: 'x-ahpd-policies://',
  put: 'x-ahpd/policies/put',
  remove: 'x-ahpd/policies/remove',
} as const;

/** The channel's scheme, as a host names it among its channels: `x-ahpd-policies`. */
const CHANNEL_SCHEME = POLICIES.channel.slice(0, -'://'.length);

/** What the policies channel holds per row. */
export interface PoliciesState {
  records: { id: string; record: Policy }[];
}

type PoliciesAction =
  | { type: string; id: string; record: Policy }
  | { type: string; id: string };

/** Folds the policies channel actions, `x-ahpd-policies/added`, `/changed` and `/removed`, into its snapshot, `{ records }`. */
export function policiesReducer(state: PoliciesState, action: PoliciesAction): PoliciesState {
  switch (action.type) {
    case `${CHANNEL_SCHEME}/added`:
    case `${CHANNEL_SCHEME}/changed`: {
      if (!('record' in action)) return state;
      const entry = { id: action.id, record: action.record };
      const at = state.records.findIndex((one) => one.id === action.id);
      return { records: at < 0 ? [...state.records, entry] : state.records.map((one, index) => (index === at ? entry : one)) };
    }
    case `${CHANNEL_SCHEME}/removed`:
      return { records: state.records.filter((one) => one.id !== action.id) };
    default:
      return state;
  }
}

/** Whether a host lists its policies on its channel. */
export function servesPolicies(offers: Offers): boolean {
  return offers.channels.includes(CHANNEL_SCHEME);
}

/** Whether a host's policy provider takes a write. */
export function writesPolicies(offers: Offers): boolean {
  const provider = offers.providers[POLICIES.scheme];
  return provider !== undefined && allows(provider, 'write');
}

/** The root a scheme's resources sit under, as the host names it. */
function rootOf(offers: Offers, scheme: string): string {
  const root = offers.providers[scheme]?.root ?? `${scheme}://`;
  return root.endsWith('/') ? root : `${root}/`;
}

/** A row's resource URI, or one of its leaves. */
function policyUri(offers: Offers, id: string, leaf?: string): string {
  return `${rootOf(offers, POLICIES.scheme)}${encodeURIComponent(id)}${leaf === undefined ? '' : `/${leaf}`}`;
}

/** A read that answers JSON, or throws what the host said. */
async function readJson<T>(host: string, uri: string): Promise<T> {
  const { text } = await hostBridge(host).readText(uri);
  if (text === null) throw new Error(`${uri} did not read as text`);
  return JSON.parse(text) as T;
}

/** Whether an error is the host saying the resource is not there. */
function isNotFound(error: unknown): boolean {
  return typeof error === 'object' && error !== null && (error as { code?: unknown }).code === AhpErrorCodes.NotFound;
}

/**
 * The limits that hold the person, from `usage://limits`.
 *
 * A host with `policies.ownLimits` off answers `-32008`, which is no limits
 * rather than a failure; any other error is the host's and is thrown.
 */
export async function ownLimits(host: string, offers: Offers): Promise<PolicyLimits[] | undefined> {
  const uri = `${rootOf(offers, 'usage')}limits`;
  try {
    const answer = await readJson<unknown>(host, uri);
    if (!Array.isArray(answer)) throw new Error(`The host's limits are not a list`);
    return answer as PolicyLimits[];
  } catch (error) {
    if (isNotFound(error)) return undefined;
    throw error;
  }
}

/** One row's limits, from `policy://<id>/limits`. */
export async function policyLimits(host: string, offers: Offers, id: string): Promise<PolicyLimits> {
  return await readJson<PolicyLimits>(host, policyUri(offers, id, 'limits'));
}

/** Makes or edits one policy; `createOnly` refuses an id the host already holds. */
export async function putPolicy(host: string, offers: Offers, id: string, record: Record<string, unknown>, createOnly: boolean): Promise<void> {
  const bridge = hostBridge(host);
  if (offers.methods.includes(POLICIES.put)) {
    await bridge.request(POLICIES.put as never, { id, record, ...(createOnly ? { createOnly } : {}) } as never);
    return;
  }
  await bridge.writeResource(policyUri(offers, id), JSON.stringify(record), 'utf-8', createOnly);
}

/** Removes one policy. */
export async function removePolicy(host: string, offers: Offers, id: string): Promise<void> {
  const bridge = hostBridge(host);
  if (offers.methods.includes(POLICIES.remove)) {
    await bridge.request(POLICIES.remove as never, { id } as never);
    return;
  }
  await bridge.deleteResource(policyUri(offers, id), false);
}

/** What a limit is shown in: its figures, its period, the dates it carries, and what a meter reads. */
export interface LimitWords {
  /** What the period used. Absent when the measure is not counted. */
  used?: string;
  /** How much the limit allows. */
  amount: string;
  /** The window it is counted over. */
  period: Period;
  /** When the period resets, as a local date; absent for `total`. */
  resets?: string;
  /** When the row ends, as a local date; absent when it names none. */
  ends?: string;
  /** What the meter fills: used over amount, capped at 1; 0 when nothing is counted. */
  fraction: number;
  /** Whether the meter is full. */
  full: boolean;
}

/** One figure in its measure: currency for `usd`, compact for `tokens`, and a count for the rest. */
function measureWords(value: number, measure: Measure, locale: string): string {
  switch (measure) {
    case 'usd': return new Intl.NumberFormat(locale, { style: 'currency', currency: 'USD' }).format(value);
    case 'tokens': return new Intl.NumberFormat(locale, { notation: 'compact' }).format(value);
    default: return new Intl.NumberFormat(locale).format(value);
  }
}

/** One instant as the day it falls on, in the reader's zone. */
function localDate(instant: string, locale: string): string {
  return new Date(instant).toLocaleDateString(locale);
}

/**
 * A limit as a person reads it.
 *
 * A measure this plan does not count has no figure, and no meter to fill. The
 * fraction stops at 1 because a turn is charged when it ends, so the used
 * figure can pass the amount; the words still say the real figure.
 */
export function limitWords(figure: LimitFigure, locale: string): LimitWords {
  const counted = figure.counted && figure.used !== undefined;
  const used = figure.used ?? 0;
  const fraction = !counted ? 0 : figure.amount <= 0 ? 1 : Math.min(used / figure.amount, 1);
  return {
    ...(counted ? { used: measureWords(used, figure.measure, locale) } : {}),
    amount: measureWords(figure.amount, figure.measure, locale),
    period: figure.period,
    ...(figure.resets === undefined ? {} : { resets: localDate(figure.resets, locale) }),
    ...(figure.ends === undefined ? {} : { ends: localDate(figure.ends, locale) }),
    fraction,
    full: counted && used >= figure.amount,
  };
}
