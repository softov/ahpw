/**
 * What the connector form draws and sends. The top is ahpw's own: the
 * adapter, the id, the title and the owner. Below it, the adapter's own
 * schema, as the host lists it. scena's `SchemaForm` knows no `writeOnly`, so
 * a secret field is drawn as a password, empty: the host never lists a secret
 * back, and an empty one sent as `""` keeps what it stores.
 */

import type { EnumOption, JsonSchemaObject } from '@softov/scena/ui';
import { isSecretRef, type AdapterRow, type ConnectorOwner } from '../../bridges/connectors.js';
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
  adapter: string;
  id: string;
  idHint: string;
  title: string;
  titleHint: string;
  owner: string;
}

/**
 * The top schema. A new connector picks its adapter and id; a made one has
 * both fixed, so its form draws only its title and owner.
 */
export function topSchema(adapters: readonly AdapterRow[], owners: readonly EnumOption[], editing: boolean, words: TopWords): JsonSchemaObject {
  const named = {
    title: { type: 'string', title: words.title, description: words.titleHint },
    owner: { type: 'string', title: words.owner, enum: owners.map((one) => one.value), 'x-enumOptions': [...owners] },
  };
  if (editing) return { type: 'object', properties: named, required: ['owner'] };
  return {
    type: 'object',
    properties: {
      adapter: {
        type: 'string',
        title: words.adapter,
        enum: adapters.map((one) => one.name),
        'x-enumOptions': adapters.map((one) => ({ value: one.name, label: one.title })),
      },
      id: { type: 'string', title: words.id, description: words.idHint },
      ...named,
    },
    required: ['adapter', 'id', 'owner'],
  };
}

/** The words the owner choices are named with. */
export interface OwnerWords {
  me: string;
  team: (team: string) => string;
  host: string;
}

/** Whether grants hold one, by ahpd's rule for an operation: itself, or a wildcard in either place. */
export const holds = (grants: readonly string[], grant: string): boolean => {
  const { subject, operation } = grantParts(grant);
  return [grant, `${EVERY}:${EVERY}`, `${EVERY}:${operation}`, `${subject}:${EVERY}`].some((one) => grants.includes(one));
};

/**
 * Whose a connector may be, by ahpd's owner rule. Every owner takes
 * `connector:put`; then the person's own, each team they are on, and the
 * host's while they also hold `connector:host`. A root connection has no
 * record and may make the host's. `current` is kept among them, so a
 * connector made by someone else still shows whose it is.
 */
export function ownerChoices(me: ConnectorOwner | undefined, user: ListedUser | undefined, words: OwnerWords, current?: ConnectorOwner): EnumOption[] {
  const grants = user?.grants ?? [];
  const choices: EnumOption[] = [];
  if (me === undefined) choices.push({ value: 'host', label: words.host });
  else if (holds(grants, 'connector:put')) {
    choices.push({ value: me, label: words.me });
    const teams = [...new Set((user?.memberships ?? []).map((one) => membershipParts(one).team))].sort();
    for (const team of teams) choices.push({ value: `team:${team}`, label: words.team(team) });
    if (holds(grants, 'connector:host')) choices.push({ value: 'host', label: words.host });
  }
  if (current !== undefined && !choices.some((one) => one.value === current)) {
    choices.push({ value: current, label: current.startsWith('team:') ? words.team(current.slice('team:'.length)) : current === 'host' ? words.host : current.slice('user:'.length) });
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
