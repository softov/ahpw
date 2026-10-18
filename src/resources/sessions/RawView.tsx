import { useState, type ReactElement } from 'react';
import { useI18n } from '@softov/scena/react';
import { elapsed } from '../../bridges/words.js';
import { CopyButton } from '../../shell/controls/CopyButton.js';
import { JsonTree } from '../../shell/view/JsonTree.js';
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

/** How an opened step reads: its facts and what went in and out, the object the host sent as text to copy, or as a tree to open. */
type StepView = 'formatted' | 'raw' | 'json';

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

/** The views an opened row toggles between, as words, the chosen one bright, and a copy of what the host sent. */
function ViewToggle({ view, setView, source }: { view: StepView; setView: (view: StepView) => void; source: unknown }): ReactElement {
  const { t } = useI18n();
  return (
    <div className="web-raw__views" role="radiogroup" aria-label={t('sessions/raw/view')}>
      {(['formatted', 'raw', 'json'] as const).map((one, at) => (
        <span key={one} className="web-raw__view-item">
          {at === 0 ? null : <span className="web-raw__view-gap" aria-hidden="true">/</span>}
          <button type="button" role="radio" aria-checked={view === one} className="web-raw__view" data-on={view === one ? 'true' : undefined} onClick={() => setView(one)}>
            {t(`sessions/raw/views/${one}`)}
          </button>
        </span>
      ))}
      <CopyButton text={json(source)} />
    </div>
  );
}

/** What the host sent, as text or as a tree. */
function SourceView({ view, source }: { view: Exclude<StepView, 'formatted'>; source: unknown }): ReactElement {
  return view === 'raw' ? <pre className="web-tool__pre">{json(source)}</pre> : <div className="web-raw__tree"><JsonTree value={source} /></div>;
}

/** A turn's heading, opened in place to its facts or to what the host sent for it, less its steps. */
function TurnHead({ turn, view, setView }: { turn: RawTurn; view: StepView; setView: (view: StepView) => void }): ReactElement {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const { startedAt, duration, model, input, output, cacheRead, tools } = turn.facts;
  return (
    <>
      <button type="button" className="web-raw__turn-head" aria-expanded={open} onClick={() => setOpen(!open)}>
        <span className="web-raw__turn-title">{t('sessions/raw/turn', { n: turn.index })}</span>
        <span className="web-note">{turnLine(turn, t)}</span>
      </button>
      {open ? (
        <div className="web-raw__body">
          <ViewToggle view={view} setView={setView} source={turn.source} />
          {view !== 'formatted' ? <SourceView view={view} source={turn.source} /> : (
            <dl className="web-tool__facts">
              {startedAt === undefined ? null : <><dt>{t('sessions/raw/started')}</dt><dd>{when(startedAt)}</dd></>}
              {duration === undefined ? null : <><dt>{t('sessions/raw/took')}</dt><dd>{elapsed(duration)}</dd></>}
              {model === undefined ? null : <><dt>{t('sessions/raw/model')}</dt><dd>{model}</dd></>}
              {input === undefined && output === undefined ? null : <><dt>{t('sessions/raw/tokenLabel')}</dt><dd>{t('sessions/raw/tokens', { input: tokens(input ?? 0), output: tokens(output ?? 0) })}</dd></>}
              {cacheRead === undefined ? null : <><dt>{t('sessions/raw/cacheRead')}</dt><dd>{tokens(cacheRead)}</dd></>}
              <dt>{t('sessions/raw/stepCount')}</dt><dd>{turn.steps.length}</dd>
              <dt>{t('sessions/raw/toolCount')}</dt><dd>{tools}</dd>
            </dl>
          )}
        </div>
      ) : null}
    </>
  );
}

/**
 * One step: its line, opened in place to its facts and what went in and came
 * out, or, toggled, to the object the host sent alone; a call that spawned a
 * subagent opens its chat. The toggle is kept for every step, so a person
 * reading JSON keeps reading JSON.
 */
function StepRow({ step, turn, subagent, onOpenChat, view, setView }: {
  step: RawStep;
  turn: RawTurn;
  subagent: string | undefined;
  onOpenChat: (chat: string) => void;
  view: StepView;
  setView: (view: StepView) => void;
}): ReactElement {
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
          <ViewToggle view={view} setView={setView} source={step.source} />
          {view !== 'formatted' ? <SourceView view={view} source={step.source} /> : (
            <>
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
              {subagent === undefined ? null : (
                <button type="button" className="web-link" onClick={() => onOpenChat(subagent)}>{t('sessions/raw/openSubagent')}</button>
              )}
            </>
          )}
        </div>
      ) : null}
    </li>
  );
}

/**
 * The chat as its steps: each turn as a heading with its facts, then one row
 * per step, each opened in place. The filter keeps all steps, the tool calls,
 * or the calls that spawned a subagent chat (`spawned`, by tool call id).
 */
export function RawView({ turns, filter, onFilter, spawned, onOpenChat }: {
  turns: readonly RawTurn[];
  filter: RawFilter;
  onFilter: (filter: RawFilter) => void;
  spawned: ReadonlyMap<string, string>;
  onOpenChat: (chat: string) => void;
}): ReactElement {
  const { t } = useI18n();
  const [view, setView] = useState<StepView>('formatted');
  const shown = turns.map((turn) => ({ turn, steps: shownSteps(turn.steps, filter, spawned) })).filter((one) => one.steps.length > 0);
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
          <TurnHead turn={turn} view={view} setView={setView} />
          <ol className="web-raw__steps">
            {steps.map((step) => <StepRow key={step.id} step={step} turn={turn} subagent={step.call === undefined ? undefined : spawned.get(step.call.toolCallId)} onOpenChat={onOpenChat} view={view} setView={setView} />)}
          </ol>
        </section>
      ))}
    </div>
  );
}
