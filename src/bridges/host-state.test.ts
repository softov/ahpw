import { describe, expect, it } from 'vitest';
import { hostFix, hostState } from './host-state.js';
import type { Connection } from './data.js';

const on = (status: Connection['status']): Connection => ({ status, error: null, generation: 1 });

describe('hostState', () => {
  it('maps each connection state', () => {
    expect(hostState(on('connected'), undefined)).toBe('connected');
    expect(hostState(on('connecting'), undefined)).toBe('connecting');
    expect(hostState(undefined, undefined)).toBe('connecting');
    expect(hostState(on('reconnecting'), false)).toBe('down');
    expect(hostState(on('disconnected'), undefined)).toBe('down');
    expect(hostState(on('failed'), false)).toBe('down');
  });

  it('is refused while the host refuses the token, until it connects', () => {
    expect(hostState(on('failed'), true)).toBe('refused');
    expect(hostState(on('reconnecting'), true)).toBe('refused');
    expect(hostState(on('connected'), true)).toBe('connected');
  });
});

describe('hostFix', () => {
  it('offers sign in when refused, retry when down, and nothing otherwise', () => {
    expect(hostFix('refused')).toBe('hosts/signIn');
    expect(hostFix('down')).toBe('hosts/retry');
    expect(hostFix('connecting')).toBeNull();
    expect(hostFix('connected')).toBeNull();
  });
});
