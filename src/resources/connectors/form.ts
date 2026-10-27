/**
 * What the connector form draws and sends. The top is ahpw's own: the
 * adapter, the id, the title and the owner. Below it, the adapter's own
 * schema, as the host lists it. scena's `SchemaForm` knows no `writeOnly`, so
 * a secret field is drawn as a password, empty: the host never lists a secret
 * back, and an empty one sent as `""` keeps what it stores.
 */

import type { EnumOption, JsonSchemaObject } from '@softov/scena/ui';
import { isSecretRef, type AdapterRow, type Capability, type ConnectorOwner } from '../../bridges/connectors.js';
import { EVERY, grantParts } from '../../bridges/grants.js';
import type { ListedUser } from '../../bridges/people.js';
import { membershipParts } from '../users/memberships.js';

type Bag = Record<string, unknown>;

const bagOf = (value: unknown): Bag => (typeof value === 'object' && value !== null && !Array.isArray(value) ? (value as Bag) : {});

/** A connector's id: a slug, as ahpd's records take one. SchemaForm checks no `pattern`, so the form does. */
export const ID_PATTERN = /^[a-z][a-z0-9-]{0,39}$/u;

/** The top of the form: adapter, id, title, owner. */
export interface TopValues {
  adapter: string;
  id: string;
  title: string;
  owner: string;
}

/** The words the top schema is drawn with. */
export interface TopWords {
  id: string;
  idHint: string;
  title: string;
  titleHint: string;
  owner: string;
}

/**
 * The top schema: the title, the id and the owner. The adapter is picked
 * above it; a made connector has its adapter and id fixed, so its form draws
 * only its title and owner.
 */
export function topSchema(owners: readonly EnumOption[], editing: boolean, words: TopWords): JsonSchemaObject {
  const title = { type: 'string', title: words.title, description: words.titleHint };
  const owner = { type: 'string', title: words.owner, enum: owners.map((one) => one.value), 'x-enumOptions': [...owners] };
  if (editing) return { type: 'object', properties: { title, owner }, required: ['owner'] };
  return {
    type: 'object',
    properties: { title, id: { type: 'string', title: words.id, description: words.idHint }, owner },
    required: ['id', 'owner'],
  };
}

/** A text as a connector id: lower case, without accents, words joined by `-`, starting with a letter. */
export function slugOf(text: string): string {
  return text
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/gu, '-')
    .replace(/^[^a-z]+/u, '')
    .slice(0, 36)
    .replace(/-+$/u, '');
}

/** An id no connector holds yet: the base, then `-2`, `-3`, ... */
export function suggestedId(base: string, taken: readonly string[]): string {
  if (!taken.includes(base)) return base;
  for (let n = 2; ; n += 1) if (!taken.includes(`${base}-${n}`)) return `${base}-${n}`;
}

/** The id a new connector is given: from its title, or from its adapter's name while it has none. */
export const idFor = (title: string, adapter: string, taken: readonly string[]): string =>
  adapter === '' ? '' : suggestedId(slugOf(title) || slugOf(adapter), taken);

/** What the picker lists: an adapter, or an agent kind, which a plugin registers the same way. An agent kind declares no capabilities. */
export type Pickable = Pick<AdapterRow, 'name' | 'title' | 'description' | 'plugin' | 'icons'> & {
  capabilities?: readonly Pick<Capability, 'type' | 'title'>[];
};

/** One group of adapters, as the picker lists them: a plugin's, or a capability type's. */
export interface AdapterGroup<T extends Pickable = AdapterRow> {
  key: string;
  label: string;
  adapters: T[];
}

/** How the picker groups adapters: by the plugin that registers them, or by the types of capability they declare. */
export type AdapterGrouping = 'plugin' | 'type';

export const ADAPTER_GROUPINGS: readonly AdapterGrouping[] = ['plugin', 'type'];

/** The key under which each browser keeps the picker's grouping. */
export const ADAPTER_GROUPING_KEY = 'ahpd-web.adapter-picker-group';

/** Whether an adapter's title, description or plugin title holds `wanted`, which is lowercase. */
const matches = (adapter: Pickable, plugin: string, wanted: string): boolean =>
  wanted === '' || [adapter.title, adapter.description, plugin].join(' ').toLowerCase().includes(wanted);

const byTitle = <T extends Pickable>(group: AdapterGroup<T>): AdapterGroup<T> =>
  ({ ...group, adapters: [...group.adapters].sort((a, b) => a.title.localeCompare(b.title)) });

/**
 * The adapters by the plugin that registers them, each under its plugin's
 * title: the host's own first, then the plugins by title, and each group's
 * adapters by title. `needle` keeps those whose title, description or plugin
 * holds it.
 */
export function adapterGroups<T extends Pickable>(adapters: readonly T[], labelOf: (plugin: string) => string, needle = ''): AdapterGroup<T>[] {
  const wanted = needle.trim().toLowerCase();
  const groups = new Map<string, AdapterGroup<T>>();
  for (const adapter of adapters) {
    const label = labelOf(adapter.plugin);
    if (!matches(adapter, label, wanted)) continue;
    const group = groups.get(adapter.plugin) ?? { key: adapter.plugin, label, adapters: [] };
    group.adapters.push(adapter);
    groups.set(adapter.plugin, group);
  }
  const rank = (group: AdapterGroup<T>): number => (group.key === 'host' ? 0 : 1);
  return [...groups.values()].map(byTitle).sort((a, b) => rank(a) - rank(b) || a.label.localeCompare(b.label));
}

