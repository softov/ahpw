import { useState, type KeyboardEvent, type ReactElement } from 'react';
import { Button, Markdown } from '@softov/scena/ui';
import type { ChatInputAnswer, ChatInputQuestion, ChatInputRequest, StateAction } from '@microsoft/agent-host-protocol';
import { EMPTY, allowsOther, answerWords, draftOf, encode, isChoice, optionsOf, type Draft } from './answer.js';
import type { Send } from './Parts.js';

/** What this page sent, by request id. Kept past the card: a finished turn draws it anew, and the host may never say. */
const SENT = new Map<string, Sent>();

interface Sent {
  response: 'accept' | 'decline';
  answers: Record<string, ChatInputAnswer>;
}

/** The line a request carries when the agent said nothing of its own. */
const GENERIC = 'The agent has a question';

/** What a question asks for, under its text. */
function hintOf(question: ChatInputQuestion): string {
  const kind = String(question.kind);
  const bits: string[] = [];
  if (kind === 'single-select') bits.push('Pick one');
  if (kind === 'multi-select') bits.push('Pick any');
  if (kind === 'text') bits.push('Type an answer');
  if (kind === 'number' || kind === 'integer') bits.push('Type a number');
  if (allowsOther(question)) bits.push('or write your own');
  return `${bits.join(', ')}${question.required === true ? '' : ' (optional)'}`;
}

/** One question's form: option rows, an "Other" box, or a text field. */
function QuestionForm({ question, draft, set, next }: {
  question: ChatInputQuestion;
  draft: Draft;
  set: (draft: Draft) => void;
  next: () => void;
}): ReactElement {
  const kind = String(question.kind);
  const many = kind === 'multi-select';
  const pick = (id: string): void => {
    if (many) set({ ...draft, picked: draft.picked.includes(id) ? draft.picked.filter((one) => one !== id) : [...draft.picked, id] });
    else set({ ...draft, picked: [id], other: false });
  };
  const enterGoesOn = (event: KeyboardEvent): void => {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      next();
    }
  };

  if (!isChoice(question)) {
    const number = kind === 'number' || kind === 'integer';
    return number ? (
      <input className="web-field" type="number" autoFocus value={draft.text} onChange={(event) => set({ ...draft, text: event.target.value })} onKeyDown={enterGoesOn} />
    ) : (
      <textarea className="web-field web-ask__text" rows={3} autoFocus value={draft.text} placeholder="Your answer" onChange={(event) => set({ ...draft, text: event.target.value })} onKeyDown={enterGoesOn} />
    );
  }

  return (
    <div className="web-ask__options" role={many ? 'group' : 'radiogroup'}>
      {optionsOf(question).map((option, index) => {
        const on = draft.picked.includes(option.id);
        return (
          <button key={option.id} type="button" className="web-ask__option" role={many ? 'checkbox' : 'radio'} aria-checked={on} data-on={on} onClick={() => pick(option.id)}>
            <span className="web-ask__mark" data-many={many} aria-hidden="true" />
            <span className="web-ask__option-body">
              <span className="web-ask__option-label">
                <span className="web-ask__key">{index + 1}</span>
                {option.label}
                {option.recommended === true ? <span className="web-ask__tag">Recommended</span> : null}
              </span>
              {option.description === undefined ? null : <span className="web-ask__option-hint">{option.description}</span>}
            </span>
          </button>
        );
      })}
      {allowsOther(question) ? (
        <div className="web-ask__option web-ask__other" data-on={draft.other}>
          <button
            type="button"
            className="web-ask__mark"
            data-many={many}
            role={many ? 'checkbox' : 'radio'}
            aria-checked={draft.other}
            aria-label="Other"
            onClick={() => set({ ...draft, other: !draft.other || !many, ...(many ? {} : { picked: [] }) })}
          />
          <input
            className="web-field"
            value={draft.text}
            placeholder="Other: write your own answer"
            onFocus={() => { if (!draft.other) set({ ...draft, other: true, ...(many ? {} : { picked: [] }) }); }}
            onChange={(event) => set({ ...draft, text: event.target.value, other: true, ...(many ? {} : { picked: [] }) })}
            onKeyDown={enterGoesOn}
          />
        </div>
      ) : null}
    </div>
  );
}

/**
 * A question the agent asked, one page per question, answered here while its
 * turn waits. What was sent shows at once: the host says so only once the
 * agent has moved on.
 */
