import { beforeEach, describe, expect, it } from 'vitest';
import { clearLog, filterLog, logLines, piecesOf, type LogEntry } from './log.js';
import { forgetFrames, noteFrame } from './wire.js';

const line = (over: Partial<LogEntry>): LogEntry => ({ id: 'l1', at: 0, level: 'info', scope: 'session', text: '', ...over });

beforeEach(() => {
  clearLog();
  forgetFrames('daemon');
});

describe('log', () => {
  it('filters by scope, level and words, with !words left out', () => {
    const lines = [
      line({ id: 'a', text: 'turn started ahp:/s1' }),
      line({ id: 'b', level: 'debug', text: 'turn started ahp:/s2' }),
      line({ id: 'c', scope: 'terminal', text: 'exited 0' }),
      line({ id: 'd', text: 'turn complete ahp:/s1' }),
    ];
    const ids = (out: LogEntry[]): string[] => out.map((one) => one.id);
    expect(ids(filterLog(lines, { scopes: [], minLevel: 'info', query: '' }))).toEqual(['a', 'c', 'd']);
    expect(ids(filterLog(lines, { scopes: ['terminal'], minLevel: 'debug', query: '' }))).toEqual(['c']);
    expect(ids(filterLog(lines, { scopes: [], minLevel: 'debug', query: 'TURN !complete' }))).toEqual(['a', 'b']);
  });

  it('cuts a line into words and URIs, leaving a closing full stop out', () => {
    expect(piecesOf('opened ahp-terminal:/x. done')).toEqual([
      { kind: 'text', text: 'opened ' },
      { kind: 'uri', text: 'ahp-terminal:/x' },
      { kind: 'text', text: '. done' },
    ]);
  });

  it('writes each frame as traffic and a refused request as an error naming it', () => {
    noteFrame('daemon', 'sent', JSON.stringify({ jsonrpc: '2.0', id: 7, method: 'createTerminal', params: { channel: 'ahp-terminal:/t' } }));
    noteFrame('daemon', 'received', JSON.stringify({ jsonrpc: '2.0', id: 7, error: { code: -32000, message: 'no pty' } }));
    const lines = logLines();
    expect(lines.filter((one) => one.scope === 'traffic').map((one) => one.text)).toEqual(['→ createTerminal #7 ahp-terminal:/t', '← error #7 no pty']);
    expect(lines.find((one) => one.level === 'error')).toMatchObject({ scope: 'terminal', text: 'createTerminal ahp-terminal:/t refused: no pty (-32000)' });
  });

  it('keeps each host\'s requests apart, so an answer names only what its own host was asked', () => {
    noteFrame('a', 'sent', JSON.stringify({ jsonrpc: '2.0', id: 7, method: 'createTerminal', params: { channel: 'ahp-terminal:/t' } }));
    noteFrame('b', 'received', JSON.stringify({ jsonrpc: '2.0', id: 7, error: { code: -32000, message: 'no pty' } }));
    expect(logLines().find((one) => one.level === 'error')).toMatchObject({ scope: 'connection', text: '#7 refused: no pty (-32000)' });
    forgetFrames('a');
  });

  it('masks the token an authenticate frame carries', () => {
    noteFrame('daemon', 'sent', JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'authenticate', params: { resource: 'x', token: 'secret' } }));
    expect(String(logLines()[0]?.detail)).not.toContain('secret');
  });

  it('masks the code a signin-finish frame carries, in the detail and in a refusal', () => {
    noteFrame('daemon', 'sent', JSON.stringify({ jsonrpc: '2.0', id: 2, method: 'x-ahpd/connectors/signin-finish', params: { state: 's1', code: 'pasted-code' } }));
    noteFrame('daemon', 'received', JSON.stringify({ jsonrpc: '2.0', id: 2, error: { code: -32602, message: 'expired' } }));
    expect(String(logLines()[0]?.detail)).toContain('••••••');
    expect(JSON.stringify(logLines())).not.toContain('pasted-code');
  });

  it('masks each config string of a put and a signin, and keeps the id, adapter and owner', () => {
    for (const method of ['x-ahpd/connectors/put', 'x-ahpd/connectors/signin']) {
      clearLog();
      noteFrame('daemon', 'sent', JSON.stringify({ jsonrpc: '2.0', id: 3, method, params: { id: 'or', adapter: 'openrouter', owner: 'user:ana', config: { key: 'typed-key', endpoint: 'https://x', retries: 2 } } }));
      const detail = String(logLines()[0]?.detail);
      expect(detail).not.toContain('typed-key');
      expect(detail).not.toContain('https://x');
      expect(JSON.parse(detail).params).toMatchObject({ id: 'or', adapter: 'openrouter', owner: 'user:ana', config: { key: '••••••', endpoint: '••••••', retries: 2 } });
    }
  });

  it('says which terminals came and went', () => {
    const changed = (terminals: { resource: string; title: string }[]): string =>
      JSON.stringify({ jsonrpc: '2.0', method: 'action', params: { channel: 'ahp-root://', action: { type: 'root/terminalsChanged', terminals } } });
    noteFrame('daemon', 'received', changed([{ resource: 'ahp-terminal:/a', title: 'bash' }]));
    noteFrame('daemon', 'received', changed([{ resource: 'ahp-terminal:/b', title: '' }]));
    expect(logLines().filter((one) => one.scope === 'terminal').map((one) => one.text)).toEqual(['opened ahp-terminal:/b', 'closed bash ahp-terminal:/a']);
  });
});
