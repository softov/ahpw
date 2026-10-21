import { describe, expect, it } from 'vitest';
import { RpcError } from '@microsoft/agent-host-protocol/client';
import { hostSaid } from './said.js';

describe('hostSaid', () => {
  it('is the host sentence of an RpcError, without its code', () => {
    expect(hostSaid(new RpcError(-32009, 'A minted token cannot manage tokens; sign in as yourself.'))).toBe('A minted token cannot manage tokens; sign in as yourself.');
  });

  it('is the message of any other error, and the text of anything else', () => {
    expect(hostSaid(new Error('RPC error -1: kept, not an RpcError'))).toBe('RPC error -1: kept, not an RpcError');
    expect(hostSaid('plain')).toBe('plain');
  });
});
