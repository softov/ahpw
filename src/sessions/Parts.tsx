import { useState, type ReactElement } from 'react';
import { Alert, Button, Markdown } from '@softov/scena/ui';
import type {
  ChatInputAnswer,
  ChatInputQuestion,
  ChatInputRequest,
  ResponsePart,
  StateAction,
  ToolCallState,
} from '@microsoft/agent-host-protocol';
import { elapsed, textOf } from '../connection/words.js';
import { durationOf, inputText, lineOf, outcomeOf, outputOf, type Outcome, type Output } from './tool.js';

/** Sends one action on the chat this transcript shows. */
export type Send = (action: StateAction) => void;

/** Tool call statuses, as their wire values: the enum is ambient and `const`. */
const PENDING_CONFIRMATION = 'pending-confirmation';
const PENDING_RESULT_CONFIRMATION = 'pending-result-confirmation';

/** The mark a call carries collapsed, and the word behind it. */
const MARK: Record<Outcome, { glyph: string; label: string }> = {
  preparing: { glyph: '\u{25CC}', label: 'Preparing' },
  approval: { glyph: '\u{25D0}', label: 'Needs approval' },
  running: { glyph: '\u{25CF}', label: 'Running' },
  'sign-in': { glyph: '\u{25D0}', label: 'Needs sign-in' },
  review: { glyph: '\u{25D0}', label: 'Review result' },
  done: { glyph: '\u{2713}', label: 'Done' },
  failed: { glyph: '\u{2715}', label: 'Failed' },
  cancelled: { glyph: '\u{2715}', label: 'Cancelled' },
};

/** Text a person may want elsewhere, with a button that copies it. */
function Block({ title, text }: { title: string; text: string }): ReactElement {
  const [copied, setCopied] = useState(false);
  const copy = (): void => {
    void navigator.clipboard?.writeText(text).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    }).catch(() => undefined);
  };
  return (
    <section className="web-tool__block">
      <div className="web-tool__block-head">
        <span>{title}</span>
        <button type="button" className="web-tool__copy" onClick={copy}>{copied ? 'Copied' : 'Copy'}</button>
      </div>
      <pre className="web-tool__pre">{text}</pre>
    </section>
  );
}

function OutputView({ out }: { out: Output }): ReactElement {
  switch (out.kind) {
    case 'text':
      return <Block title="Output" text={out.text} />;
    case 'terminal':
      return (
        <Block
          title={`${out.title}${out.exitCode === undefined ? '' : ` \u{00B7} exit ${out.exitCode}`}${out.truncated ? ' \u{00B7} cut short' : ''}`}
          text={out.text === '' ? 'No output.' : out.text}
        />
      );
    case 'file':
      return (
        <p className="web-tool__file">
          <code>{out.path}</code>
          {out.added === undefined ? null : <span className="web-diff--add">+{out.added}</span>}
          {out.removed === undefined ? null : <span className="web-diff--remove">-{out.removed}</span>}
        </p>
      );
    case 'note':
      return <p className="web-note">{out.text}</p>;
  }
}

