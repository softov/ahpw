import type { ResponsePart, ToolCallState } from '@microsoft/agent-host-protocol';
import { durationOf, startedOf } from './tool.js';

/**
 * Tool calls and thinking, gathered into runs.
 *
 * Each unbroken run of tool calls and thinking is one group the transcript
 * folds to a line: what the run has done, and what it is doing now. Prose, a
 * question, an error and the turn's end break a run. Blank prose and empty
 * thinking neither draw nor break one.
 */

/** One step of a run. `key` is the host's own id, which stays as the turn ends. */
export type Step =
  | { kind: 'tool'; key: string; call: ToolCallState }
  | { kind: 'reasoning'; key: string; text: string };

/** One run of steps. */
export interface Group {
  kind: 'activity';
  /** The first step's key, which stays as the run grows. */
  id: string;
  steps: Step[];
  /** The last thing in a turn still running. */
  live: boolean;
  /** The turn has ended, so no call in it runs any more. */
  ended: boolean;
  /** The turn's duration, when this run is the turn's only one and the turn has ended. */
  turnMs?: number;
}

/** A part drawn as it is, with its place in the turn. */
export interface Single {
  kind: 'part';
  part: ResponsePart;
  index: number;
}

export type Shown = Single | Group;

/** Call statuses a call does not leave again. */
const SETTLED = new Set(['completed', 'cancelled']);

/** Call statuses that wait on the person. */
const WAITING = new Set(['pending-confirmation', 'pending-result-confirmation', 'auth-required']);

/** The step a part is, `null` for a part that breaks a run, `undefined` for one that is skipped. */
function stepOf(part: ResponsePart): Step | null | undefined {
  const kind = String(part.kind);
  if (kind === 'toolCall' && 'toolCall' in part) return { kind: 'tool', key: part.toolCall.toolCallId, call: part.toolCall };
  if (kind === 'reasoning' && 'content' in part) {
    const text = String(part.content);
    return text.trim() === '' ? undefined : { kind: 'reasoning', key: 'id' in part ? String(part.id) : '', text };
  }
  if (kind === 'markdown' && 'content' in part && String(part.content).trim() === '') return undefined;
  return null;
}

/** Whether a step has finished: a settled call, a call whose turn ended, or thinking something followed. */
export function stepDone(step: Step, last: boolean, group: Pick<Group, 'live' | 'ended'>): boolean {
  if (step.kind === 'tool') return group.ended || SETTLED.has(String(step.call.status));
  return !(last && group.live);
}

/** Whether a step waits on the person: an approval, a result to review, a sign-in. */
export function stepWaits(step: Step): boolean {
  return step.kind === 'tool' && WAITING.has(String(step.call.status));
}

/** Whether a step failed. */
export function stepFailed(step: Step): boolean {
  return step.kind === 'tool' && 'success' in step.call && step.call.success === false;
}

/**
 * A turn's parts with each run of steps gathered.
 *
 * `live` is whether the turn still runs; its last run is live only when
 * nothing follows it. `turnMs` is the turn's duration once it has ended.
 */
export function groupParts(parts: readonly ResponsePart[], live: boolean, turnMs?: number): Shown[] {
  const out: Shown[] = [];
  const groups: Group[] = [];
  let run: Step[] = [];
  const close = (last: boolean): void => {
    const first = run[0];
    if (first !== undefined) {
      const group: Group = { kind: 'activity', id: `act:${first.key}`, steps: run, live: last && live, ended: !live };
      out.push(group);
      groups.push(group);
    }
    run = [];
  };
  parts.forEach((part, index) => {
    const step = stepOf(part);
    if (step === undefined) return;
    if (step !== null) {
      run.push(step);
      return;
    }
    close(false);
    out.push({ kind: 'part', part, index });
  });
  close(true);
  const only = groups.length === 1 ? groups[0] : undefined;
  if (only !== undefined && !live && turnMs !== undefined) only.turnMs = turnMs;
  return out;
}

/** From the first call's start to the last call's end, when the host timed every call in the run. */
export function hostSpan(steps: readonly Step[]): number | undefined {
  let start = Infinity;
  let end = -Infinity;
  for (const step of steps) {
    if (step.kind !== 'tool') continue;
    const at = startedOf(step.call);
    const took = durationOf(step.call);
    if (at === undefined || took === undefined) return undefined;
    start = Math.min(start, at);
    end = Math.max(end, at + took);
  }
  return end >= start ? end - start : undefined;
}

/** The step a run is on now. */
export type Doing = { what: 'thinking' } | { what: 'working' | 'waiting'; name: string; for?: number };

/** What a run did and does, as the line it folds to. */
export interface Summary {
  done: number;
  failed: number;
  /** How long the done part took; no time under a second, where "0s" reads as a fault. */
  took?: number;
  /** The step running now. */
  doing?: Doing;
}

/** Under a second says nothing a count does not. */
const time = (ms: number | undefined, words: (ms: number) => string): string | undefined =>
  ms === undefined || ms < 1000 ? undefined : words(ms);

/** The folded line: `Completed 5 steps in 12s · Working on Bash for 3s`. */
export function summaryLine(summary: Summary, words: (ms: number) => string): string {
  const parts: string[] = [];
  if (summary.done > 0) {
    let done = summary.done === 1 ? 'Completed 1 step' : `Completed ${summary.done} steps`;
    if (summary.failed > 0) done += ` (${summary.failed} failed)`;
    const took = time(summary.took, words);
    parts.push(took === undefined ? done : `${done} in ${took}`);
  }
  const doing = summary.doing;
  if (doing !== undefined) {
    if (doing.what === 'thinking') parts.push('Thinking');
    else {
      const line = `${doing.what === 'waiting' ? 'Waiting on' : 'Working on'} ${doing.name}`;
      const long = time(doing.for, words);
      parts.push(long === undefined ? line : `${line} for ${long}`);
    }
  }
  return parts.join(' \u{00B7} ');
}
