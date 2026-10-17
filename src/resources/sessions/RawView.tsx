import { useState, type ReactElement } from 'react';
import { useI18n } from '@softov/scena/react';
import { elapsed } from '../../bridges/words.js';
import { EMOJIcon } from '../emojis.js';
import { Block, KIND_ICON, MARK, OutputView, ToolLine } from './Parts.js';
import { shownSteps, type RawFilter, type RawStep, type RawTurn, type StepKind } from './raw.js';
import { durationOf, fileOf, inputText, kindOf, outcomeOf, outputOf, startedOf } from './tool.js';
import { tokens, when } from './turn.js';

/** The icon of each step that is not a tool call; a call takes its kind's. */
const STEP_ICON: Record<Exclude<StepKind, 'tool'>, string> = {
  message: EMOJIcon.send,
  text: EMOJIcon.markdown,
  reasoning: EMOJIcon.thinking,
  question: EMOJIcon.waiting,
  error: EMOJIcon.cross,
  note: EMOJIcon.dot,
  file: EMOJIcon.file,
};

const FILTERS: readonly RawFilter[] = ['all', 'tools', 'subagents'];

/** The host's object as JSON, or what it is when it is not one. */
const json = (value: unknown): string => {
  try {
    return JSON.stringify(value, null, 2) ?? String(value);
  } catch {
    return String(value);
  }
};

/** A turn's facts in one line: when, how long, the model, the tokens. */
function turnLine(turn: RawTurn, t: (key: string, values?: Record<string, unknown>) => string): string {
  const { startedAt, duration, model, input, output } = turn.facts;
  return [
    startedAt === undefined ? undefined : when(startedAt),
    duration === undefined ? undefined : elapsed(duration),
    model,
    input === undefined && output === undefined ? undefined : t('sessions/raw/tokens', { input: tokens(input ?? 0), output: tokens(output ?? 0) }),
    turn.live ? t('sessions/raw/live') : undefined,
  ].filter((one) => one !== undefined).join(' \u{00B7} ');
}

/** One step: its line, opened in place to its facts, what went in and came out, and the object the host sent. */
function StepRow({ step, turn }: { step: RawStep; turn: RawTurn }): ReactElement {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const call = step.call;
  const outcome = call === undefined ? undefined : outcomeOf(call);
  const duration = call === undefined ? undefined : durationOf(call);
  const started = call === undefined ? undefined : startedOf(call);
  const input = call === undefined ? '' : inputText(call);
  const icon = call === undefined ? STEP_ICON[step.kind as Exclude<StepKind, 'tool'>] : KIND_ICON[kindOf(call)];
  const line = step.text.replace(/\s+/g, ' ').trim();
  return (
    <li className="web-raw__step" data-kind={step.kind} {...(outcome === undefined ? {} : { 'data-outcome': outcome })}>
      <button type="button" className="web-raw__row" aria-expanded={open} onClick={() => setOpen(!open)}>
        <span className="web-raw__n">{step.step}</span>
        <span className="web-raw__icon" aria-hidden="true">{icon}</span>
        {call === undefined ? <span className="web-raw__line">{line === '' ? t(`sessions/raw/kind/${step.kind}`) : line}</span> : <ToolLine line={step.text} file={fileOf(call)} />}
        {outcome === undefined ? null : <span className="web-raw__state" title={t(MARK[outcome].label)}>{MARK[outcome].glyph}</span>}
        {duration === undefined ? null : <span className="web-raw__time">{elapsed(duration)}</span>}
      </button>
      {open ? (
        <div className="web-raw__body">
          <dl className="web-tool__facts">
            <dt>{t('sessions/raw/kindLabel')}</dt><dd>{t(`sessions/raw/kind/${step.kind}`)}</dd>
            <dt>{t('sessions/raw/place')}</dt><dd>{t('sessions/raw/placeValue', { turn: turn.index, step: step.step })}</dd>
            {call === undefined ? null : (
              <>
                <dt>{t('sessions/tool/tool')}</dt><dd><code>{call.toolName}</code>{call.displayName && call.displayName !== call.toolName ? ` (${call.displayName})` : null}</dd>
                <dt>{t('sessions/tool/status')}</dt><dd>{t(MARK[outcome!].label)}</dd>
                {started === undefined ? null : <><dt>{t('sessions/raw/started')}</dt><dd>{when(started)}</dd></>}
                {duration === undefined ? null : <><dt>{t('sessions/raw/took')}</dt><dd>{elapsed(duration)}</dd></>}
              </>
            )}
          </dl>
          {call === undefined ? (step.text === '' ? null : <Block title={t(`sessions/raw/kind/${step.kind}`)} text={step.text} />) : (
            <>
              {input === '' ? null : <Block title={t('sessions/tool/arguments')} text={input} />}
              {outputOf(call).map((one, index) => <OutputView key={index} out={one} />)}
            </>
          )}
          <Block title={t('sessions/raw/sent')} text={json(step.source)} />
        </div>
      ) : null}
    </li>
  );
}

/**
 * The chat as its steps: each turn as a heading with its facts, then one row
 * per step, each opened in place. The filter keeps all steps, the tool calls,
 * or the subagents among them.
 */
export function RawView({ turns, filter, onFilter }: { turns: readonly RawTurn[]; filter: RawFilter; onFilter: (filter: RawFilter) => void }): ReactElement {
  const { t } = useI18n();
  const shown = turns.map((turn) => ({ turn, steps: shownSteps(turn.steps, filter) })).filter((one) => one.steps.length > 0);
  return (
    <div className="web-raw">
      <div className="web-raw__filters" role="radiogroup" aria-label={t('sessions/raw/filter')}>
        {FILTERS.map((one) => (
          <button key={one} type="button" role="radio" aria-checked={filter === one} className="web-chip" data-on={filter === one ? 'true' : undefined} onClick={() => onFilter(one)}>
            {t(`sessions/raw/filters/${one}`)}
          </button>
        ))}
      </div>
      {shown.length === 0 ? <p className="web-note">{t('sessions/raw/none')}</p> : shown.map(({ turn, steps }) => (
        <section key={turn.id} className="web-raw__turn">
          <header className="web-raw__turn-head">
            <span className="web-raw__turn-title">{t('sessions/raw/turn', { n: turn.index })}</span>
            <span className="web-note">{turnLine(turn, t)}</span>
          </header>
          <ol className="web-raw__steps">
            {steps.map((step) => <StepRow key={step.id} step={step} turn={turn} />)}
          </ol>
          <details className="web-raw__turn-source">
            <summary>{t('sessions/raw/turnSent')}</summary>
            <pre className="web-tool__pre">{json(turn.source)}</pre>
          </details>
        </section>
      ))}
    </div>
  );
}
