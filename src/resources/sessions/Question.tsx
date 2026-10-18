import { useState, type KeyboardEvent, type ReactElement } from 'react';
import { translate } from '@softov/scena';
import { useI18n } from '@softov/scena/react';
import { Button, Markdown } from '@softov/scena/ui';
import { plural } from '../../i18n/locales.js';
import type { ChatInputAnswer, ChatInputQuestion, ChatInputRequest, StateAction } from '@microsoft/agent-host-protocol';
import { EMPTY, allowsOther, answerWords, draftOf, encode, isChoice, optionsOf, type Draft } from './answer.js';
import type { Send } from './Parts.js';
import { useSessionHost } from './workspace.js';

/** What this page sent, by host and request id. Kept past the card: a finished turn draws it anew, and the host may never say. */
const SENT = new Map<string, Sent>();

/** Whether this window answered the question `requestId` of `host`. */
export function answeredHere(host: string, requestId: string): boolean {
  return SENT.has(`${host}\u0000${requestId}`);
}

interface Sent {
  response: 'accept' | 'decline';
  answers: Record<string, ChatInputAnswer>;
}

/** The line a request carries when the agent said nothing of its own. The host's own words, so not translated. */
const GENERIC = 'The agent has a question';

/** The hint of each kind of question, as `sessions/question/hint/<name>`. */
const HINT: Record<string, string> = { 'single-select': 'single', 'multi-select': 'multi', text: 'text', number: 'number', integer: 'number' };

/** What a question asks for, under its text: one message per kind, with or without its own answer. */
function hintOf(question: ChatInputQuestion): string {
  const base = HINT[String(question.kind)];
  const other = allowsOther(question);
  const name = base === undefined ? (other ? 'other' : undefined) : other ? `${base}Other` : base;
  if (name === undefined) return question.required === true ? '' : translate('sessions/question/hint/optional');
  const hint = translate(`sessions/question/hint/${name}`);
  return question.required === true ? hint : translate('sessions/question/hint/withOptional', { hint });
}

/** One question's form: option rows, an "Other" box, or a text field. */
function QuestionForm({ question, draft, set, next }: {
  question: ChatInputQuestion;
  draft: Draft;
  set: (draft: Draft) => void;
  next: () => void;
}): ReactElement {
  const { t } = useI18n();
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
      <textarea className="web-field web-ask__text" rows={3} autoFocus value={draft.text} placeholder={t('sessions/question/yourAnswer')} onChange={(event) => set({ ...draft, text: event.target.value })} onKeyDown={enterGoesOn} />
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
                {option.recommended === true ? <span className="web-ask__tag">{t('sessions/question/recommended')}</span> : null}
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
            aria-label={t('sessions/question/other')}
            onClick={() => set({ ...draft, other: !draft.other || !many, ...(many ? {} : { picked: [] }) })}
          />
          <input
            className="web-field"
            value={draft.text}
            placeholder={t('sessions/question/otherPlaceholder')}
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
  const { t } = useI18n();
  const sentKey = `${useSessionHost()}\u0000${request.id}`;
  const questions = request.questions ?? [];
  const [drafts, setDrafts] = useState<Record<string, Draft>>(() => Object.fromEntries(questions.map((one) => [one.id, draftOf(request.answers?.[one.id])])));
  const [page, setPage] = useState(0);
  const [sent, setSent] = useState<Sent | null>(() => SENT.get(sentKey) ?? null);
  const answers = Object.fromEntries(questions.flatMap((one) => {
    const answer = encode(one, drafts[one.id] ?? EMPTY);
    return answer === undefined ? [] : [[one.id, answer]];
  })) as Record<string, ChatInputAnswer>;
  const missing = questions.filter((one) => one.required === true && answers[one.id] === undefined);
  const message = request.message !== undefined && request.message !== GENERIC ? request.message : undefined;

  const complete = (kind: 'accept' | 'decline'): void => {
    const said: Sent = { response: kind, answers: kind === 'accept' ? answers : {} };
    SENT.set(sentKey, said);
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
          <span className="web-ask__title">{outcome === 'decline' ? t('sessions/question/declined') : outcome === undefined ? t('sessions/question/unanswered') : t('sessions/question/answered')}</span>
          {waiting ? <span className="web-note">{t('sessions/question/sending')}</span> : null}
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
        <span className="web-ask__title"><span className="web-ask__icon" aria-hidden="true">?</span>{message === undefined ? t('sessions/question/asks') : t('sessions/question/asksColon')}</span>
        {questions.length > 1 ? (
          <span className="web-ask__steps" aria-label={t('sessions/question/step', { page: page + 1, total: questions.length })}>
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
            <span className="web-ask__count">{t('sessions/question/count', { page: page + 1, total: questions.length })}</span>
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
        <Button label={t('sessions/question/decline')} size="sm" onClick={() => complete('decline')} />
        <span className="web-ask__spacer" />
        {page > 0 ? <Button label={t('sessions/question/back')} size="sm" onClick={() => setPage(page - 1)} /> : null}
        {last ? (
          <Button label={t('sessions/question/answer')} variant="primary" size="sm" disabled={missing.length > 0} onClick={() => complete('accept')} />
        ) : (
          <Button label={t('sessions/question/next')} variant="primary" size="sm" disabled={stuck} onClick={next} />
        )}
      </div>
      {last && missing.length > 0 && !stuck ? <p className="web-note">{plural('sessions/question/missing', missing.length)}</p> : null}
    </div>
  );
}
