import { useEffect, useState, type ReactElement } from 'react';
import { elapsed } from '../connection/words.js';
import { hostSpan, stepDone, stepFailed, stepWaits, summaryPieces, type Group, type Doing, type Step } from './activity.js';
import { Reasoning, ToolCall, type Send } from './Parts.js';
import { EMOJIcon } from '../emojis.js';

/**
 * When this page first saw each step or run running, and first saw it done,
 * by key. A run the page never watched has no time of its own.
 */
const began = new Map<string, number>();
const ended = new Map<string, number>();

/** Notes what a step or run is doing now; called on every render that draws it. */
function watch(key: string, running: boolean): void {
  if (running) {
    if (!began.has(key)) began.set(key, Date.now());
  } else if (began.has(key) && !ended.has(key)) ended.set(key, Date.now());
}

/** How long a watched step or run ran, up to `now` while it still runs. */
function spanOf(key: string, now: number): number | undefined {
  const start = began.get(key);
  return start === undefined ? undefined : (ended.get(key) ?? now) - start;
}

/** What the run is doing now, from its running step. */
function doingOf(step: Step, now: number): Doing {
  if (step.kind === 'reasoning') return { what: 'thinking' };
  const name = step.call.displayName || step.call.toolName;
  const long = spanOf(step.key, now);
  return { what: stepWaits(step) ? 'waiting' : 'working', name, ...(long === undefined ? {} : { for: long }) };
}

/** One run of tool calls and thinking, folded to a line that says what it did and does. */
export function Activity({ group, send, turnId }: { group: Group; send: Send; turnId: string }): ReactElement {
  const [open, setOpen] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const last = group.steps.length - 1;
  const done = group.steps.map((step, index) => stepDone(step, index === last, group));
  const runningIndex = done.lastIndexOf(false);
  const running = runningIndex < 0 ? undefined : group.steps[runningIndex];

  watch(group.id, group.live);
  group.steps.forEach((step, index) => watch(step.key, !done[index]));

  useEffect(() => {
    if (running === undefined) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [running?.key]);

  // A run holding a call that waits on the person stays open, so its buttons show.
  const waits = group.live && group.steps.some(stepWaits);
  const shown = open || waits;

  const count = done.filter(Boolean).length;
  const until = running === undefined ? now : began.get(running.key);
  const start = began.get(group.id);
  const took = group.live
    ? (start === undefined || until === undefined ? undefined : until - start)
    : hostSpan(group.steps) ?? spanOf(group.id, now) ?? group.turnMs;
  const line = summaryPieces({
    done: count,
    failed: group.steps.filter(stepFailed).length,
    ...(took === undefined ? {} : { took }),
    ...(running === undefined ? {} : { doing: doingOf(running, now) }),
  }, elapsed);

  return (
    <div className="web-activity" data-live={running !== undefined}>
      <button type="button" className="web-activity__line" aria-expanded={shown} onClick={() => setOpen(!open)}>
        <span>
          {line.map((piece, index) => piece.failed
            ? <span key={index} className="web-activity__failed">{piece.text}</span>
            : piece.text)}
        </span>
        <span className="web-activity__chev" aria-hidden="true">{shown ? EMOJIcon.caretDown : EMOJIcon.caretRight}</span>
      </button>
      {shown ? (
        <div className="web-activity__steps">
          {group.steps.map((step, index) => step.kind === 'tool'
            ? <ToolCall key={step.key} call={step.call} send={send} live={!group.ended} turnId={turnId} />
            : <Reasoning key={step.key} text={step.text} running={!done[index]} />)}
        </div>
      ) : null}
    </div>
  );
}
