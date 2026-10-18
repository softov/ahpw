import { expect, test } from 'vitest';
import type { ActiveTurn, ChatSummary, ResponsePart, TerminalInfo, Turn } from '@microsoft/agent-host-protocol';
import { rawOf, shownSteps } from './raw.js';
import { claimedTerminals, subagentCalls, subagentChats, subagentsOf } from './header.js';

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

test('the turn in flight comes last, and a filter keeps the tool calls or only the ones that spawned a subagent chat', () => {
  const active = turn('b', [tool('t2', 'Bash', 'completed'), tool('t3', 'Task', 'running'), tool('t4', 'Worked', 'completed', { _meta: { toolKind: 'subagent' } })]) as unknown as ActiveTurn;
  const turns = rawOf([turn('a', [])], active);
  const spawned = new Map([['t3', 'c://worker']]);
  expect(turns.map((one) => [one.index, one.live])).toEqual([[1, false], [2, true]]);
  expect(shownSteps(turns[1]!.steps, 'tools', spawned).map((step) => step.call?.toolName)).toEqual(['Bash', 'Task', 'Worked']);
  // A call the host only calls a subagent, with no chat of its own, is not one.
  expect(shownSteps(turns[1]!.steps, 'subagents', spawned).map((step) => step.call?.toolName)).toEqual(['Task']);
  expect(shownSteps(turns[1]!.steps, 'all', spawned)).toHaveLength(4);
});

test('subagents are the chats a tool call spawned, not hidden ones, each found from the call in its parent chat', () => {
  const chats = [
    { resource: 'c://main', title: '', status: 0, origin: { kind: 'user' } },
    { resource: 'c://fork', title: '', status: 0, origin: { kind: 'fork', chat: 'c://main', turnId: 'a' } },
    { resource: 'c://worker', title: 'Worker', status: 8, origin: { kind: 'tool', chat: 'c://main', toolCallId: 't3' } },
    { resource: 'c://quiet', title: '', status: 0, origin: { kind: 'tool', chat: 'c://main', toolCallId: 't5' }, interactivity: 'hidden' },
  ] as unknown as ChatSummary[];
  expect(subagentChats(chats).map((one) => one.resource)).toEqual(['c://worker']);
  expect([...subagentCalls([], undefined, chats, 'c://main')]).toEqual([['t3', 'c://worker']]);
  expect(subagentCalls([], undefined, chats, 'c://fork').size).toBe(0);
  expect(subagentsOf([], undefined, chats)).toEqual([{ chat: 'c://worker', title: 'Worker', running: true }]);
});

test('a bot chat\'s calls to its back session are one subagent, linked by their content or their _meta, running while a call runs in the turn in flight', () => {
  const back = 'ahp-chat://default/back';
  const woke = (id: string, status: string, link: Record<string, unknown>) => tool(id, 'subagent', status, { displayName: 'Worked', ...link });
  const ended = [turn('a', [woke('w1', 'completed', { content: [{ type: 'subagent', resource: back, title: 'Worked' }] })]), turn('b', [woke('w2', 'completed', { _meta: { toolKind: 'subagent', subagentChatUri: back } })])];
  const active = turn('c', [woke('w3', 'running', { _meta: { toolKind: 'subagent', subagentChatUri: back } }), tool('x', 'Bash', 'running')]) as unknown as ActiveTurn;
  expect(subagentsOf(ended, undefined, [])).toEqual([{ chat: back, title: 'Worked', running: false }]);
  expect(subagentsOf(ended, active, [])).toEqual([{ chat: back, title: 'Worked', running: true }]);
  expect([...subagentCalls(ended, active, [], 'c://bot')]).toEqual([['w1', back], ['w2', back], ['w3', back]]);
});

test('a session holds the terminals its claim names, not another session\'s or a client\'s', () => {
  const terminals = [
    { resource: 't://1', title: 'a', claim: { kind: 'session', session: 's://me', chat: 'c://1' }, lifecycle: { status: 'running' } },
    { resource: 't://2', title: 'b', claim: { kind: 'session', session: 's://other', chat: 'c://2' }, lifecycle: { status: 'running' } },
    { resource: 't://3', title: 'c', claim: { kind: 'client', clientId: 'me' }, lifecycle: { status: 'running' } },
  ] as unknown as TerminalInfo[];
  expect(claimedTerminals(terminals, 's://me')).toEqual(['t://1']);
});
