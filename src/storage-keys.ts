import { embedder } from './embed/index.js';

/**
 * The storage key of what belongs to one host: its tabs, its layout, its added
 * folders. In a browser the origin is the host, so the key is as given; an
 * embedder serves every host from one origin, so the key carries the page's
 * host address (decision: ahpw keeps a host's pages under the host's address).
 */
export function hostKey(key: string): string {
  return embedder === undefined ? key : `${key}@${embedder.hostUrl}`;
}
