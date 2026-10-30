import { hostBridge, type Connection } from './data.js';
import { embedder } from '../shell/embed/index.js';

/** How a host stands for a window with every host: connected, connecting, down, or refusing the token. */
export type HostState = 'connected' | 'connecting' | 'down' | 'refused';

/** A host's state from its connection and whether it refused the token; one that drops and retries is down. */
export function hostState(connection: Connection | undefined, refused: boolean | undefined): HostState {
  const status = connection?.status ?? 'connecting';
  if (status === 'connected') return 'connected';
  if (refused === true) return 'refused';
  return status === 'connecting' ? 'connecting' : 'down';
}

/** The string key of what a host offers in its state: sign in again when refused, retry when down, nothing otherwise. */
export function hostFix(state: HostState): 'hosts/signIn' | 'hosts/retry' | null {
  if (state === 'refused') return 'hosts/signIn';
  return state === 'down' ? 'hosts/retry' : null;
}

/** What a host that is not connected offers: sign in again, or retry now. */
export function fixHost(host: string, state: HostState): void {
  if (state === 'refused') void embedder?.manageHosts({ edit: host });
  else void hostBridge(host).reconnect();
}
