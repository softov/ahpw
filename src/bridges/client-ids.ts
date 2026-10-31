import type { ClientIdStore } from '@microsoft/agent-host-protocol/hosts';

/** The localStorage key a host's client id is kept under; one per host per browser. */
const keyOf = (hostId: string): string => `ahpw.clientId.${hostId}`;

/**
 * Each host's client id, kept in `localStorage`, so a host sees this browser as
 * the same client after a reload. Storage that refuses gives no id, and the
 * protocol makes a new one.
 */
export const localClientIds: ClientIdStore = {
  async load(hostId) {
    try {
      return localStorage.getItem(keyOf(hostId));
    } catch {
      return null;
    }
  },
  async store(hostId, clientId) {
    try {
      localStorage.setItem(keyOf(hostId), clientId);
    } catch {
      // A browser that keeps nothing gets a new id on the next load.
    }
  },
};
