import type { SessionSummary } from '@microsoft/agent-host-protocol';

/**
 * What ahpw knows of each session newer than the SDK's session cache.
 *
 * `@microsoft/agent-host-protocol` 1.0.0 folds `root/sessionSummaryChanged`
 * into its cache field by field, and copies only some fields: `changes`,
 * `annotations`, `defaultChat`, `lifecycle` and others keep the value the
 * session was first listed with. Its rows are then wrong until the next
 * connection lists the sessions again: a session's diff counts stay stale, and
 * a list ahpw read itself is overwritten by the cache on the next host event.
 *
 * So every field a change names is kept here, a list ahpw reads replaces what
 * is kept, and the SDK's rows are read with it laid over them. Keyed by session
 * URI, so one map holds one host's sessions; the data layer keeps one per host.
 * Pure: each function returns a new map.
 */
export type Newer = ReadonlyMap<string, Partial<SessionSummary>>;

export const NOTHING_NEWER: Newer = new Map();

/** The root notifications that change the session list, as `multi.events()` delivers them. */
export type SummaryEvent =
  | { type: 'sessionAdded'; params: { summary: SessionSummary } }
  | { type: 'sessionRemoved'; params: { session: string } }
  | { type: 'sessionSummaryChanged'; params: { session: string; changes: Partial<SessionSummary> } };

/** Keep what one notification says. A change names only the fields that changed. */
export function heard(newer: Newer, event: SummaryEvent): Newer {
  const next = new Map(newer);
  if (event.type === 'sessionAdded') next.delete(event.params.summary.resource);
  else if (event.type === 'sessionRemoved') next.delete(event.params.session);
  else next.set(event.params.session, { ...newer.get(event.params.session), ...event.params.changes });
  return next;
}

/** A list read from the host is the newest word on every session in it. */
export function listed(items: readonly SessionSummary[]): Newer {
  return new Map(items.map((summary) => [summary.resource, summary]));
}

/** The SDK's row with what is kept for it laid over; the same row when nothing is. */
export function laid(summary: SessionSummary, newer: Newer): SessionSummary {
  const kept = newer.get(summary.resource);
  return kept === undefined ? summary : { ...summary, ...kept };
}
