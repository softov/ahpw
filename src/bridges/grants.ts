/**
 * What a role's grants reach, worked out against the catalog the host
 * advertises in its root state, `_meta["ahpd.grants"]`: every subject a grant
 * may name, with its operations and the `read` and `write` groups they are in.
 *
 * A grant is `<subject>:<operation>`, where the operation is one of the
 * subject's own, a group, or `*`, and `*` stands for any subject; a grant only
 * ever adds. These are ahpd's rules (`OPERATIONS` and `groupOf` in
 * `@ahpd/sdk`'s `users.ts`), read here so the role editor shows what the gate
 * would answer.
 */

import type { Grant } from '@ahpd/sdk';
import { ahpdKey } from './ahpd-meta.js';

export type { Grant };

export type GrantGroup = 'read' | 'write';
export const GRANT_GROUPS: readonly GrantGroup[] = ['read', 'write'];

/** One subject, as the host describes it to a role editor. */
export interface GrantSubject {
  title: string;
  description: string;
  /** Every operation, read before write. */
  operations: string[];
  groups: Record<GrantGroup, string[]>;
}

export type GrantCatalog = Record<string, GrantSubject>;

/** The wildcard subject: `*:read` is every subject's read. */
export const EVERY = '*';

const strings = (value: unknown): string[] => (Array.isArray(value) ? value.filter((one): one is string => typeof one === 'string') : []);

/** The catalog in a root state's `_meta`; empty from a host that sends none. */
export function grantCatalog(meta: unknown): GrantCatalog {
  const held = ahpdKey(meta, 'grants');
  if (typeof held !== 'object' || held === null) return {};
  const catalog: GrantCatalog = {};
  for (const [subject, value] of Object.entries(held as Record<string, unknown>)) {
    if (typeof value !== 'object' || value === null) continue;
    const one = value as Record<string, unknown>;
    const groups = (typeof one.groups === 'object' && one.groups !== null ? one.groups : {}) as Record<string, unknown>;
    catalog[subject] = {
      title: typeof one.title === 'string' ? one.title : subject,
      description: typeof one.description === 'string' ? one.description : '',
      operations: strings(one.operations),
      groups: { read: strings(groups.read), write: strings(groups.write) },
    };
  }
  return catalog;
}

/** A grant's two halves, cut at its one colon. */
export function grantParts(grant: string): { subject: string; operation: string } {
  const at = grant.indexOf(':');
  return { subject: grant.slice(0, at), operation: grant.slice(at + 1) };
}

const grant = (subject: string, operation: string): Grant => `${subject}:${operation}`;

/**
 * A subject as a card shows it: the catalog's entry, or, for a subject the
 * host does not advertise, such as a plugin that is not loaded, the operations
 * the grants name, in no group.
 */
export function subjectInfo(subject: string, catalog: GrantCatalog, grants: readonly string[]): GrantSubject {
  const known = catalog[subject];
  if (known !== undefined) return known;
  const named = grants.map(grantParts).filter((one) => one.subject === subject && one.operation !== '*' && !GRANT_GROUPS.includes(one.operation as GrantGroup)).map((one) => one.operation);
  return { title: subject, description: '', operations: [...new Set(named)], groups: { read: [], write: [] } };
}

/** The subjects the grants name, `*` first, then in the catalog's order, then the ones it lacks as named; `shown` adds subjects with no grant yet. */
export function subjectsOf(grants: readonly string[], catalog: GrantCatalog, shown: readonly string[] = []): string[] {
  const named = new Set([...grants.map((one) => grantParts(one).subject), ...shown]);
  const order = [EVERY, ...Object.keys(catalog), ...named];
  return [...new Set(order)].filter((subject) => named.has(subject));
}

/** Which group an operation is in on this subject, if any. */
export function groupOf(info: GrantSubject, operation: string): GrantGroup | undefined {
  return GRANT_GROUPS.find((group) => info.groups[group].includes(operation));
}

/** Whether a role holds an operation: itself, through the grant that covers it, or not at all. */
export interface OperationState {
  state: 'on' | 'implied' | 'off';
  /** The grant that covers it, when implied. */
  by?: Grant;
}

export function operationState(grants: readonly string[], subject: string, operation: string, info: GrantSubject): OperationState {
  if (grants.includes(grant(subject, operation))) return { state: 'on' };
  const group = groupOf(info, operation);
  const covering = [
    grant(subject, '*'),
    ...(group === undefined ? [] : [grant(subject, group)]),
    grant(EVERY, operation),
    ...(group === undefined ? [] : [grant(EVERY, group)]),
    grant(EVERY, '*'),
  ].find((one) => grants.includes(one));
  return covering === undefined ? { state: 'off' } : { state: 'implied', by: covering };
}

/** How many of a subject's operations the role reaches. */
export function reached(grants: readonly string[], subject: string, info: GrantSubject): number {
  return info.operations.filter((operation) => operationState(grants, subject, operation, info).state !== 'off').length;
}

/** Whether a grant can be split for one subject: a wildcard subject cannot, since a grant only adds. */
export const splittable = (by: Grant): boolean => grantParts(by).subject !== EVERY;

/**
 * The grants after a click on an operation's chip: a granted one goes, an
 * ungranted one comes, and a covered one splits the grant that covers it into
 * everything that grant held but this operation. A wildcard subject's grant is
 * not split, and the grants come back as they were.
 */
export function toggleOperation(grants: readonly string[], subject: string, operation: string, info: GrantSubject): Grant[] {
  const held = grants as Grant[];
  const mine = grant(subject, operation);
  const { state, by } = operationState(grants, subject, operation, info);
  if (state === 'on') return held.filter((one) => one !== mine);
  if (state === 'off') return [...held, mine];
  if (by === undefined || !splittable(by)) return [...held];
  const covered = grantParts(by).operation;
  const instead: Grant[] = covered === '*'
    // Every operation: the other group whole, and this group's operations but this one.
    ? [
        ...GRANT_GROUPS.flatMap((group) => (info.groups[group].includes(operation)
          ? info.groups[group].filter((one) => one !== operation).map((one) => grant(subject, one))
          : info.groups[group].length > 0 ? [grant(subject, group)] : [])),
        ...info.operations.filter((one) => one !== operation && groupOf(info, one) === undefined).map((one) => grant(subject, one)),
      ]
    : info.groups[covered as GrantGroup].filter((one) => one !== operation).map((one) => grant(subject, one));
  const kept = held.filter((one) => one !== by);
  return [...kept, ...instead.filter((one) => !kept.includes(one))];
}

/** The grants with a subject's group, or `*`, given or taken away. */
export function toggleGroup(grants: readonly string[], subject: string, group: GrantGroup | '*'): Grant[] {
  const mine = grant(subject, group);
  return grants.includes(mine) ? (grants as Grant[]).filter((one) => one !== mine) : [...(grants as Grant[]), mine];
}

/** The grants without any that name the subject. */
export function dropSubject(grants: readonly string[], subject: string): Grant[] {
  return (grants as Grant[]).filter((one) => grantParts(one).subject !== subject);
}
