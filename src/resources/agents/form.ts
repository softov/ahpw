/**
 * What the agent form draws and sends. The top is ahpw's own: the name, the
 * id, the owner, the description and the model. Below it, the engine's schema,
 * as the host lists it, with its key variables drawn as one password field
 * each in place of their place in `env`. A secret the host stores is never
 * listed back: its field is empty, and an empty one sent as `""` keeps it.
 */

import type { EnumOption, JsonSchemaObject } from '@softov/scena/ui';
import type { EngineRow, AgentOwner, AgentRow, AgentWanted } from '../../bridges/agents.js';
import { isSecretRef } from '../../bridges/connectors.js';
import type { Icon } from '../../bridges/icons.js';
import { adapterSchema, configForForm, configForPut, secretFields } from '../connectors/form.js';

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
 * The engine's schema as the form draws it. Each `writeOnly` field is a
 * password; each key variable is a password field of its own, under its name;
 * a `hostOnly` field is left out of a record the host does not own.
 */
export function engineSchema(engine: EngineRow, held: Bag, owner: string, keptWord: string): JsonSchemaObject {
  const drawn = adapterSchema(engine.schema, held, keptWord) as Bag;
  const properties = { ...bagOf(drawn.properties) };
  if (owner !== 'host') {
    for (const field of engine.hostOnly ?? []) delete properties[field];
    // Only the key variables are any owner's to set, and they are drawn below.
    if ((engine.keyVariables ?? []).length > 0) delete properties.env;
  }
  const env = bagOf(held.env);
  for (const name of engine.keyVariables ?? []) {
    properties[name] = { type: 'string', title: name, format: 'password', ...(isSecretRef(env[name]) ? { description: keptWord } : {}) };
  }
  return { ...drawn, properties } as JsonSchemaObject;
}

/** A held config as the form shows it: each kept secret empty, and each key variable lifted out of `env`. */
export function agentConfigForForm(engine: EngineRow | undefined, config: Bag): Bag {
  const keys = engine?.keyVariables ?? [];
  const shown = configForForm(config);
  if (keys.length === 0) return shown;
  const env = bagOf(config.env);
  const rest = Object.fromEntries(Object.entries(env).filter(([name]) => !keys.includes(name)));
  const { env: _env, ...others } = shown;
  return {
    ...others,
    ...(Object.keys(rest).length === 0 ? {} : { env: rest }),
    ...Object.fromEntries(keys.map((name) => [name, isSecretRef(env[name]) ? '' : env[name] ?? ''])),
  };
}

/**
 * The config a put sends. A `writeOnly` field left empty goes as `""`. A key
 * variable goes back into `env`: typed, as its value; empty, as `""` where the
 * host stores one, and left out where it stores none. A `hostOnly` field is
 * left out of a record the host does not own.
 */
export function agentConfigForPut(engine: EngineRow, form: Bag, held: Bag, owner: string): Bag {
  const keys = engine.keyVariables ?? [];
  const values = Object.fromEntries(Object.entries(form).filter(([name]) => !keys.includes(name)));
  const out = configForPut(values, engine.schema);
  if (owner !== 'host') for (const field of engine.hostOnly ?? []) delete out[field];
  if (keys.length === 0) return out;
  const stored = bagOf(held.env);
  const env: Bag = owner === 'host' ? { ...bagOf(out.env) } : {};
  for (const name of keys) {
    const typed = form[name];
    if (typeof typed === 'string' && typed !== '') env[name] = typed;
    else if (isSecretRef(stored[name])) env[name] = '';
  }
  delete out.env;
  return Object.keys(env).length === 0 ? out : { ...out, env };
}

/** Whether an engine's form has a secret field, so its Settings say how a kept one is shown. */
export const hasSecrets = (engine: EngineRow): boolean => secretFields(engine.schema).length > 0 || (engine.keyVariables ?? []).length > 0;

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
    config: agentConfigForForm(engine, bagOf(template?.config)),
    ...(template?.icon === undefined ? {} : { icon: template.icon }),
  };
}
