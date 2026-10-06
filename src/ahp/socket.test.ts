import { describe, expect, it } from 'vitest';
import { socketUrl } from './socket.js';

describe('socketUrl', () => {
  it('is the root of the host that served the page', () => {
    expect(socketUrl('abc', { protocol: 'http:', host: '127.0.0.1:9187' }, false)).toBe('ws://127.0.0.1:9187/?tkn=abc');
  });

  it('is wss behind https', () => {
    expect(socketUrl('abc', { protocol: 'https:', host: 'host.example' }, false)).toBe('wss://host.example/?tkn=abc');
  });

  it('is the proxied path on the dev server', () => {
    expect(socketUrl('abc', { protocol: 'http:', host: '127.0.0.1:5180' }, true)).toBe('ws://127.0.0.1:5180/ahp?tkn=abc');
  });

  it('encodes the token', () => {
    expect(socketUrl('a b&c', { protocol: 'http:', host: 'h' }, false)).toBe('ws://h/?tkn=a%20b%26c');
  });

  it('carries no query without a token', () => {
    expect(socketUrl(null, { protocol: 'http:', host: 'h' }, false)).toBe('ws://h/');
  });
});
