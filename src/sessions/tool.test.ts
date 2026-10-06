import { describe, expect, it } from 'vitest';
import type { ToolCallState } from '@microsoft/agent-host-protocol';
import { durationOf, fileOf, inputText, kindOf, lineOf, outcomeOf, outputOf, segmentsOf, subjectOf } from './tool.js';

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
      { kind: 'file', path: '/a/b.ts', file: 'file:///a/b.ts', added: 3, removed: 1 },
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

describe('outputOf on a failure', () => {
  it('says the error once when the output already carries it', () => {
    const out = outputOf(call({ status: 'completed', success: false, content: [{ type: 'text', text: 'Error: no such file\n' }], error: { message: 'Error: no such file' } }));
    expect(out).toEqual([{ kind: 'text', text: 'Error: no such file\n' }]);
  });
});

describe('kindOf', () => {
  it('takes the host\'s word, then the tool name, then the output', () => {
    expect(kindOf(call({ toolName: 'x', _meta: { toolKind: 'search' } }))).toBe('search');
    expect(kindOf(call({ toolName: 'Edit' }))).toBe('edit');
    expect(kindOf(call({ toolName: 'mystery', content: [{ type: 'fileEdit' }] }))).toBe('edit');
    expect(kindOf(call({ toolName: 'mystery' }))).toBe('other');
  });
});

describe('fileOf', () => {
  it('names an absolute file the call works on', () => {
    expect(fileOf(call({ toolInput: '{"file_path":"/a/b.ts"}' }))).toBe('file:///a/b.ts');
    expect(fileOf(call({ toolInput: '{"pattern":"x","path":"src"}' }))).toBeUndefined();
  });
});

describe('segmentsOf', () => {
  it('makes a markdown link a file piece', () => {
    expect(segmentsOf('Read [README.md](file:///w/README.md#L3), lines 3', undefined)).toEqual([
      { text: 'Read ' },
      { text: 'README.md', href: 'file:///w/README.md#L3' },
      { text: ', lines 3' },
    ]);
  });

  it('makes a code span a file piece', () => {
    expect(segmentsOf('Edited `src/a.ts`', undefined)).toEqual([{ text: 'Edited ' }, { text: 'src/a.ts', href: 'src/a.ts', code: true }]);
  });

  it('finds the call\'s own file in plain text', () => {
    expect(segmentsOf('Searched /w/a.css for x', 'file:///w/a.css')).toEqual([
      { text: 'Searched ' },
      { text: '/w/a.css', href: 'file:///w/a.css' },
      { text: ' for x' },
    ]);
  });

  it('leaves a line with no file whole', () => {
    expect(segmentsOf('Listed /tmp', undefined)).toEqual([{ text: 'Listed /tmp' }]);
  });
});
