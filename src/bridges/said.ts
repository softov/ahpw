import { RpcError } from '@microsoft/agent-host-protocol/client';

/** What the protocol client puts before the host's own sentence: `RPC error <code>: `. */
const RPC_PREFIX = /^RPC error -?\d+: /;

/**
 * What a failure says, in the host's own words: an `RpcError`'s message
 * without the code the protocol client puts before it, which a person reading
 * a note has no use for. Any other error is its message as it is.
 */
export function hostSaid(caught: unknown): string {
  if (caught instanceof RpcError) return caught.message.replace(RPC_PREFIX, '');
  return caught instanceof Error ? caught.message : String(caught);
}
