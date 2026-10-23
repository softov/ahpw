import { describe, expect, it } from 'vitest';
import { receiveUrl, type Capability } from './connectors.js';

const CALLS: Capability = { type: 'receive', name: 'calls', title: 'Calls', description: '', path: '/plugins/webhook/{id}' };

describe('receiveUrl', () => {
  it('puts the root before the path and the id in {id}', () => {
    expect(receiveUrl('http://127.0.0.1:9199', CALLS, 'ci')).toBe('http://127.0.0.1:9199/plugins/webhook/ci');
  });

  it('takes a root with or without a trailing /', () => {
    expect(receiveUrl('https://ahpd.example.com/', CALLS, 'ci')).toBe('https://ahpd.example.com/plugins/webhook/ci');
  });

  it('encodes the id', () => {
    expect(receiveUrl('http://h', CALLS, 'a b')).toBe('http://h/plugins/webhook/a%20b');
  });

  it('is nothing for a capability with no path', () => {
    const { path: _path, ...bare } = CALLS;
    expect(receiveUrl('http://h', bare, 'ci')).toBeUndefined();
  });
});
