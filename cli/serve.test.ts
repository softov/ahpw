import { describe, expect, it } from 'vitest';
import { DEFAULT_HOST, DEFAULT_PORT, settingsOf, warningsOf } from './serve.js';

const files: Record<string, string> = { '/tok': ' from-file\n' };
const read = (path: string): string => {
  const text = files[path];
  if (text === undefined) throw new Error('ENOENT');
  return text;
};

describe('settingsOf', () => {
  it('fills the defaults', () => {
    const settings = settingsOf({ connect: 'ws://127.0.0.1:37537' }, {}, {}, read);
    expect(settings).toEqual({ connect: new URL('ws://127.0.0.1:37537'), host: DEFAULT_HOST, port: DEFAULT_PORT, open: false });
  });

  it('takes a flag over the file', () => {
    const settings = settingsOf({ port: 6000 }, { connect: 'ws://127.0.0.1:1', port: 5000, host: '0.0.0.0' }, {}, read);
    expect(settings.port).toBe(6000);
    expect(settings.host).toBe('0.0.0.0');
    expect(settings.connect.port).toBe('1');
  });

  it('reads and trims the token file', () => {
    expect(settingsOf({ connect: 'ws://h:1', tokenFile: '/tok' }, {}, {}, read).token).toBe('from-file');
  });

  it('takes a token flag over a token file in the configuration', () => {
    expect(settingsOf({ connect: 'ws://h:1', token: 'flag' }, { tokenFile: '/tok' }, {}, read).token).toBe('flag');
  });

  it('refuses both spellings of the token, a missing file, and an empty token', () => {
    expect(() => settingsOf({ connect: 'ws://h:1', token: 'a', tokenFile: '/tok' }, {}, {}, read)).toThrow('not both');
    expect(() => settingsOf({ connect: 'ws://h:1', tokenFile: '/none' }, {}, {}, read)).toThrow('No token file');
    expect(() => settingsOf({ connect: 'ws://h:1', token: '  ' }, {}, {}, read)).toThrow('empty');
  });

  it('refuses a missing or non-socket connect', () => {
    expect(() => settingsOf({}, {}, {}, read)).toThrow('--connect');
    expect(() => settingsOf({ connect: 'ftp://h:1' }, {}, {}, read)).toThrow('ws://');
  });

  it('reads http as ws, https as wss, and a bare HOST:PORT as ws', () => {
    expect(settingsOf({ connect: 'http://h:1' }, {}, {}, read).connect.href).toBe('ws://h:1/');
    expect(settingsOf({ connect: 'https://h' }, {}, {}, read).connect.href).toBe('wss://h/');
    expect(settingsOf({ connect: '127.0.0.1:37537' }, {}, {}, read).connect.href).toBe('ws://127.0.0.1:37537/');
  });

  it('takes the tkn in the socket as the token, and keeps it off the socket', () => {
    const settings = settingsOf({ connect: 'ws://h:1/?tkn=t&a=b' }, {}, {}, read);
    expect(settings.token).toBe('t');
    expect(settings.connect.href).toBe('ws://h:1/?a=b');
    expect(() => settingsOf({ connect: 'ws://h:1/?tkn=t', token: 'u' }, {}, {}, read)).toThrow('tkn');
  });

  it('refuses a configuration key it does not know, or of the wrong kind', () => {
    expect(() => settingsOf({ connect: 'ws://h:1' }, { colour: 'red' }, {}, read)).toThrow('colour');
    expect(() => settingsOf({ connect: 'ws://h:1' }, { port: '80' }, {}, read)).toThrow('port');
  });
});

describe('settingsOf, from the environment', () => {
  it('takes AHPD_URL, else AHPD_HOST, with the token in its tkn, else AHPD_TOKEN', () => {
    expect(settingsOf({}, {}, { AHPD_URL: 'http://a:1/?tkn=u', AHPD_HOST: 'b:2', AHPD_TOKEN: 't' }, read)).toMatchObject({ token: 'u' });
    expect(settingsOf({}, {}, { AHPD_URL: 'http://a:1/?tkn=u' }, read).connect.href).toBe('ws://a:1/');
    const host = settingsOf({}, {}, { AHPD_HOST: 'b:2', AHPD_TOKEN: 't' }, read);
    expect(host.connect.href).toBe('ws://b:2/');
    expect(host.token).toBe('t');
    expect(settingsOf({}, {}, { AHPD_URL: '', AHPD_HOST: 'b:2' }, read).connect.host).toBe('b:2');
  });

  it('sits below the file and the flags', () => {
    const env = { AHPD_URL: 'ws://a:1/?tkn=u' };
    expect(settingsOf({ connect: 'ws://c:3' }, {}, env, read)).toMatchObject({ token: 'u' });
    expect(settingsOf({ connect: 'ws://c:3' }, {}, env, read).connect.host).toBe('c:3');
    expect(settingsOf({}, { tokenFile: '/tok' }, env, read).token).toBe('from-file');
    expect(settingsOf({ token: 'flag' }, {}, env, read).token).toBe('flag');
  });
});

describe('warningsOf', () => {
  const base = { connect: new URL('ws://127.0.0.1:37537'), host: '127.0.0.1', port: 5190, open: false };

  it('says nothing on loopback', () => {
    expect(warningsOf({ ...base, token: 't' })).toEqual([]);
  });

  it('warns when the page is reachable from elsewhere, and when the token crosses a network', () => {
    expect(warningsOf({ ...base, host: '0.0.0.0', token: 't' })[0]).toContain('with the token');
    expect(warningsOf({ ...base, connect: new URL('ws://10.0.0.2:1'), token: 't' })[0]).toContain('cleartext');
    expect(warningsOf({ ...base, connect: new URL('ws://10.0.0.2:1') })).toEqual([]);
  });
});
