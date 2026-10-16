import { hostKey } from '../../lib/storage-keys.js';

/** Where the host last picked for something new is kept, per window. */
export const LAST_HOST_KEY = hostKey('ahpd-web.last-host');

/** The host last picked for a new session or automation, or null when none was. */
export function readLastHost(): string | null {
  try {
    return localStorage.getItem(LAST_HOST_KEY);
  } catch {
    return null;
  }
}

export function writeLastHost(id: string): void {
  try {
    localStorage.setItem(LAST_HOST_KEY, id);
  } catch {
    // Not kept, which only means the next one starts on the first host.
  }
}

/** The host to start on: the last one picked while it is still listed, else the first. */
export function startHost(listed: readonly string[], last: string | null): string | undefined {
  return last !== null && listed.includes(last) ? last : listed[0];
}