function ToolCall({ call, send, live, turnId }: { call: ToolCallState; send: Send; live: boolean; turnId: string }): ReactElement {
  const outcome = outcomeOf(call);
  const waiting = live && (outcome === 'approval' || outcome === 'review' || outcome === 'sign-in');
  const [open, setOpen] = useState(false);
  const shown = open || waiting;
  const duration = durationOf(call);
  const input = inputText(call);
  const output = outputOf(call);
  const name = call.displayName || call.toolName;
  const risk = call.status === PENDING_CONFIRMATION ? call.riskAssessment : undefined;
  return (
    <div className="web-tool" data-outcome={outcome}>
      <button type="button" className="web-tool__row" aria-expanded={shown} onClick={() => setOpen(!open)}>
        <span className="web-tool__mark" title={MARK[outcome].label} aria-label={MARK[outcome].label}>{MARK[outcome].glyph}</span>
        <span className="web-tool__line">{lineOf(call)}</span>
        {duration === undefined ? null : <span className="web-tool__time">{elapsed(duration)}</span>}
        <span className="web-tool__chevron" aria-hidden="true">{shown ? '\u{25BE}' : '\u{25B8}'}</span>
      </button>
      {shown ? (
        <div className="web-tool__body">
          <dl className="web-tool__facts">
            <dt>Tool</dt><dd><code>{call.toolName}</code>{name === call.toolName ? null : ` (${name})`}</dd>
            <dt>Status</dt><dd>{MARK[outcome].label}</dd>
            {call.intention === undefined ? null : <><dt>Why</dt><dd>{call.intention}</dd></>}
            {risk === undefined || risk.status !== 'complete' ? null : <><dt>Risk</dt><dd>{`${risk.safety}/10 safe \u{00B7} ${risk.reason}`}</dd></>}
          </dl>
          {input === '' ? null : <Block title="Arguments" text={input} />}
          {output.map((one, index) => <OutputView key={index} out={one} />)}
          {live && call.status === PENDING_CONFIRMATION ? <Confirm call={call} send={send} turnId={turnId} /> : null}
          {live && call.status === PENDING_RESULT_CONFIRMATION ? (
            <div className="web-tool__actions">
              <Button label="Accept result" variant="primary" onClick={() => send({ type: 'chat/toolCallResultConfirmed', turnId, toolCallId: call.toolCallId, approved: true } as StateAction)} />
              <Button label="Reject" onClick={() => send({ type: 'chat/toolCallResultConfirmed', turnId, toolCallId: call.toolCallId, approved: false } as StateAction)} />
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

/** The host's options for a call awaiting approval, or approve and deny when it offers none. */
function Confirm({ call, send, turnId }: { call: ToolCallState; send: Send; turnId: string }): ReactElement {
  const approve = (optionId?: string): void => send({
    type: 'chat/toolCallConfirmed',
    turnId,
    toolCallId: call.toolCallId,
    approved: true,
    confirmed: 'user-action',
    ...(optionId === undefined ? {} : { selectedOptionId: optionId }),
  } as StateAction);
  const deny = (optionId?: string): void => send({
    type: 'chat/toolCallConfirmed',
    turnId,
    toolCallId: call.toolCallId,
    approved: false,
    reason: 'denied',
    ...(optionId === undefined ? {} : { selectedOptionId: optionId }),
  } as StateAction);
  const options = call.status === PENDING_CONFIRMATION ? call.options ?? [] : [];
  const title = call.status === PENDING_CONFIRMATION ? textOf(call.confirmationTitle) : '';
  return (
    <div className="web-tool__confirm">
      {title === '' ? null : <Markdown text={title} />}
      <div className="web-tool__actions">
        {options.length === 0 ? (
          <>
            <Button label="Approve" variant="primary" onClick={() => approve()} />
            <Button label="Deny" onClick={() => deny()} />
          </>
        ) : options.map((option) => (
          <Button
            key={option.id}
            label={option.label}
            {...(option.kind === 'approve' ? { variant: 'primary' as const } : {})}
            onClick={() => (option.kind === 'approve' ? approve(option.id) : deny(option.id))}
          />
        ))}
      </div>
    </div>
  );
}

/** One question's answer as the protocol carries it. */
function answerOf(question: ChatInputQuestion, raw: unknown): ChatInputAnswer | undefined {
  const kind = String(question.kind);
  if (raw === undefined || raw === '') return undefined;
  const value = kind === 'text' ? { kind: 'text', value: String(raw) }
    : kind === 'number' || kind === 'integer' ? { kind: 'number', value: Number(raw) }
    : kind === 'boolean' ? { kind: 'boolean', value: raw === true }
    : kind === 'single-select' ? { kind: 'selected', value: String(raw) }
    : { kind: 'selected-many', value: raw as string[] };
  return { state: 'submitted', value } as ChatInputAnswer;
}

function Question({ question, value, set }: { question: ChatInputQuestion; value: unknown; set: (next: unknown) => void }): ReactElement {
  const kind = String(question.kind);
  const label = (
    <span className="web-input__label">
      {question.title ?? question.message}
      {question.required === true ? ' *' : ''}
    </span>
  );
  const message = question.title === undefined ? null : <span className="web-input__hint">{question.message}</span>;
  if (kind === 'boolean') {
    return (
      <label className="web-input__row">
        <input type="checkbox" checked={value === true} onChange={(event) => set(event.target.checked)} />
        {label}
        {message}
      </label>
    );
  }
  if (kind === 'single-select' || kind === 'multi-select') {
    const options = 'options' in question ? question.options : [];
    const many = kind === 'multi-select';
    const chosen = many ? (value as string[] | undefined) ?? [] : [];
    return (
      <fieldset className="web-input__group">
        <legend>{label}</legend>
        {message}
        {options.map((option) => (
          <label key={option.id} className="web-input__row">
            <input
              type={many ? 'checkbox' : 'radio'}
              name={question.id}
              checked={many ? chosen.includes(option.id) : value === option.id}
              onChange={(event) => set(many
                ? event.target.checked ? [...chosen, option.id] : chosen.filter((one) => one !== option.id)
                : option.id)}
            />
            {option.label}
            {option.description === undefined ? null : <span className="web-input__hint">{option.description}</span>}
          </label>
        ))}
      </fieldset>
    );
  }
  return (
    <label className="web-input__group">
      {label}
      {message}
      <input
        className="web-field"
        type={kind === 'text' ? 'text' : 'number'}
        value={typeof value === 'string' || typeof value === 'number' ? value : ''}
        onChange={(event) => set(event.target.value)}
      />
    </label>
  );
}

/** A question the agent asked, answered here while its turn waits. */
function InputRequest({ request, send, live, answered }: { request: ChatInputRequest; send: Send; live: boolean; answered: boolean }): ReactElement {
  const questions = request.questions ?? [];
  const [values, setValues] = useState<Record<string, unknown>>({});
  const missing = questions.some((question) => question.required === true && answerOf(question, values[question.id]) === undefined);
  const complete = (response: 'accept' | 'decline'): void => {
    const answers = Object.fromEntries(questions.flatMap((question) => {
      const answer = answerOf(question, values[question.id]);
      return answer === undefined ? [] : [[question.id, answer]];
    }));
    send({
      type: 'chat/inputCompleted',
      requestId: request.id,
      response,
      ...(response === 'accept' && Object.keys(answers).length > 0 ? { answers } : {}),
    } as StateAction);
  };
  return (
    <div className="web-input">
      {request.message === undefined ? null : <Markdown text={request.message} />}
      {request.url === undefined ? null : <a href={request.url} target="_blank" rel="noreferrer">{request.url}</a>}
      {live && !answered ? (
        <>
          {questions.map((question) => (
            <Question key={question.id} question={question} value={values[question.id]} set={(next) => setValues({ ...values, [question.id]: next })} />
          ))}
          <div className="web-tool__actions">
            <Button label="Answer" variant="primary" disabled={missing} onClick={() => complete('accept')} />
            <Button label="Decline" onClick={() => complete('decline')} />
          </div>
        </>
      ) : <span className="web-input__hint">{answered ? 'Answered.' : 'Not answered.'}</span>}
    </div>
  );
}

/** One part of an agent's response. `live` is true while its turn still runs. */
export function Part({ part, send, live, turnId }: { part: ResponsePart; send: Send; live: boolean; turnId: string }): ReactElement | null {
  switch (String(part.kind)) {
    case 'markdown':
      return 'content' in part ? <Markdown text={part.content as string} /> : null;
    case 'reasoning':
      return 'content' in part && part.content !== '' ? (
        <details className="web-reasoning">
          <summary>Thinking</summary>
          <Markdown text={part.content as string} />
        </details>
      ) : null;
    case 'toolCall':
      return 'toolCall' in part ? <ToolCall call={part.toolCall} send={send} live={live} turnId={turnId} /> : null;
    case 'inputRequest':
      return 'request' in part ? <InputRequest request={part.request} send={send} live={live} answered={'response' in part && part.response !== undefined} /> : null;
    case 'error':
      return <Alert tone="danger" message={'message' in part ? String(part.message) : 'The agent reported an error.'} />;
    case 'systemNotification':
      return <p className="web-note">{'content' in part ? textOf(part.content as string) : ''}</p>;
    default:
      return null;
  }
}
