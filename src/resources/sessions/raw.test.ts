import { expect, test } from 'vitest';
import type { ActiveTurn, ResponsePart, TerminalInfo, Turn } from '@microsoft/agent-host-protocol';
import { rawOf, shownSteps } from './raw.js';
import { claimedTerminals, subagentsOf } from './header.js';

const tool = (id: string, toolName: string, status: string, fields: Record<string, unknown> = {}): ResponsePart =>
  ({ kind: 'toolCall', toolCall: { toolCallId: id, toolName, displayName: toolName, status, success: true, invocationMessage: `${toolName} ${id}`, ...fields } }) as unknown as ResponsePart;

const turn = (id: string, parts: ResponsePart[], extra: Record<string, unknown> = {}): Turn =>
  ({ id, message: { text: `ask ${id}` }, responseParts: parts, startedAt: '2026-10-16T10:00:00Z', duration: 3000, ...extra }) as unknown as Turn;

test('a turn is its message, then each part in order, blank text left out, each with what the host sent', () => {
  const parts = [
    { kind: 'reasoning', id: 'r', content: 'thinking it over' },
    tool('t1', 'Read', 'completed'),
    { kind: 'markdown', id: 'm0', content: '   ' },
    { kind: 'markdown', id: 'm1', content: 'Done.' },
  ] as unknown as ResponsePart[];
  const [one] = rawOf([turn('a', parts)], undefined);
  expect(one!.steps.map((step) => [step.step, step.kind])).toEqual([[1, 'message'], [2, 'reasoning'], [3, 'tool'], [4, 'text']]);
  expect(one!.steps[0]!.source).toEqual({ text: 'ask a' });
  expect(one!.steps[2]!.source).toBe(parts[1]);
  // The turn's own object, less the parts its steps already carry.
  expect(one!.source).not.toHaveProperty('responseParts');
  expect(one!.facts.duration).toBe(3000);
});

test('the turn in flight comes last, and a filter keeps the tool calls or only the subagents', () => {
  const active = turn('b', [tool('t2', 'Bash', 'completed'), tool('t3', 'Task', 'running')]) as unknown as ActiveTurn;
  const turns = rawOf([turn('a', [])], active);
  expect(turns.map((one) => [one.index, one.live])).toEqual([[1, false], [2, true]]);
  expect(shownSteps(turns[1]!.steps, 'tools').map((step) => step.call?.toolName)).toEqual(['Bash', 'Task']);
  expect(shownSteps(turns[1]!.steps, 'subagents').map((step) => step.call?.toolName)).toEqual(['Task']);
  expect(shownSteps(turns[1]!.steps, 'all')).toHaveLength(3);
});

test('subagents are counted over every turn, and only the turn in flight has any running', () => {
  const ended = turn('a', [tool('s1', 'Task', 'running'), tool('s2', 'Agent', 'completed'), tool('x', 'Bash', 'running')]);
  const active = turn('b', [tool('s3', 'Task', 'running'), tool('s4', 'Bash', 'running', { _meta: { toolKind: 'subagent' } })]) as unknown as ActiveTurn;
  expect(subagentsOf([ended], undefined)).toEqual({ running: 0, total: 2 });
  expect(subagentsOf([ended], active)).toEqual({ running: 2, total: 4 });
});

test('a session holds the terminals its claim names, not another session\'s or a client\'s', () => {
  const terminals = [
    { resource: 't://1', title: 'a', claim: { kind: 'session', session: 's://me', chat: 'c://1' }, lifecycle: { status: 'running' } },
    { resource: 't://2', title: 'b', claim: { kind: 'session', session: 's://other', chat: 'c://2' }, lifecycle: { status: 'running' } },
    { resource: 't://3', title: 'c', claim: { kind: 'client', clientId: 'me' }, lifecycle: { status: 'running' } },
  ] as unknown as TerminalInfo[];
  expect(claimedTerminals(terminals, 's://me')).toEqual(['t://1']);
});