/**
 * The adapters by the types of capability they declare, one under each of its
 * types, and one that declares none under `none`. A type is headed by
 * `typeLabel(type, title)`, where `title` is the host's title for its first
 * capability of that type. The groups are by heading with `none` last, and
 * each group's adapters by title. `needle` keeps adapters as `adapterGroups`
 * does, and every adapter of a group whose heading or type holds it.
 */
export function capabilityGroups<T extends Pickable>(adapters: readonly T[], typeLabel: (type: string, title: string) => string, pluginLabel: (plugin: string) => string, none: string, needle = ''): AdapterGroup<T>[] {
  const wanted = needle.trim().toLowerCase();
  const groups = new Map<string, AdapterGroup<T>>();
  const add = (key: string, label: string, adapter: T): void => {
    const group = groups.get(key) ?? { key, label, adapters: [] };
    if (!group.adapters.includes(adapter)) group.adapters.push(adapter);
    groups.set(key, group);
  };
  // A group's heading also matches: `models` keeps every adapter under "Serves models".
  const heads = (label: string): boolean => label.toLowerCase().includes(wanted);
  for (const adapter of adapters) {
    const own = matches(adapter, pluginLabel(adapter.plugin), wanted);
    const capabilities = adapter.capabilities ?? [];
    if (capabilities.length === 0 && (own || heads(none))) add('', none, adapter);
    for (const capability of capabilities) {
      const key = `type:${capability.type}`;
      const label = groups.get(key)?.label ?? typeLabel(capability.type, capability.title);
      if (own || heads(label) || heads(capability.type)) add(key, label, adapter);
    }
  }
  const rank = (group: AdapterGroup<T>): number => (group.key === '' ? 1 : 0);
  return [...groups.values()].map(byTitle).sort((a, b) => rank(a) - rank(b) || a.label.localeCompare(b.label));
}

/** The words the owner choices are named with. */
export interface OwnerWords {
  me: string;
  team: (team: string) => string;
  user: (user: string) => string;
  host: string;
}

/** Every user and team a host lists, which a root connection may name as an owner. */
export interface Everyone {
  users: readonly string[];
  teams: readonly string[];
}

/** Whether grants hold one, by ahpd's rule for an operation: itself, or a wildcard in either place. */
export const holds = (grants: readonly string[], grant: string): boolean => {
  const { subject, operation } = grantParts(grant);
  return [grant, `${EVERY}:${EVERY}`, `${EVERY}:${operation}`, `${subject}:${EVERY}`].some((one) => grants.includes(one));
};

/**
 * Whose a connector may be, by ahpd's owner rule. Every owner takes
 * `connector:put`; then the person's own, each team they are on, and the
 * host's while they also hold `connector:host`. An agent's owner follows the
 * same rule under `subject` `agent`. A root connection has no
 * record and, as ahpd lets it, may make the host's, any user's and any team's. `current` is kept among them, so a
 * connector made by someone else still shows whose it is.
 */
export function ownerChoices(me: ConnectorOwner | undefined, user: ListedUser | undefined, words: OwnerWords, current?: ConnectorOwner, everyone?: Everyone, subject: 'connector' | 'agent' = 'connector'): EnumOption[] {
  const grants = user?.grants ?? [];
  const choices: EnumOption[] = [];
  if (me === undefined) {
    choices.push({ value: 'host', label: words.host });
    for (const id of [...(everyone?.users ?? [])].sort()) choices.push({ value: `user:${id}`, label: words.user(id) });
    for (const team of [...(everyone?.teams ?? [])].sort()) choices.push({ value: `team:${team}`, label: words.team(team) });
  }
  else if (holds(grants, `${subject}:put`)) {
    choices.push({ value: me, label: words.me });
    const teams = [...new Set((user?.memberships ?? []).map((one) => membershipParts(one).team))].sort();
    for (const team of teams) choices.push({ value: `team:${team}`, label: words.team(team) });
    if (holds(grants, `${subject}:host`)) choices.push({ value: 'host', label: words.host });
  }
  if (current !== undefined && !choices.some((one) => one.value === current)) {
    choices.push({ value: current, label: current.startsWith('team:') ? words.team(current.slice('team:'.length)) : current === 'host' ? words.host : words.user(current.slice('user:'.length)) });
  }
  return choices;
}


/** The fields an adapter's schema marks `writeOnly`: its secrets. */
export function secretFields(schema: Bag): string[] {
  return Object.entries(bagOf(schema.properties))
    .filter(([, field]) => bagOf(field).writeOnly === true)
    .map(([name]) => name);
}

/**
 * An adapter's schema as the form draws it: each secret a password, and, where the
 * connector holds one, a description that says it is kept.
 */
export function adapterSchema(schema: Bag, held: Bag, keptWord: string): JsonSchemaObject {
  const secrets = secretFields(schema);
  if (secrets.length === 0) return schema as JsonSchemaObject;
  const properties = { ...bagOf(schema.properties) };
  for (const name of secrets) {
    const field = bagOf(properties[name]);
    properties[name] = { ...field, format: 'password', ...(isSecretRef(held[name]) ? { description: keptWord } : {}) };
  }
  return { ...schema, properties } as JsonSchemaObject;
}

/** A held config as the form shows it: each kept secret empty, since the host never lists its value. */
export function configForForm(config: Bag): Bag {
  return Object.fromEntries(Object.entries(config).map(([field, value]) => [field, isSecretRef(value) ? '' : value]));
}

/**
 * The config a put sends. A secret left empty goes as `""`, which keeps the
 * one the host stores; left out, the host would drop it.
 */
export function configForPut(config: Bag, schema: Bag): Bag {
  const out: Bag = { ...config };
  for (const name of secretFields(schema)) {
    if (out[name] === undefined || out[name] === null) out[name] = '';
  }
  return out;
}
