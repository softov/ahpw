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
    const settings = settingsOf({ connect: 'ws://127.0.0.1:37537' }, {}, read);
    expect(settings).toEqual({ connect: new URL('ws://127.0.0.1:37537'), host: DEFAULT_HOST, port: DEFAULT_PORT, open: false });
  });

  it('takes a flag over the file', () => {
    const settings = settingsOf({ port: 6000 }, { connect: 'ws://127.0.0.1:1', port: 5000, host: '0.0.0.0' }, read);
    expect(settings.port).toBe(6000);
    expect(settings.host).toBe('0.0.0.0');
    expect(settings.connect.port).toBe('1');
  });

  it('reads and trims the token file', () => {
    expect(settingsOf({ connect: 'ws://h:1', tokenFile: '/tok' }, {}, read).token).toBe('from-file');
  });

  it('takes a token flag over a token file in the configuration', () => {
    expect(settingsOf({ connect: 'ws://h:1', token: 'flag' }, { tokenFile: '/tok' }, read).token).toBe('flag');
  });

  it('refuses both spellings of the token, a missing file, and an empty token', () => {
    expect(() => settingsOf({ connect: 'ws://h:1', token: 'a', tokenFile: '/tok' }, {}, read)).toThrow('not both');
    expect(() => settingsOf({ connect: 'ws://h:1', tokenFile: '/none' }, {}, read)).toThrow('No token file');
    expect(() => settingsOf({ connect: 'ws://h:1', token: '  ' }, {}, read)).toThrow('empty');
  });

  it('refuses a missing or non-socket connect', () => {
    expect(() => settingsOf({}, {}, read)).toThrow('--connect');
    expect(() => settingsOf({ connect: 'http://h:1' }, {}, read)).toThrow('ws://');
  });

  it('refuses a configuration key it does not know, or of the wrong kind', () => {
    expect(() => settingsOf({ connect: 'ws://h:1' }, { colour: 'red' }, read)).toThrow('colour');
    expect(() => settingsOf({ connect: 'ws://h:1' }, { port: '80' }, read)).toThrow('port');
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
