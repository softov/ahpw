/**
 * What the policy page holds while it is edited, the pickers a host's manifest
 * draws, and the checks a save makes before the host sees the body.
 */

import type { LimitPool, Measure, Period, Policy, PolicyLimit } from '../../bridges/policies.js';
import { isRecordId } from '../users/form.js';

/** A JSON object, as a schema and a policy body are read here. */
type Bag = Record<string, unknown>;

function bag(value: unknown): Bag | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value) ? (value as Bag) : null;
}

/** What a value holds at a path of keys, or nothing when a step is not an object. */
function at(value: unknown, ...keys: string[]): unknown {
  let held: unknown = value;
  for (const key of keys) {
    const map = bag(held);
    if (map === null) return undefined;
    held = map[key];
  }
  return held;
}

/** The strings of an `enum`, or none. */
function enumAt(value: unknown): string[] {
  const list = at(value, 'enum');
  return Array.isArray(list) ? list.filter((one): one is string => typeof one === 'string') : [];
}

/** The values a manifest offers, before a kind narrows them. */
export interface PolicyChoices {
  kinds: string[];
  effects: string[];
  measures: string[];
  periods: string[];
  pools: string[];
  matchTypes: string[];
}

/** The values the manifest's own properties name. */
export function choicesOf(manifest: Record<string, unknown> | undefined): PolicyChoices {
  const properties = at(manifest, 'properties');
  return {
    kinds: enumAt(at(properties, 'kind')),
    effects: enumAt(at(properties, 'effect')),
    measures: enumAt(at(properties, 'limits', 'items', 'properties', 'measure')),
    periods: enumAt(at(properties, 'limits', 'items', 'properties', 'period')),
    pools: enumAt(at(properties, 'limits', 'items', 'properties', 'pool')),
    matchTypes: Object.keys(bag(at(properties, 'match', 'properties')) ?? {}),
  };
}

/** The `allOf` entry that narrows the values for one kind, or nothing. */
function narrowed(manifest: Record<string, unknown> | undefined, kind: string): unknown {
  const entries = at(manifest, 'allOf');
  if (!Array.isArray(entries)) return undefined;
  for (const entry of entries) {
    if (at(entry, 'if', 'properties', 'kind', 'const') !== kind) continue;
    const required = at(entry, 'if', 'required');
    if (Array.isArray(required) && required.includes('kind')) return at(entry, 'then');
  }
  return undefined;
}

/** The measures a kind takes: the manifest's union, narrowed by its `allOf` entry for that kind. */
export function measuresFor(manifest: Record<string, unknown> | undefined, kind: string): string[] {
  const all = choicesOf(manifest).measures;
  const only = enumAt(at(narrowed(manifest, kind), 'properties', 'limits', 'items', 'properties', 'measure'));
  return only.length === 0 ? all : all.filter((one) => only.includes(one));
}

/** The match types a kind takes: the manifest's types, narrowed by its `allOf` entry for that kind. */
export function matchTypesFor(manifest: Record<string, unknown> | undefined, kind: string): string[] {
  const all = choicesOf(manifest).matchTypes;
  const only = enumAt(at(narrowed(manifest, kind), 'properties', 'match', 'propertyNames'));
  return only.length === 0 ? all : all.filter((one) => only.includes(one));
}

/** The limit rows a kind keeps: a row in a measure the kind does not take is dropped. */
export function fitLimits(limits: readonly LimitDraft[], measures: readonly string[]): LimitDraft[] {
  return limits.filter((one) => measures.includes(one.measure));
}

/** A picker's values, with the value a row already holds when the manifest does not name it. */
export function withValue(values: readonly string[], value: string | undefined): string[] {
  return value === undefined || value === '' || values.includes(value) ? [...values] : [value, ...values];
}

/** One limit as the form holds it: its amount as typed, and the manifest's values. */
export interface LimitDraft {
  amount: string;
  measure: string;
  period: string;
  pool: string;
}

/** A policy as the form holds it: every list is text, so nothing is lost between renders. */
export interface PolicyDraft {
  id: string;
  scope: string;
  kind: string;
  effect: string;
  /** Each match type's values, one to a line. */
  match: Record<string, string>;
  limits: LimitDraft[];
  pool: string;
  cap: boolean;
  from: string;
  until: string;
}

