/**
 * What the session header counts: the session's terminals and its subagents.
 */

import type { ActiveTurn, TerminalInfo, Turn } from '@microsoft/agent-host-protocol';
import { kindOf, outcomeOf } from './tool.js';

/** The terminals a session holds by its claim; the ones only in its folder are found by their directory. */
export function claimedTerminals(terminals: readonly TerminalInfo[], session: string): string[] {
  return terminals.filter((info) => String(info.claim.kind) === 'session' && (info.claim as { session?: string }).session === session).map((info) => info.resource);
}

/** The chat's subagents: every subagent call in its turns, and how many of them still run. */
export function subagentsOf(turns: readonly Turn[], active: ActiveTurn | undefined): { running: number; total: number } {
  let running = 0;
  let total = 0;
  for (const turn of active === undefined ? turns : [...turns, active]) {
    for (const part of turn.responseParts) {
      if (String(part.kind) !== 'toolCall' || !('toolCall' in part) || kindOf(part.toolCall) !== 'subagent') continue;
      total += 1;
      // A call in an ended turn runs no more, whatever its last status said.
      if (turn === active && ['preparing', 'running', 'approval', 'sign-in', 'review'].includes(outcomeOf(part.toolCall))) running += 1;
    }
  }
  return { running, total };
}
