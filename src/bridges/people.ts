/**
 * A host's people, as ahpd keeps them: users, the teams and projects their
 * work is charged to, and the roles that say what they may do. Each is a
 * records channel that lists them and a scheme whose resources are the
 * records. A write is the `x-ahpd/<domain>/put` or `/remove` command where the
 * host offers it, else the resource write the command stands for.
 */

import type { Grant, Named, Role, UserRecord } from '@ahpd/sdk';
import { hostBridge } from './data.js';
import { allows, type Offers } from './offers.js';

export type { Grant, Named, Role, UserRecord };

export type PeopleDomain = 'users' | 'teams' | 'projects' | 'roles';

/** Each domain's resource scheme, channel and commands. */
export const PEOPLE: Readonly<Record<PeopleDomain, { scheme: 'user' | 'team' | 'project' | 'role'; channel: string; put: string; remove: string }>> = {
  users: { scheme: 'user', channel: 'x-ahpd-users://', put: 'x-ahpd/users/put', remove: 'x-ahpd/users/remove' },
  teams: { scheme: 'team', channel: 'x-ahpd-teams://', put: 'x-ahpd/teams/put', remove: 'x-ahpd/teams/remove' },
  projects: { scheme: 'project', channel: 'x-ahpd-projects://', put: 'x-ahpd/projects/put', remove: 'x-ahpd/projects/remove' },
  roles: { scheme: 'role', channel: 'x-ahpd-roles://', put: 'x-ahpd/roles/put', remove: 'x-ahpd/roles/remove' },
};

/** The channel's scheme, as a host names it among its channels: `x-ahpd-users`. */
export const channelScheme = (domain: PeopleDomain): string => PEOPLE[domain].channel.slice(0, -'://'.length);

/** A user as the users channel sends one: the record without its token, with the grants its roles give and whether it is trusted. */
export type ListedUser = Omit<UserRecord, 'token'> & { grants?: Grant[]; trusted?: boolean };

/** What each domain's channel holds per record. */
export interface PeopleRecords {
  users: ListedUser;
  teams: Named;
  projects: Named;
  roles: Role;
}

export interface PeopleState<R> {
  records: { id: string; record: R }[];
}

type PeopleAction<R> =
  | { type: string; id: string; record: R }
  | { type: string; id: string };

/** Folds a domain's channel actions, `x-ahpd-<domain>/added`, `/changed` and `/removed`, into its snapshot, `{ records }`. */
export function peopleReducer<D extends PeopleDomain>(domain: D): (state: PeopleState<PeopleRecords[D]>, action: PeopleAction<PeopleRecords[D]>) => PeopleState<PeopleRecords[D]> {
  return recordsReducer<PeopleRecords[D]>(channelScheme(domain));
}

/** Folds a records channel's actions, `<scheme>/added`, `/changed` and `/removed`, into its snapshot, `{ records }`; ahpd's policies channel is one too. */
export function recordsReducer<R>(scheme: string): (state: PeopleState<R>, action: PeopleAction<R>) => PeopleState<R> {
  return (state, action) => {
    switch (action.type) {
      case `${scheme}/added`:
      case `${scheme}/changed`: {
        if (!('record' in action)) return state;
        const entry = { id: action.id, record: action.record };
        const at = state.records.findIndex((one) => one.id === action.id);
        return { records: at < 0 ? [...state.records, entry] : state.records.map((one, index) => (index === at ? entry : one)) };
      }
      case `${scheme}/removed`:
        return { records: state.records.filter((one) => one.id !== action.id) };
      default:
        return state;
    }
  };
}

/** Whether a host lists this domain on its channel. */
export function servesPeople(offers: Offers, domain: PeopleDomain): boolean {
  return offers.channels.includes(channelScheme(domain));
}

/** Whether a host takes writes to this domain's records; one that does not shows them read-only. */
export function writesPeople(offers: Offers, domain: PeopleDomain): boolean {
  const provider = offers.providers[PEOPLE[domain].scheme];
  return provider !== undefined && allows(provider, 'write');
}

/** A record's resource URI, under the root the host names for the scheme. */
export function personUri(offers: Offers, domain: PeopleDomain, id: string): string {
  const { scheme } = PEOPLE[domain];
  const root = offers.providers[scheme]?.root ?? `${scheme}://`;
  return `${root.endsWith('/') ? root : `${root}/`}${encodeURIComponent(id)}`;
}

