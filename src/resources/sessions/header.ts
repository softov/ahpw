/**
 * What the session header counts: the session's terminals and its subagents.
 */

import type { ChatSummary, TerminalInfo } from '@microsoft/agent-host-protocol';
import { activityOf } from './status.js';

/** The terminals a session holds by its claim; the ones only in its folder are found by their directory. */
export function claimedTerminals(terminals: readonly TerminalInfo[], session: string): string[] {
  return terminals.filter((info) => String(info.claim.kind) === 'session' && (info.claim as { session?: string }).session === session).map((info) => info.resource);
}

/**
 * The session's subagents: the chats a tool call spawned, as their origin
 * says, less the ones the host keeps hidden. A tool call the host only calls a
 * subagent, with no chat of its own, is not one.
 */
export function subagentChats(chats: readonly ChatSummary[]): ChatSummary[] {
  return chats.filter((one) => String(one.origin?.kind) === 'tool' && String(one.interactivity ?? 'full') !== 'hidden');
}

/** Whether a chat is still at work: running, or waiting for an answer. */
export function chatRunning(chat: ChatSummary): boolean {
  const activity = activityOf(chat.status);
  return activity === 'running' || activity === 'input';
}

/** The tool calls of `chat` that spawned a subagent, each with the subagent's chat. */
export function spawnedBy(chats: readonly ChatSummary[], chat: string | undefined): Map<string, string> {
  const out = new Map<string, string>();
  for (const one of subagentChats(chats)) {
    const origin = one.origin as { chat?: string; toolCallId?: string } | undefined;
    if (origin?.chat === chat && origin?.toolCallId !== undefined) out.set(origin.toolCallId, one.resource);
  }
  return out;
}
