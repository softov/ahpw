import { describe, expect, it } from 'vitest';
import { addressOf } from './address.js';

describe('addressOf', () => {
  it('adds https to a bare host', () => {
    expect(addressOf('example.com')).toBe('https://example.com/');
    expect(addressOf('  example.com/docs?q=1  ')).toBe('https://example.com/docs?q=1');
  });

  it('adds http to a host on this machine', () => {
    expect(addressOf('localhost:5173')).toBe('http://localhost:5173/');
    expect(addressOf('127.0.0.1:8080/app')).toBe('http://127.0.0.1:8080/app');
  });

  it('keeps a full http or https address', () => {
    expect(addressOf('https://example.com/a#b')).toBe('https://example.com/a#b');
    expect(addressOf('HTTP://Example.com')).toBe('http://example.com/');
  });

  it('refuses a scheme other than http and https', () => {
    expect(addressOf('javascript:alert(1)')).toBeNull();
    expect(addressOf('data:text/html,<p>hi</p>')).toBeNull();
    expect(addressOf('file:///etc/passwd')).toBeNull();
    expect(addressOf('ftp://example.com')).toBeNull();
  });

  it('refuses empty text and text with spaces', () => {
    expect(addressOf('')).toBeNull();
    expect(addressOf('   ')).toBeNull();
    expect(addressOf('two words')).toBeNull();
  });
});
