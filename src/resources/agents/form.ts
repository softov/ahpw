/**
 * What the agent form draws and sends. The top is ahpw's own: the name, the
 * id, the owner, the description and the model. Below it, the engine's schema,
 * as the host lists it, in its own shape, each `writeOnly` field a password. A
 * secret the host stores is never listed back: its field is empty, and an empty
 * one sent as `""` keeps it.
 */

import type { EnumOption, JsonSchemaObject } from '@softov/scena/ui';
import type { EngineRow, AgentOwner, AgentRow, AgentWanted } from '../../bridges/agents.js';
import { isSecretRef } from '../../bridges/connectors.js';
import type { Icon } from '../../bridges/icons.js';
import { configForPut } from '../connectors/form.js';

type Bag = Record<string, unknown>;

const bagOf = (value: unknown): Bag => (typeof value === 'object' && value !== null && !Array.isArray(value) ? (value as Bag) : {});

/** The top of the form: name, id, owner, description, model. */
export interface AgentTop {
  id: string;
  owner: string;
  name: string;
  description: string;
  model: string;
}

/** The words the top schema is drawn with. */
export interface AgentTopWords {
  name: string;
  id: string;
  idHint: string;
  owner: string;
  description: string;
  model: string;
  modelHint: string;
  /** The model choice that names none, so the agent picks its own. */
  modelDefault: string;
}

/**
 * The top schema; a made agent has its id fixed, so its form draws no id. The
 * model is a choice among `models` when the host lists the agent's, and free
 * text otherwise.
 */
export function agentTopSchema(owners: readonly EnumOption[], editing: boolean, words: AgentTopWords, models: readonly EnumOption[] = []): JsonSchemaObject {
  const choices = [{ value: '', label: words.modelDefault }, ...models];
  const properties: Bag = {
    name: { type: 'string', title: words.name },
    ...(editing ? {} : { id: { type: 'string', title: words.id, description: words.idHint } }),
    owner: { type: 'string', title: words.owner, enum: owners.map((one) => one.value), 'x-enumOptions': [...owners] },
    description: { type: 'string', title: words.description },
    model: models.length === 0
      ? { type: 'string', title: words.model, description: words.modelHint }
      : { type: 'string', title: words.model, enum: choices.map((one) => one.value), 'x-enumOptions': choices },
  };
  return { type: 'object', properties, required: editing ? ['name', 'owner'] : ['name', 'id', 'owner'] } as JsonSchemaObject;
}

/** The values a form for `engine` starts from: a made agent's own, or a template's. */
export function topOf(record: AgentRow | undefined, owner: string): AgentTop {
  return {
    id: record?.id ?? '',
    owner: record?.owner ?? owner,
    name: record?.name ?? '',
    description: record?.description ?? '',
    model: record?.model ?? '',
  };
}

/**
 * A schema with each `writeOnly` field, at any depth and as a map's values,
 * drawn as a password. Where `held` keeps a secret at that field, its
 * description says it is kept.
 */
function passwords(schema: Bag, held: unknown, keptWord: string): Bag {
  const out: Bag = { ...schema };
  if (schema.writeOnly === true) {
    out.format = 'password';
    if (isSecretRef(held)) out.description = keptWord;
  }
  const properties = bagOf(schema.properties);
  if (Object.keys(properties).length > 0) {
    out.properties = Object.fromEntries(Object.entries(properties).map(([name, field]) => [name, passwords(bagOf(field), bagOf(held)[name], keptWord)]));
  }
  const values = schema.additionalProperties;
  if (typeof values === 'object' && values !== null) out.additionalProperties = passwords(values as Bag, undefined, keptWord);
  return out;
}

/**
 * The engine's schema as the form draws it: as the host lists it, with each
 * `writeOnly` field a password. A `hostOnly` field is left out of a record the
 * host does not own.
 */
export function engineSchema(engine: EngineRow, held: Bag, owner: string, keptWord: string): JsonSchemaObject {
  const drawn = passwords(engine.schema, held, keptWord);
  if (owner === 'host' || (engine.hostOnly ?? []).length === 0) return drawn as JsonSchemaObject;
  const properties = { ...bagOf(drawn.properties) };
  for (const field of engine.hostOnly ?? []) delete properties[field];
  return { ...drawn, properties } as JsonSchemaObject;
}

/** A held config as the form shows it: the same shape, with each kept secret empty, since the host never lists its value. */
export function agentConfigForForm(config: Bag): Bag {
  const shown = (value: unknown): unknown => {
    if (isSecretRef(value)) return '';
    if (typeof value !== 'object' || value === null || Array.isArray(value)) return value;
    return Object.fromEntries(Object.entries(value as Bag).map(([name, one]) => [name, shown(one)]));
  };
  return shown(config) as Bag;
}

/**
 * Each secret `held` keeps, at any depth, sent as `""` where the form leaves it
 * empty, so the host keeps it.
 */
function keepSecrets(form: Bag, held: Bag): Bag {
  const out: Bag = { ...form };
  for (const [name, value] of Object.entries(held)) {
    if (isSecretRef(value)) {
      if (out[name] === undefined || out[name] === null) out[name] = '';
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      const inner = out[name];
      if (inner === undefined || (typeof inner === 'object' && inner !== null && !Array.isArray(inner))) out[name] = keepSecrets(bagOf(inner), value as Bag);
    }
  }
  return out;
}

/**
 * The config a put sends, in the shape the form holds. A top `writeOnly` field
 * left empty goes as `""`, and so does each secret the record keeps at any
 * depth, which keeps the one stored. A `hostOnly` field is left out of a record
 * the host does not own.
 */
export function agentConfigForPut(engine: EngineRow, form: Bag, held: Bag, owner: string): Bag {
  const out = keepSecrets(configForPut(form, engine.schema), held);
  if (owner !== 'host') for (const field of engine.hostOnly ?? []) delete out[field];
  return out;
}

/** Whether an engine's form has a secret field, so its Settings say how a kept one is shown. */
export function hasSecrets(engine: EngineRow): boolean {
  const any = (schema: Bag): boolean =>
    schema.writeOnly === true
    || Object.values(bagOf(schema.properties)).some((field) => any(bagOf(field)))
    || (typeof schema.additionalProperties === 'object' && schema.additionalProperties !== null && any(schema.additionalProperties as Bag));
  return any(engine.schema);
}

/** What a put sends for a form: the top trimmed, the config made from the engine, and the icon the agent has. */
export function agentWanted(engine: EngineRow, top: AgentTop, form: Bag, held: Bag, icon?: Icon): AgentWanted {
  return {
    ...(icon === undefined ? {} : { icon }),
    id: top.id,
    engine: engine.name,
    owner: top.owner as AgentOwner,
    name: top.name.trim(),
    description: top.description.trim(),
    model: top.model.trim(),
    config: agentConfigForPut(engine, form, held, top.owner),
  };
}

/** What a new record of an engine starts from: its template at `at`, or a blank record for -1. */
export function startOf(engine: EngineRow, at: number): { top: Pick<AgentTop, 'name' | 'description' | 'model'>; config: Bag; icon?: Icon } {
  const template = at === -1 ? undefined : engine.templates?.[at];
  return {
    top: { name: template?.name ?? '', description: template?.description ?? '', model: template?.model ?? '' },
    config: agentConfigForForm(bagOf(template?.config)),
    ...(template?.icon === undefined ? {} : { icon: template.icon }),
  };
}
