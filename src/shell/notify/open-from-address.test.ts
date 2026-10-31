import { describe, expect, it } from 'vitest';
import { sessionInAddress, sessionInMessage, withoutSession } from './open-from-address.js';

describe('a session a push opens', () => {
  it('is named by an address with both parameters', () => {
    expect(sessionInAddress('?host=daemon&session=copilot%3A%2Fs1')).toEqual({ host: 'daemon', session: 'copilot:/s1' });
  });

  it('is none for an address with one parameter or none', () => {
    expect(sessionInAddress('?host=daemon')).toBeNull();
    expect(sessionInAddress('?session=copilot%3A%2Fs1')).toBeNull();
    expect(sessionInAddress('')).toBeNull();
  });

  it('leaves the address without both parameters, and keeps the others', () => {
    expect(withoutSession('https://a.test/ahpw/?host=daemon&session=x&theme=dark')).toBe('https://a.test/ahpw/?theme=dark');
  });

  it('is read from the service worker message, and nothing else', () => {
    expect(sessionInMessage({ open: { host: 'daemon', session: 'copilot:/s1' } })).toEqual({ host: 'daemon', session: 'copilot:/s1' });
    expect(sessionInMessage({ open: { host: 'daemon' } })).toBeNull();
    expect(sessionInMessage(null)).toBeNull();
    expect(sessionInMessage('open')).toBeNull();
  });
});
