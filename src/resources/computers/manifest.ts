/**
 * The computer create form, from the schema the host's `computer` provider
 * sends as its manifest. ahpd names a field's choices in `x-choices`, which
 * scena's form reads as `x-enumOptions`.
 */

import type { JsonSchemaObject } from '@softov/scena/ui';

function bag(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

/**
 * The manifest as the form draws it: `x-choices` as `x-enumOptions`, and a
 * field with one allowed value left out, since there is nothing to choose.
 */
export function formSchema(manifest: Record<string, unknown> | undefined): JsonSchemaObject {
  const properties: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(bag(manifest?.properties) ?? {})) {
    const field = bag(value);
    if (field === null) continue;
    if (Array.isArray(field.enum) && field.enum.length === 1) continue;
    const { 'x-choices': choices, ...rest } = field;
    properties[key] = Array.isArray(choices)
      ? {
        ...rest,
        'x-enumOptions': choices.map(bag).filter((one) => one !== null && typeof one.value === 'string').map((one) => ({
          value: one!.value as string,
          label: typeof one!.title === 'string' ? one!.title : one!.value as string,
          ...(typeof one!.description === 'string' ? { description: one!.description } : {}),
        })),
      }
      : rest;
  }
  return { type: 'object', properties } as JsonSchemaObject;
}

/** What the host is sent: the answers, trimmed, with blank ones left out so the host's defaults apply. */
export function manifestBody(values: Record<string, unknown>): Record<string, unknown> {
  const body: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(values)) {
    if (typeof value === 'string') {
      if (value.trim() !== '') body[key] = value.trim();
    } else if (Array.isArray(value)) {
      const kept = value.filter((one) => typeof one !== 'string' || one.trim() !== '').map((one) => (typeof one === 'string' ? one.trim() : one));
      if (kept.length > 0) body[key] = kept;
    } else if (value !== undefined && value !== null) {
      body[key] = value;
    }
  }
  return body;
}

/** Why a host would refuse this computer name, as a word under `computers/new/`; undefined when it would take it. */
export function nameProblem(name: string): 'nameEmpty' | 'nameSlash' | 'nameDots' | undefined {
  const trimmed = name.trim();
  if (trimmed === '') return 'nameEmpty';
  if (/[\\/?]/.test(trimmed)) return 'nameSlash';
  if (trimmed === '.' || trimmed === '..') return 'nameDots';
  return undefined;
}
