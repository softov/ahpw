import { describe, expect, it } from 'vitest';
import type { ToolCallState } from '@microsoft/agent-host-protocol';
import { durationOf, inputText, lineOf, outcomeOf, outputOf, subjectOf } from './tool.js';

const call = (fields: Record<string, unknown>): ToolCallState => ({
  toolCallId: 't1',
  toolName: 'Bash',
  displayName: 'Bash',
  invocationMessage: 'Bash',
  status: 'running',
  ...fields,
}) as unknown as ToolCallState;

describe('lineOf', () => {
  it('prefers what the host says the call does', () => {
    expect(lineOf(call({ invocationMessage: 'Running the tests' }))).toBe('Running the tests');
  });

  it('says what a finished call did', () => {
    expect(lineOf(call({ status: 'completed', success: true, pastTenseMessage: 'Ran the tests' }))).toBe('Ran the tests');
  });

  it('names the subject when the message only repeats the tool name', () => {
    expect(lineOf(call({ toolInput: '{"command":"pnpm test\\nmore"}' }))).toBe('Bash pnpm test');
  });
});

describe('subjectOf and inputText', () => {
  it('reads the first telling key', () => {
    expect(subjectOf(call({ toolInput: '{"pattern":"*.ts","path":"/src"}' }))).toBe('/src');
  });

  it('pretty-prints JSON input and keeps other text as it is', () => {
    expect(inputText(call({ toolInput: '{"a":1}' }))).toBe('{\n  "a": 1\n}');
    expect(inputText(call({ toolInput: 'plain' }))).toBe('plain');
    expect(inputText(call({}))).toBe('');
  });
});

describe('outcomeOf', () => {
  it('tells a failed call from a finished one', () => {
    expect(outcomeOf(call({ status: 'completed', success: false }))).toBe('failed');
    expect(outcomeOf(call({ status: 'completed', success: true }))).toBe('done');
    expect(outcomeOf(call({ status: 'pending-confirmation' }))).toBe('approval');
  });
});

describe('outputOf', () => {
  it('reads text, a terminal without its escapes, a file edit and an error', () => {
    const out = outputOf(call({
      status: 'completed',
      success: false,
      content: [
        { type: 'text', text: 'hello' },
        { type: 'terminal', title: 'bash', resource: 'x', result: { exitCode: 1, preview: '\u001b[31mred\u001b[0m' } },
        { type: 'fileEdit', after: { uri: 'file:///a/b.ts' }, diff: { added: 3, removed: 1 } },
      ],
      error: { message: 'exit 1' },
    }));
    expect(out).toEqual([
      { kind: 'text', text: 'hello' },
      { kind: 'terminal', title: 'bash', text: 'red', exitCode: 1, truncated: false },
      { kind: 'file', path: '/a/b.ts', added: 3, removed: 1 },
      { kind: 'note', text: 'exit 1' },
    ]);
  });

  it('says why a call was cancelled', () => {
    expect(outputOf(call({ status: 'cancelled', reason: 'denied' }))).toEqual([{ kind: 'note', text: 'Denied.' }]);
  });
});

describe('durationOf', () => {
  it('reads the duration ahpd writes', () => {
    expect(durationOf(call({ _meta: { 'ahpd.durationMs': 1200 } }))).toBe(1200);
    expect(durationOf(call({}))).toBeUndefined();
  });
});
