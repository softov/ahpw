/**
 * What the session header counts: the session's terminals and its subagents.
 */

import type { ActiveTurn, ChatSummary, TerminalInfo, ToolCallState, Turn } from '@microsoft/agent-host-protocol';
import { activityOf } from './status.js';
import { outcomeOf } from './tool.js';

/** The terminals a session holds by its claim; the ones only in its folder are found by their directory. */
export function claimedTerminals(terminals: readonly TerminalInfo[], session: string): string[] {
  return terminals.filter((info) => String(info.claim.kind) === 'session' && (info.claim as { session?: string }).session === session).map((info) => info.resource);
}

/** The session's chats a tool call spawned, as their origin says, less the ones the host keeps hidden. */
export function subagentChats(chats: readonly ChatSummary[]): ChatSummary[] {
  return chats.filter((one) => String(one.origin?.kind) === 'tool' && String(one.interactivity ?? 'full') !== 'hidden');
}

/** Whether a chat is still at work: running, or waiting for an answer. */
export function chatRunning(chat: ChatSummary): boolean {
  const activity = activityOf(chat.status);
  return activity === 'running' || activity === 'input';
}

/**
 * The chat a tool call hands work to: its `subagent` content's resource, or
 * the `subagentChatUri` a host puts in its `_meta` when that chat is another
 * session's, as a bot chat's call to its back session is.
 */
export function linkOf(call: ToolCallState): string | undefined {
  const content = 'content' in call && Array.isArray(call.content) ? call.content as unknown as { type?: string; resource?: unknown }[] : [];
  const linked = content.find((item) => item.type === 'subagent' && typeof item.resource === 'string')?.resource;
  if (typeof linked === 'string') return linked;
  const meta = (call._meta as Record<string, unknown> | undefined)?.['subagentChatUri'];
  return typeof meta === 'string' && meta !== '' ? meta : undefined;
}

/** One subagent: the chat its work is in, what it is called, and whether it still runs. */
export interface Subagent {
  chat: string;
  title: string;
  running: boolean;
}

const RUNNING = ['preparing', 'running', 'approval', 'sign-in', 'review'];

/** Every tool call of the loaded turns and the one in flight, with whether it is in the turn in flight. */
function callsOf(turns: readonly Turn[], active: ActiveTurn | undefined): { call: ToolCallState; live: boolean }[] {
  return (active === undefined ? turns : [...turns, active]).flatMap((turn) => turn.responseParts.flatMap((part) => (
    String(part.kind) === 'toolCall' && 'toolCall' in part ? [{ call: part.toolCall, live: turn === active }] : []
  )));
}

/**
 * The chat's subagents, one per chat: each chat its tool calls hand work to,
 * then the session's spawned chats none of them names. A chat woken by
 * several calls, as a bot's back session is once a turn, is one subagent; it
 * runs while a call to it runs in the turn in flight, or while its chat says so.
 */
export function subagentsOf(turns: readonly Turn[], active: ActiveTurn | undefined, chats: readonly ChatSummary[]): Subagent[] {
  const found = new Map<string, Subagent>();
  for (const { call, live } of callsOf(turns, active)) {
    const chat = linkOf(call);
    if (chat === undefined) continue;
    const held = found.get(chat);
    const running = live && RUNNING.includes(outcomeOf(call));
    found.set(chat, { chat, title: held?.title ?? call.displayName ?? call.toolName, running: (held?.running ?? false) || running });
  }
  for (const one of subagentChats(chats)) {
    const held = found.get(one.resource);
    found.set(one.resource, { chat: one.resource, title: one.title === '' ? held?.title ?? '' : one.title, running: (held?.running ?? false) || chatRunning(one) });
  }
  return [...found.values()];
}

/**
 * The tool calls of `chat` that hand work to a subagent, each with the
 * subagent's chat: the call's own link, or the spawned chat whose origin names it.
 */
export function subagentCalls(turns: readonly Turn[], active: ActiveTurn | undefined, chats: readonly ChatSummary[], chat: string | undefined): Map<string, string> {
  const out = new Map<string, string>();
  for (const { call } of callsOf(turns, active)) {
    const linked = linkOf(call);
    if (linked !== undefined) out.set(call.toolCallId, linked);
  }
  for (const one of subagentChats(chats)) {
    const origin = one.origin as { chat?: string; toolCallId?: string } | undefined;
    if (origin?.chat === chat && origin?.toolCallId !== undefined && !out.has(origin.toolCallId)) out.set(origin.toolCallId, one.resource);
  }
  return out;
}
