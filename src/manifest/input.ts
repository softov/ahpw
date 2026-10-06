import type { JsonSchemaField, JsonSchemaObject } from '@softov/scena/ui';
import type { ManifestCommand, ManifestOption } from './types.js';

/** One value a command takes, from its pattern or its options. */
export interface Field {
  /** The name the request carries it under. */
  name: string;
  schema: JsonSchemaField;
  description?: string;
  required: boolean;
  /** Repeatable option or variadic argument: sent as a list. */
  list: boolean;
}

/** An HTTP call, ready for `fetch` relative to the API root. */
export interface CommandRequest {
  method: ManifestCommand['http']['method'];
  /** Path and query, below `/api`. */
  path: string;
  contentType?: string;
  body?: string;
}

/** Thrown when a command cannot be sent without a value that was not given. */
export class MissingInput extends Error {
  public constructor(public readonly field: string) {
    super(`${field} is required`);
    this.name = 'MissingInput';
  }
}

const PARAMETER = /\{([^}]+)\}/gu;

/** The `{name}` parameters in a binding's path. */
export function pathParameters(command: ManifestCommand): string[] {
  return [...command.http.path.matchAll(PARAMETER)].map((match) => match[1] as string);
}

/** The group a command is listed under: its declared one, or the first part of its id. */
export function groupOf(command: ManifestCommand): string {
  return command.group ?? command.id.split('.')[0] ?? command.id;
}

/** `--no-enable` as `noEnable`, for an option that names no field. */
function fieldNameOf(option: ManifestOption): string {
  return option.field ?? option.name.replace(/^-+/u, '').replace(/-([a-z])/gu, (_m, c: string) => c.toUpperCase());
}

/**
 * Every value a command takes, arguments first in pattern order, then options.
 *
 * A path parameter is required whatever the pattern says, because the route
 * does not match without it.
 */
export function fieldsOf(command: ManifestCommand): Field[] {
  const inPath = new Set(pathParameters(command));
  const fields: Field[] = [];
  for (const word of command.pattern) {
    if (!word.startsWith(':')) continue;
    const variadic = word.endsWith('...');
    const body = variadic ? word.slice(1, -3) : word.slice(1);
    const optional = body.endsWith('?');
    const name = optional ? body.slice(0, -1) : body;
    const declared = command.arguments?.[name];
    const description = declared?.description ?? declared?.schema.description;
    fields.push({
      name,
      schema: declared?.schema ?? { type: 'string' },
      ...(description === undefined ? {} : { description }),
      required: !optional || inPath.has(name),
      list: variadic,
    });
  }
  for (const option of command.options ?? []) {
    const name = fieldNameOf(option);
    fields.push({
      name,
      schema: option.schema,
      description: option.description,
      required: option.required === true || inPath.has(name),
      list: option.repeatable === true,
    });
  }
  return fields;
}

/** Whether a command can run with nothing filled in. */
export function needsInput(command: ManifestCommand): boolean {
  return fieldsOf(command).some((field) => field.required);
}

/** A command's inputs as one JSON Schema object, for a form to draw. */
export function schemaOf(command: ManifestCommand): JsonSchemaObject {
  const properties: Record<string, JsonSchemaField> = {};
  const required: string[] = [];
  for (const field of fieldsOf(command)) {
    const { description: _drop, ...schema } = field.schema;
    const one: JsonSchemaField = field.list ? { type: 'array', items: schema } : schema;
    properties[field.name] = {
      ...one,
      title: field.name,
      ...(field.description === undefined ? {} : { description: field.description }),
    };
    if (field.required) required.push(field.name);
  }
  return { type: 'object', properties, required };
}

/** A form's value with what was left empty taken out: blank text, unchecked flags, empty lists. */
export function cleanInput(values: Readonly<Record<string, unknown>>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [name, value] of Object.entries(values)) {
    if (value === undefined || value === null || value === false) continue;
    if (typeof value === 'string') {
      if (value.trim() !== '') out[name] = value;
      continue;
    }
    if (Array.isArray(value)) {
      const kept = value.filter((one) => one !== undefined && one !== null && !(typeof one === 'string' && one.trim() === ''));
      if (kept.length > 0) out[name] = kept;
      continue;
    }
    out[name] = value;
  }
  return out;
}

/**
 * The request a command and its input make.
 *
 * The same placement `@cofold/remote`'s own transport uses: path parameters
 * fill the path, a GET or DELETE sends the rest as the query, anything else
 * sends it as the body unless the binding names the query or body itself.
 */
export function requestOf(command: ManifestCommand, values: Readonly<Record<string, unknown>>): CommandRequest {
  const binding = command.http;
  const input = cleanInput(values);
  for (const field of fieldsOf(command)) {
    if (field.required && input[field.name] === undefined) throw new MissingInput(field.name);
  }
  const inPath = pathParameters(command);
  const path = binding.path.replaceAll(PARAMETER, (_match, name: string) => encodeURIComponent(String(input[name])));
  const left = Object.keys(input).filter((name) => !inPath.includes(name));
  const carries = binding.method !== 'GET' && binding.method !== 'DELETE';
  const query = binding.query ?? (carries ? [] : left);
  const explicit = (binding.body ?? []).filter((name) => name !== '*');
  const rest = binding.body === undefined ? carries : binding.body.includes('*');
  const body = carries ? left.filter((name) => !query.includes(name) && (rest || explicit.includes(name))) : [];

  const search = new URLSearchParams();
  for (const name of query) {
    const value = input[name];
    if (value === undefined) continue;
    for (const one of Array.isArray(value) ? value : [value]) search.append(name, String(one));
  }
  const url = search.size === 0 ? path : `${path}?${search.toString()}`;
  if (!carries) return { method: binding.method, path: url };

  const fields = Object.fromEntries(body.map((name) => [name, input[name]]));
  if (binding.contentType === 'application/x-www-form-urlencoded') {
    const form = new URLSearchParams();
    for (const [name, value] of Object.entries(fields)) {
      for (const one of Array.isArray(value) ? value : [value]) {
        form.append(name, typeof one === 'object' ? JSON.stringify(one) : String(one));
      }
    }
    return { method: binding.method, path: url, contentType: binding.contentType, body: form.toString() };
  }
  return { method: binding.method, path: url, contentType: 'application/json', body: JSON.stringify(fields) };
}
