import { useEffect, useRef, useState, type KeyboardEvent, type ReactElement } from 'react';
import { useStore } from '@softov/scena/react';
import { Alert, Badge, Button, Spinner, Text } from '@softov/scena/ui';
import {
  chatReducer,
  sessionReducer,
  type ActiveTurn,
  type ChatState,
  type Message,
  type SessionState,
  type SessionSummary,
  type StateAction,
  type Turn,
} from '@microsoft/agent-host-protocol';
import { AHP_SESSIONS, dispatch } from '../connection/data.js';
import { useChannel } from '../connection/channel.js';
import { folderLabel, newId } from '../connection/words.js';
import { Part, type Send } from './Parts.js';
import { ACTIVITY_LABEL, ACTIVITY_TONE, activityOf } from './status.js';

/** How a turn ended, in words, when it did not end well. */
const ENDED: Record<string, string> = { cancelled: 'Stopped.', error: 'The turn ended with an error.' };

const userMessage = (text: string): Message => ({ text, origin: { kind: 'user' } } as Message);

function TurnView({ id, message, parts, ended, live, send }: {
  id: string;
  message: Message;
  parts: Turn['responseParts'];
  ended?: string | undefined;
  live: boolean;
  send: Send;
}): ReactElement {
  return (
    <article className="web-turn">
      <div className="web-turn__ask">{message.text}</div>
      <div className="web-turn__answer">
        {parts.map((part, index) => <Part key={index} part={part} send={send} live={live} turnId={id} />)}
        {live && parts.length === 0 ? <Spinner label="Working" /> : null}
        {ended === undefined ? null : <p className="web-note">{ENDED[ended] ?? ''}</p>}
      </div>
    </article>
  );
}

function Composer({ chat, send }: { chat: ChatState; send: Send }): ReactElement {
  const [text, setText] = useState('');
  const active: ActiveTurn | undefined = chat.activeTurn;
  const queued = chat.queuedMessages ?? [];

  const submit = (): void => {
    const said = text.trim();
    if (said === '') return;
    if (active === undefined) {
      send({ type: 'chat/turnStarted', turnId: newId(), startedAt: new Date().toISOString(), message: userMessage(said) } as StateAction);
    } else {
      // The host starts a queued message as its own turn once this one ends.
      send({ type: 'chat/pendingMessageSet', kind: 'queued', id: newId(), message: userMessage(said) } as StateAction);
    }
    setText('');
  };
  const stop = (): void => {
    if (active === undefined) return;
    const started = Date.parse(active.startedAt);
    send({ type: 'chat/turnCancelled', turnId: active.id, duration: Number.isNaN(started) ? 0 : Math.max(0, Date.now() - started) } as StateAction);
  };
  const onKey = (event: KeyboardEvent<HTMLTextAreaElement>): void => {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      submit();
    }
  };

  return (
    <div className="web-composer">
      {queued.length === 0 ? null : (
        <ul className="web-composer__queue">
          {queued.map((one) => (
            <li key={one.id}>
              <span>{one.message.text}</span>
              <Button label="Remove" onClick={() => send({ type: 'chat/pendingMessageRemoved', kind: 'queued', id: one.id } as StateAction)} />
            </li>
          ))}
        </ul>
      )}
      <textarea
        className="web-composer__text"
        rows={3}
        value={text}
        placeholder={active === undefined ? 'Message the agent' : 'Queue a message for after this turn'}
        onChange={(event) => setText(event.target.value)}
        onKeyDown={onKey}
      />
      <div className="web-composer__actions">
        {active === undefined ? null : <Button label="Stop" onClick={stop} />}
        <Button label={active === undefined ? 'Send' : 'Queue'} variant="primary" disabled={text.trim() === ''} onClick={submit} />
      </div>
    </div>
  );
}

/** One session: its chat, and a composer to talk to it. */
export default function SessionPage({ resource }: { resource?: string }): ReactElement {
  const sessions = useStore<SessionSummary[]>(AHP_SESSIONS);
  const summary = sessions?.find((one) => one.resource === resource);
  const session = useChannel<SessionState>(resource, sessionReducer);
  const chatUri = session.state?.defaultChat ?? summary?.defaultChat;
  const chat = useChannel<ChatState>(chatUri, chatReducer);
  const end = useRef<HTMLDivElement>(null);
  const send: Send = (action) => {
    if (chatUri !== undefined) dispatch(chatUri, action);
  };

  const turns = chat.state?.turns.length ?? 0;
  const streamed = chat.state?.activeTurn?.responseParts.length ?? 0;
  useEffect(() => {
    end.current?.scrollIntoView({ block: 'end' });
  }, [turns, streamed]);

  if (summary === undefined) return <Alert tone="warning" message="This session is gone." />;
  const activity = activityOf(summary.status);
  const folder = summary.workingDirectories?.[0];

  return (
    <div className="web-chat">
      <header className="web-chat__head">
        <Text variant="h2" text={summary.title === '' ? 'Untitled' : summary.title} />
        <div className="web-page__route">
          <Badge tone={ACTIVITY_TONE[activity]} text={ACTIVITY_LABEL[activity]} />
          <span className="web-method">{summary.provider}</span>
          {folder === undefined ? null : <code>{folderLabel(folder)}</code>}
        </div>
      </header>

      <div className="web-chat__turns">
        {session.error === null ? null : <Alert tone="danger" title="Session not readable" message={session.error} />}
        {chat.error === null ? null : <Alert tone="danger" title="Chat not readable" message={chat.error} />}
        {chatUri !== undefined && chat.state === undefined && chat.error === null ? <Spinner label="Reading the chat" /> : null}
        {chat.state?.turnsNextCursor === undefined ? null : <p className="web-note">Older turns are not shown.</p>}
        {chat.state?.turns.map((turn) => (
          <TurnView key={turn.id} id={turn.id} message={turn.message} parts={turn.responseParts} ended={String(turn.state) === 'complete' ? undefined : String(turn.state)} live={false} send={send} />
        ))}
        {chat.state?.activeTurn === undefined ? null : (
          <TurnView id={chat.state.activeTurn.id} message={chat.state.activeTurn.message} parts={chat.state.activeTurn.responseParts} live send={send} />
        )}
        {chat.state !== undefined && turns === 0 && chat.state.activeTurn === undefined ? <p className="web-note">No messages yet.</p> : null}
        <div ref={end} />
      </div>

      {chat.state === undefined ? null : <Composer chat={chat.state} send={send} />}
    </div>
  );
}
