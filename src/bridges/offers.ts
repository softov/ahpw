/**
 * What a host's plugins offer beyond AHP, as the `_meta` of its `initialize`
 * answer names them: methods, channels, and resource providers with their
 * create schema. A host that is not ahpd names none.
 */

import { ahpdKey } from './ahpd-meta.js';

/** A resource scheme a plugin serves, such as `computer` or `bot`. */
export interface Provider {
  title: string;
  /** Where its resources start, such as `computer://`. */
  root: string;
  /** What a client may do: `list`, `read`, `write`, `delete`, `watch`; older hosts spell them `get` and `put`. */
  operations: string[];
  /** The JSON schema of what a new resource is made from, when the provider takes one. */
  manifest?: Record<string, unknown>;
}

export interface Offers {
  methods: string[];
  /** What the host says each method does, by its name; a method that says nothing is absent. */
  described: Record<string, string>;
  channels: string[];
  providers: Record<string, Provider>;
  /** Who this connection is, `user:<id>` or `root:<host>`; absent on a host with no users. */
  principal?: string;
}

export const NO_OFFERS: Offers = { methods: [], described: {}, channels: [], providers: {} };

function bag(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

/** The names in a list of `{ <key> }` entries, or in a map keyed by them, as ahpd has sent both. */
function namesOf(value: unknown, key: string): string[] {
  if (Array.isArray(value)) return value.map((one) => bag(one)?.[key]).filter((one): one is string => typeof one === 'string');
  const map = bag(value);
  return map === null ? [] : Object.keys(map);
}

function providerOf(value: unknown): Provider | null {
  const held = bag(value);
  if (held === null || typeof held.root !== 'string') return null;
  const manifest = bag(held.manifest);
  return {
    title: typeof held.title === 'string' ? held.title : '',
    root: held.root,
    operations: Array.isArray(held.operations) ? held.operations.filter((one): one is string => typeof one === 'string') : [],
    ...(manifest === null ? {} : { manifest }),
  };
}

/** Each method's description, from a list of `{ method, description }` entries; a map, as an older ahpd sent, has none. */
function descriptionsOf(value: unknown): Record<string, string> {
  if (!Array.isArray(value)) return {};
  const described: Record<string, string> = {};
  for (const one of value) {
    const entry = bag(one);
    if (typeof entry?.method === 'string' && typeof entry.description === 'string' && entry.description !== '') described[entry.method] = entry.description;
  }
  return described;
}

/** The offers in an `initialize` answer's `_meta`. */
export function offersOf(meta: unknown): Offers {
  const providers: Record<string, Provider> = {};
  for (const [scheme, value] of Object.entries(bag(ahpdKey(meta, 'resourceProviders')) ?? {})) {
    const provider = providerOf(value);
    if (provider !== null) providers[scheme] = provider;
  }
  const principal = ahpdKey(meta, 'principal');
  return {
    methods: namesOf(ahpdKey(meta, 'methods'), 'method'),
    described: descriptionsOf(ahpdKey(meta, 'methods')),
    channels: namesOf(ahpdKey(meta, 'channels'), 'scheme'),
    providers,
    ...(typeof principal === 'string' && principal !== '' ? { principal } : {}),
  };
}

/** Whether a provider allows an operation, under either spelling. */
export function allows(provider: Provider, operation: 'list' | 'read' | 'write' | 'delete' | 'watch'): boolean {
  const also = operation === 'read' ? 'get' : operation === 'write' ? 'put' : operation;
  return provider.operations.includes(operation) || provider.operations.includes(also);
}