/** A row's values as the form's text. A new row starts at the manifest's first kind and effect. */
export function draftOf(record: Policy | undefined, manifest: Record<string, unknown> | undefined): PolicyDraft {
  const choices = choicesOf(manifest);
  const kind = record?.kind ?? choices.kinds[0] ?? 'model';
  const held = record?.match as Record<string, string[] | undefined> | undefined;
  const types = [...new Set([...matchTypesFor(manifest, kind), ...Object.keys(held ?? {})])];
  return {
    id: record?.id ?? '',
    scope: record?.scope ?? 'all',
    kind,
    effect: record?.effect ?? choices.effects[0] ?? 'allow',
    match: Object.fromEntries(types.map((type) => [type, (held?.[type] ?? []).join('\n')])),
    limits: (record?.limits ?? []).map((one: PolicyLimit) => ({
      amount: String(one.amount),
      measure: one.measure,
      period: one.period,
      pool: one.pool,
    })),
    pool: record?.pool ?? '',
    cap: record?.cap === true,
    from: record?.from ?? '',
    until: record?.until ?? '',
  };
}

/** A match type's values out of its lines; blank lines hold no value. */
function valuesOf(text: string): string[] {
  return text.split('\n').map((line) => line.trim()).filter((line) => line !== '');
}

/**
 * The body a save sends.
 *
 * Every field is named, so the host replaces the row rather than keeping what
 * the form left out. A blank date is sent as `null`, which the host reads as
 * no bound. A blank pool is left out: a write names the pool it keeps, and the
 * host has no spelling that takes one away.
 */
export function policyBody(draft: PolicyDraft): Record<string, unknown> {
  const match: Record<string, string[]> = {};
  for (const [type, text] of Object.entries(draft.match)) {
    const values = valuesOf(text);
    if (values.length > 0) match[type] = values;
  }
  const from = draft.from.trim();
  const until = draft.until.trim();
  return {
    scope: draft.scope.trim(),
    kind: draft.kind,
    effect: draft.effect,
    match,
    limits: draft.limits.map((one): PolicyLimit => ({
      amount: Number(one.amount),
      measure: one.measure as Measure,
      period: one.period as Period,
      pool: one.pool as LimitPool,
    })),
    ...(draft.pool.trim() === '' ? {} : { pool: draft.pool.trim() }),
    cap: draft.cap,
    from: from === '' ? null : from,
    until: until === '' ? null : until,
  };
}

/** What is wrong with a draft before a save, by the field that holds it. */
export interface DraftProblems {
  /** The fresh row's id is missing or cannot be a URI's last part. */
  id: boolean;
  /** The scope is empty. */
  scope: boolean;
  /** Match type to the line numbers that hold nothing. */
  match: Record<string, number[]>;
  /** Limit row to what is wrong with its amount. */
  amounts: Record<number, 'number' | 'negative'>;
  /** Whether anything is wrong. */
  any: boolean;
}

/**
 * The checks a save makes before the host sees the body.
 *
 * A type whose whole box is empty is unconstrained and allowed; a blank line
 * between two values is a line somebody meant to fill, and is caught. A
 * trailing newline is not, since it leaves no value after it.
 */
export function problemsOf(draft: PolicyDraft, fresh: boolean): DraftProblems {
  const match: Record<string, number[]> = {};
  for (const [type, text] of Object.entries(draft.match)) {
    const lines = text.split('\n');
    lines.forEach((raw, at) => {
      if (raw.trim() !== '') return;
      if (!lines.slice(0, at).some((line) => line.trim() !== '')) return;
      if (!lines.slice(at + 1).some((line) => line.trim() !== '')) return;
      const held = match[type];
      if (held === undefined) match[type] = [at + 1];
      else held.push(at + 1);
    });
  }
  const amounts: Record<number, 'number' | 'negative'> = {};
  draft.limits.forEach((one, at) => {
    if (one.amount.trim() === '' || !Number.isFinite(Number(one.amount))) amounts[at] = 'number';
    else if (Number(one.amount) < 0) amounts[at] = 'negative';
  });
  const id = fresh && !isRecordId(draft.id);
  const scope = draft.scope.trim() === '';
  return {
    id,
    scope,
    match,
    amounts,
    any: id || scope || Object.keys(match).length > 0 || Object.keys(amounts).length > 0,
  };
}