export function InputRequest({ request, send, live, response }: {
  request: ChatInputRequest;
  send: Send;
  live: boolean;
  response: string | undefined;
}): ReactElement {
  const questions = request.questions ?? [];
  const [drafts, setDrafts] = useState<Record<string, Draft>>(() => Object.fromEntries(questions.map((one) => [one.id, draftOf(request.answers?.[one.id])])));
  const [page, setPage] = useState(0);
  const [sent, setSent] = useState<Sent | null>(() => SENT.get(request.id) ?? null);
  const answers = Object.fromEntries(questions.flatMap((one) => {
    const answer = encode(one, drafts[one.id] ?? EMPTY);
    return answer === undefined ? [] : [[one.id, answer]];
  })) as Record<string, ChatInputAnswer>;
  const missing = questions.filter((one) => one.required === true && answers[one.id] === undefined);
  const message = request.message !== undefined && request.message !== GENERIC ? request.message : undefined;

  const complete = (kind: 'accept' | 'decline'): void => {
    const said: Sent = { response: kind, answers: kind === 'accept' ? answers : {} };
    SENT.set(request.id, said);
    setSent(said);
    send({ type: 'chat/inputCompleted', requestId: request.id, response: kind, ...(kind === 'accept' && Object.keys(answers).length > 0 ? { answers } : {}) } as StateAction);
  };

  // Done: what the host says, or what this page sent, whichever is known.
  const outcome = response ?? sent?.response;
  if (outcome !== undefined || !live) {
    const held = sent?.answers ?? request.answers ?? {};
    const waiting = sent !== null && response === undefined && live;
    return (
      <div className="web-ask" data-done="true">
        <div className="web-ask__head">
          <span className="web-ask__title">{outcome === 'decline' ? 'Question declined' : outcome === undefined ? 'Question not answered' : 'Question answered'}</span>
          {waiting ? <span className="web-note">Sending to the agent</span> : null}
        </div>
        {outcome === 'accept' ? (
          <dl className="web-ask__summary">
            {questions.map((one) => (
              <div key={one.id}>
                <dt>{one.title ?? one.message}</dt>
                <dd>{answerWords(one, held[one.id])}</dd>
              </div>
            ))}
          </dl>
        ) : null}
      </div>
    );
  }

  const question = questions[page];
  const last = page >= questions.length - 1;
  const here = question === undefined ? undefined : answers[question.id];
  const stuck = question !== undefined && question.required === true && here === undefined;
  const next = (): void => {
    if (stuck) return;
    if (last) { if (missing.length === 0) complete('accept'); } else setPage(page + 1);
  };

  // A number picks that option, while no text field has the keys.
  const keys = (event: KeyboardEvent): void => {
    const target = event.target as HTMLElement;
    if (question === undefined || target.closest('input, textarea') !== null || !/^[1-9]$/.test(event.key)) return;
    const option = optionsOf(question)[Number(event.key) - 1];
    if (option === undefined) return;
    const draft = drafts[question.id] ?? EMPTY;
    const many = String(question.kind) === 'multi-select';
    const picked = many ? (draft.picked.includes(option.id) ? draft.picked.filter((one) => one !== option.id) : [...draft.picked, option.id]) : [option.id];
    setDrafts({ ...drafts, [question.id]: { ...draft, picked, ...(many ? {} : { other: false }) } });
  };

  return (
    <div className="web-ask" tabIndex={-1} onKeyDown={keys}>
      <div className="web-ask__head">
        <span className="web-ask__title"><span className="web-ask__icon" aria-hidden="true">?</span>{message === undefined ? 'The agent asks' : 'The agent asks:'}</span>
        {questions.length > 1 ? (
          <span className="web-ask__steps" aria-label={`Question ${page + 1} of ${questions.length}`}>
            {questions.map((one, index) => (
              <button
                key={one.id}
                type="button"
                className="web-ask__step"
                data-here={index === page}
                data-done={answers[one.id] !== undefined}
                title={one.title ?? one.message}
                onClick={() => setPage(index)}
              />
            ))}
            <span className="web-ask__count">{page + 1} of {questions.length}</span>
          </span>
        ) : null}
      </div>
      {message === undefined ? null : <div className="web-ask__message"><Markdown text={message} /></div>}
      {request.url === undefined ? null : <a className="web-link" href={request.url} target="_blank" rel="noreferrer">{request.url}</a>}
      {question === undefined ? null : (
        <section className="web-ask__question" key={question.id}>
          {question.title === undefined ? null : <span className="web-ask__chip">{question.title}</span>}
          <div className="web-ask__text-line">{question.message}</div>
          <div className="web-ask__hint">{hintOf(question)}</div>
          <QuestionForm question={question} draft={drafts[question.id] ?? EMPTY} set={(draft) => setDrafts({ ...drafts, [question.id]: draft })} next={next} />
        </section>
      )}
      <div className="web-ask__actions">
        <Button label="Decline" size="sm" onClick={() => complete('decline')} />
        <span className="web-ask__spacer" />
        {page > 0 ? <Button label="Back" size="sm" onClick={() => setPage(page - 1)} /> : null}
        {last ? (
          <Button label="Answer" variant="primary" size="sm" disabled={missing.length > 0} onClick={() => complete('accept')} />
        ) : (
          <Button label="Next" variant="primary" size="sm" disabled={stuck} onClick={next} />
        )}
      </div>
      {last && missing.length > 0 && !stuck ? <p className="web-note">{missing.length === 1 ? 'One question still needs an answer.' : `${missing.length} questions still need an answer.`}</p> : null}
    </div>
  );
}