/** Makes or edits one record; `createOnly` refuses an id the host already holds. */
export async function putPerson(host: string, offers: Offers, domain: PeopleDomain, id: string, record: Record<string, unknown>, createOnly: boolean): Promise<void> {
  const bridge = hostBridge(host);
  const { put } = PEOPLE[domain];
  if (offers.methods.includes(put)) {
    await bridge.request(put as never, { id, record, ...(createOnly ? { createOnly } : {}) } as never);
    return;
  }
  await bridge.writeResource(personUri(offers, domain, id), JSON.stringify(record), 'utf-8', createOnly);
}

/** Removes one record. */
export async function removePerson(host: string, offers: Offers, domain: PeopleDomain, id: string): Promise<void> {
  const bridge = hostBridge(host);
  const { remove } = PEOPLE[domain];
  if (offers.methods.includes(remove)) {
    await bridge.request(remove as never, { id } as never);
    return;
  }
  await bridge.deleteResource(personUri(offers, domain, id), false);
}

/** The fields of a user a person edits; the rest of a record is the host's. */
export interface UserFields {
  roles: string[];
  memberships: string[];
  primary: string;
  issuer: string;
  rolesFrom: string;
}

/**
 * The body a user write sends: only what a person edits, an empty text as
 * `null`, which is how a host takes an issuer, a roles-from or a primary away.
 * Never the token, nor the grants and trust the list answer adds.
 */
export function userBody(fields: UserFields): Record<string, unknown> {
  const text = (value: string): string | null => (value.trim() === '' ? null : value.trim());
  return {
    roles: fields.roles,
    memberships: fields.memberships,
    primary: text(fields.primary),
    issuer: text(fields.issuer),
    rolesFrom: text(fields.rolesFrom),
  };
}

/** A user's editable fields, as a record holds them. */
export function userFields(record: ListedUser | undefined): UserFields {
  return {
    roles: record?.roles ?? ['guest'],
    memberships: record?.memberships ?? [],
    primary: record?.primary ?? '',
    issuer: record?.issuer ?? '',
    rolesFrom: record?.rolesFrom ?? '',
  };
}

/**
 * The roles every ahpd has without writing one down, as `@ahpd/sdk`'s
 * `BUILT_IN` (copied, since its code reads `node:fs`). The roles channel lists
 * only the roles a users file writes; one written under a built-in's name
 * replaces the built-in.
 */
export const BUILT_IN_ROLES: Readonly<Record<string, readonly Grant[]>> = {
  admin: ['*:*'],
  member: ['file:read', 'file:write', 'session:read', 'session:write', 'terminal:read', 'terminal:write', 'proxy:read', 'proxy:write', 'trust:write'],
  guest: ['session:read', 'automation:read'],
};

/** A host's roles: the ones its file writes, then each built-in the file does not replace. */
export function everyRole(written: readonly { id: string; record: Role }[]): { id: string; record: Role; builtIn: boolean }[] {
  const ids = new Set(written.map((one) => one.id));
  return [
    ...written.map((one) => ({ ...one, builtIn: false })),
    ...Object.entries(BUILT_IN_ROLES).filter(([id]) => !ids.has(id)).map(([id, grants]) => ({ id, record: { id, grants: [...grants] }, builtIn: true })),
  ];
}

/** A member of a team or project: who, the memberships that make them one, and whether one is their primary. */
export interface Member {
  user: string;
  through: string[];
  primary: boolean;
}

/**
 * Who belongs to a team or works on a project, worked out from the users'
 * memberships, since neither keeps a list of its own. A team's members hold
 * `team`, `team:*` or `team:<project>`; a project's hold `<team>:<project>` or
 * `<team>:*`, through whichever team.
 */
export function membersOf(domain: 'teams' | 'projects', id: string, users: readonly ListedUser[]): Member[] {
  const names = (membership: string): boolean => {
    const cut = membership.indexOf(':');
    const team = cut < 0 ? membership : membership.slice(0, cut);
    const project = cut < 0 ? undefined : membership.slice(cut + 1);
    return domain === 'teams' ? team === id : project === id || project === '*';
  };
  return users
    .map((user) => {
      const through = (user.memberships ?? []).filter(names);
      return { user: user.id, through, primary: user.primary !== undefined && through.includes(user.primary) };
    })
    .filter((member) => member.through.length > 0)
    .sort((a, b) => a.user.localeCompare(b.user));
}
