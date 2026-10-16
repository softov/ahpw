import type { BindingPath, ReactiveStore } from '@softov/scena/types';
import { hostKey } from '../../lib/storage-keys.js';

/** The pinned sessions, as `refKey(host, resource)`; the person's own mark, never sent to a host. */
export const SESSIONS_PINS = '$/ahp/sessions/pins' as BindingPath;

/** Where the pins are kept, per window. */
export const PINS_KEY = hostKey('ahpd-web.session-pins');

export function readPins(): string[] {
  try {
    const held = JSON.parse(localStorage.getItem(PINS_KEY) ?? '[]') as unknown;
    return Array.isArray(held) ? held.filter((one): one is string => typeof one === 'string') : [];
  } catch {
    return [];
  }
}

function writePins(pins: readonly string[]): void {
  try {
    localStorage.setItem(PINS_KEY, JSON.stringify(pins));
  } catch {
    // Not kept, which only means the pins last as long as the page.
  }
}

/** The pins with `key` added, or taken out when it is there. */
export function toggled(pins: readonly string[], key: string): string[] {
  return pins.includes(key) ? pins.filter((one) => one !== key) : [...pins, key];
}

/** Pin or unpin the session `key`, in the store and in storage. */
export function togglePin(store: ReactiveStore, key: string): void {
  const next = toggled(store.get<string[]>(SESSIONS_PINS) ?? [], key);
  store.set(SESSIONS_PINS, next);
  writePins(next);
}
