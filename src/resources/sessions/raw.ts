/**
 * A chat as the Raw view draws it: each turn, and in it every step - the
 * message that started it, then each response part in the order it came -
 * with the object the host sent for it, so a step shows what arrived rather
 * than what the chat made of it.
 */

import type { ActiveTurn, ResponsePart, ToolCallState, Turn } from '@microsoft/agent-host-protocol';
import { textOf } from '../../bridges/words.js';
import { kindOf, lineOf } from './tool.js';
import { factsOf, type TurnFacts } from './turn.js';

export type StepKind = 'message' | 'text' | 'reasoning' | 'tool' | 'question' | 'error' | 'note' | 'file';

/** One row of the Raw view. */
export interface RawStep {
  /** Unique in the chat: the turn's id and the step's place. */
  id: string;
  kind: StepKind;
  /** Its place in the turn, from 1; the message is 1. */
  step: number;
  /** What its row reads: the text, or a tool call's line. */
  text: string;
  /** The call, for a tool step. */
  call?: ToolCallState;
  /** What the host sent for it, as it sent it. */
  source: unknown;
}

/** One turn of the Raw view. */
export interface RawTurn {
  id: string;
  /** From 1, in the chat's order. */
  index: number;
  live: boolean;
  facts: TurnFacts;
  /** The turn as the host sent it, less its response parts, which are its steps. */
  source: unknown;
  steps: RawStep[];
}

export type RawFilter = 'all' | 'tools' | 'subagents';

/** The step a response part is, or null for blank text or thinking, which draws nothing. */
function stepOf(part: ResponsePart): Pick<RawStep, 'kind' | 'text' | 'call'> | null {
  const held = part as unknown as Record<string, unknown>;
  switch (String(part.kind)) {
    case 'markdown':
    case 'reasoning': {
      const text = typeof held.content === 'string' ? held.content : '';
      return text.trim() === '' ? null : { kind: String(part.kind) === 'markdown' ? 'text' : 'reasoning', text };
    }
    case 'toolCall': {
      const call = held.toolCall as ToolCallState;
      return { kind: 'tool', text: lineOf(call), call };
    }
    case 'inputRequest': {
      const request = held.request as { message?: string; questions?: { message?: string }[] } | undefined;
      return { kind: 'question', text: request?.message ?? request?.questions?.[0]?.message ?? '' };
    }
    case 'error':
      return { kind: 'error', text: (held.error as { message?: string } | undefined)?.message ?? '' };
    case 'contentRef':
      return { kind: 'file', text: typeof held.uri === 'string' ? held.uri : '' };
    default:
      return { kind: 'note', text: textOf(held.content as string ?? '') };
  }
}

function turnOf(turn: Turn | ActiveTurn, index: number, live: boolean): RawTurn {
  const { responseParts, ...source } = turn;
  const steps: RawStep[] = [{ id: `${turn.id}:1`, kind: 'message', step: 1, text: turn.message.text, source: turn.message }];
  for (const part of responseParts) {
    const step = stepOf(part);
    if (step === null) continue;
    const at = steps.length + 1;
    steps.push({ id: `${turn.id}:${String(at)}`, step: at, source: part, ...step });
  }
  return { id: turn.id, index, live, facts: factsOf(turn), source, steps };
}

/** Every loaded turn, then the one in flight. */
export function rawOf(turns: readonly Turn[], active: ActiveTurn | undefined): RawTurn[] {
  const out = turns.map((turn, at) => turnOf(turn, at + 1, false));
  return active === undefined ? out : [...out, turnOf(active, turns.length + 1, true)];
}

/** The steps a filter keeps: all, the tool calls, or the subagents among them. */
export function shownSteps(steps: readonly RawStep[], filter: RawFilter): RawStep[] {
  if (filter === 'all') return [...steps];
  return steps.filter((step) => step.call !== undefined && (filter === 'tools' || kindOf(step.call) === 'subagent'));
}
