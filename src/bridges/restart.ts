/** The host's own restart, which ahpd offers as `x-ahpd/restart`. */

import { RpcError } from '@microsoft/agent-host-protocol/client';
import { hostBridge } from './data.js';
import type { Offers } from './offers.js';

/** The method that stops the host and starts it again with the line it was started with. */
export const RESTART = 'x-ahpd/restart';

/** The code a host refuses a caller with who may never restart it; forcing changes nothing. */
const REFUSED = -32009;

/** What the host answers once it has agreed to restart. */
export interface Restarting {
  restarting: true;
  pid: number;
}

/** Whether the host offers its restart. */
export const mayRestart = (offers: Offers): boolean => offers.methods.includes(RESTART);

/** Asks the host to restart; `force` restarts it while a turn is running. */
export async function restartHost(host: string, force = false): Promise<Restarting> {
  return await hostBridge(host).request(RESTART as never, (force ? { force: true } : {}) as never) as Restarting;
}

/** Whether forcing could change a refusal: every refusal but the one of a caller who may never restart. */
export const mayForce = (caught: unknown): boolean => !(caught instanceof RpcError && caught.code === REFUSED);
