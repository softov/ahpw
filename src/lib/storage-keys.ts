import { embedder, embedMode } from '../shell/embed/index.js';

/**
 * The storage key of what belongs to one host: its tabs, its layout, its added
 * folders. In a browser the origin is the host, so the key is as given; an
 * embedder serves every host from one origin, so the key carries the page's
 * host address (decision: ahpw keeps a host's pages under the host's address).
 * A window with every host has no one address, so its key carries `*`.
 */
export function hostKey(key: string): string {
  if (embedder === undefined) return key;
  return `${key}@${embedMode() === 'multi' ? '*' : embedder.hostUrl}`;
}

/** The storage key of what one host has in a window: `hostKey(key)`, and with every host, one per host. */
export function perHostKey(key: string, host: string): string {
  return embedMode() === 'multi' ? `${hostKey(key)}:${host}` : hostKey(key);
}
