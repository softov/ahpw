import { fieldsOf } from './input.js';
import type { ManifestCommand, ProgramManifest } from './types.js';

/**
 * What a command is to a client, from its effect and resource alone:
 * `read` without a key lists, `read` with a key gets one, `add` without a key
 * creates, `change` or `remove` with a key acts on one item. Anything else is a
 * plain command: a form and a result.
 */
export type Role = 'list' | 'get' | 'create' | 'item' | 'plain';

export function roleOf(command: ManifestCommand): Role {
  const key = command.resource?.key;
  switch (command.effect) {
    case 'read': return command.resource === undefined ? 'plain' : key === undefined ? 'list' : 'get';
    case 'add': return command.resource !== undefined && key === undefined ? 'create' : 'plain';
    case 'change':
    case 'remove': return key === undefined ? 'plain' : 'item';
    default: return 'plain';
  }
}

/** The commands that act on one item of a kind: its get first, then the rest in manifest order. */
export function itemCommandsOf(manifest: ProgramManifest, kind: string): ManifestCommand[] {
  const ones = manifest.commands.filter((one) => one.resource?.kind === kind && (roleOf(one) === 'get' || roleOf(one) === 'item'));
  return [...ones.filter((one) => roleOf(one) === 'get'), ...ones.filter((one) => roleOf(one) !== 'get')];
}

/** The command that creates an item of a kind, if the program has one. */
export function createOf(manifest: ProgramManifest, kind: string): ManifestCommand | undefined {
  return manifest.commands.find((one) => one.resource?.kind === kind && roleOf(one) === 'create');
}

/**
 * The input that names one row's item to a command acting on it, from the
 * field of the row named by the key. A key that takes a list gets a list of
 * one. `undefined` when the row does not carry the key.
 */
export function keyValuesOf(command: ManifestCommand, row: Readonly<Record<string, unknown>>): Record<string, unknown> | undefined {
  const key = command.resource?.key;
  if (key === undefined || row[key] === undefined || row[key] === null) return undefined;
  const list = fieldsOf(command).find((field) => field.name === key)?.list === true;
  return { [key]: list && !Array.isArray(row[key]) ? [row[key]] : row[key] };
}

/** Whether a command can run with these values, every required field given. */
export function canRunWith(command: ManifestCommand, values: Readonly<Record<string, unknown>>): boolean {
  return fieldsOf(command).every((field) => !field.required || (values[field.name] !== undefined && values[field.name] !== ''));
}

/**
 * Whether a command runs as soon as its page opens: a read that has every
 * value it needs. A manifest that declares no effect falls back to the method.
 */
export function runsOnOpening(command: ManifestCommand, values: Readonly<Record<string, unknown>>): boolean {
  const reads = command.effect === undefined ? command.http.method === 'GET' : command.effect === 'read';
  return reads && canRunWith(command, values);
}

/** The words of the question a removal asks: `Remove user alice?`. */
export function removalQuestion(command: ManifestCommand, values: Readonly<Record<string, unknown>>): string {
  const key = command.resource?.key;
  const named = key === undefined ? undefined : values[key];
  const item = named === undefined ? '' : ` ${Array.isArray(named) ? named.join(', ') : String(named)}`;
  return `Remove ${command.resource?.kind ?? 'this'}${item}?`;
}

/** The command that lists a group's items, if the group has one. */
export function listOf(commands: readonly ManifestCommand[]): ManifestCommand | undefined {
  return commands.find((one) => roleOf(one) === 'list');
}

/** The field that names one item of a kind: the key its get and item actions take. */
export function keyOf(manifest: ProgramManifest, kind: string): string | undefined {
  return itemCommandsOf(manifest, kind)[0]?.resource?.key;
}

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);

/** A list's rows: an array of records, or the one array of an object such as `{ users: [...] }`. */
export function rowsOf(data: unknown): Record<string, unknown>[] | undefined {
  if (Array.isArray(data)) return data.every(isRecord) ? data : undefined;
  if (!isRecord(data)) return undefined;
  const values = Object.values(data);
  return values.length === 1 && Array.isArray(values[0]) && values[0].every(isRecord) ? values[0] : undefined;
}

/** What names a row on screen: its key, or the first text field when the kind has no key. */
export function rowTitle(row: Readonly<Record<string, unknown>>, key: string | undefined): string {
  const named = key === undefined ? undefined : row[key];
  if (named !== undefined && named !== null) return String(named);
  const first = Object.values(row).find((value) => typeof value === 'string' || typeof value === 'number');
  return first === undefined ? '' : String(first);
}

/** The line under a row's title: its other short values, in the order the host sent them. */
export function rowLine(row: Readonly<Record<string, unknown>>, key: string | undefined): string {
  const title = rowTitle(row, key);
  return Object.entries(row)
    .filter(([name, value]) => name !== key && (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') && String(value) !== title && String(value).length <= 60)
    .slice(0, 3)
    .map(([, value]) => String(value))
    .join(' \u{00B7} ');
}

/** One thing that can be done to an item, with the values its row fills in. */
export interface ItemAction {
  command: ManifestCommand;
  values: Record<string, unknown>;
  /** The key is all it needs, so it runs from where it is chosen; otherwise its page opens with the key filled in. */
  direct: boolean;
}

/** What can be done to one row's item: every item command of its kind but the get. */
export function itemActionsOf(manifest: ProgramManifest, kind: string, row: Readonly<Record<string, unknown>>): ItemAction[] {
  return itemCommandsOf(manifest, kind).filter((one) => roleOf(one) === 'item').flatMap((command) => {
    const values = keyValuesOf(command, row);
    return values === undefined ? [] : [{ command, values, direct: canRunWith(command, values) }];
  });
}
