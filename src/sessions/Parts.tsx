import { useState, type ReactElement } from 'react';
import { Alert, Badge, Button, Markdown } from '@softov/scena/ui';
import type {
  ChatInputAnswer,
  ChatInputQuestion,
  ChatInputRequest,
  ResponsePart,
  StateAction,
  ToolCallState,
} from '@microsoft/agent-host-protocol';
import { textOf } from '../connection/words.js';

/** Sends one action on the chat this transcript shows. */
export type Send = (action: StateAction) => void;

/** Tool call statuses, as their wire values: the enum is ambient and `const`. */
const PENDING_CONFIRMATION = 'pending-confirmation';
const PENDING_RESULT_CONFIRMATION = 'pending-result-confirmation';

const TOOL_LABEL: Record<string, string> = {
  streaming: 'Preparing',
  'pending-confirmation': 'Needs approval',
  running: 'Running',
  'auth-required': 'Needs sign-in',
  'pending-result-confirmation': 'Review result',
  completed: 'Done',
  cancelled: 'Cancelled',
};

const TOOL_TONE: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
  streaming: 'info',
  'pending-confirmation': 'warning',
  running: 'info',
  'auth-required': 'warning',
  'pending-result-confirmation': 'warning',
  completed: 'success',
  cancelled: 'default',
};

/** What a tool call says it does or did. */
function toolLine(call: ToolCallState): string {
  if (call.status === 'completed') return textOf(call.pastTenseMessage) || textOf(call.invocationMessage);
  if (call.status === 'streaming') return call.displayName;
  return textOf(call.invocationMessage) || call.displayName;
}

function ToolCall({ call, send, live, turnId }: { call: ToolCallState; send: Send; live: boolean; turnId: string }): ReactElement {
  const failed = call.status === 'completed' && !call.success;
  const status = String(call.status);
  return (
    <div className="web-tool">
      <div className="web-tool__head">
        <span className="web-tool__name">{call.displayName}</span>
        <Badge tone={failed ? 'danger' : TOOL_TONE[status] ?? 'default'} text={failed ? 'Failed' : TOOL_LABEL[status] ?? status} />
      </div>
      <Markdown text={toolLine(call)} />
      {live && status === PENDING_CONFIRMATION ? <Confirm call={call} send={send} turnId={turnId} /> : null}
      {live && status === PENDING_RESULT_CONFIRMATION ? (
        <div className="web-tool__actions">
          <Button label="Accept result" variant="primary" onClick={() => send({ type: 'chat/toolCallResultConfirmed', turnId, toolCallId: call.toolCallId, approved: true } as StateAction)} />
          <Button label="Reject" onClick={() => send({ type: 'chat/toolCallResultConfirmed', turnId, toolCallId: call.toolCallId, approved: false } as StateAction)} />
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
