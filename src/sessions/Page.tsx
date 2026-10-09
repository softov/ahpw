import { memo, useCallback, useEffect, useRef, useState, type ReactElement } from 'react';
import { useScena, useStore } from '@softov/scena/react';
import { Alert, Badge, Button, Spinner, Text } from '@softov/scena/ui';
import {
  chatReducer,
  sessionReducer,
  type ActiveTurn,
  type ChatInputRequest,
  type ChatState,
  type SessionState,
  type SessionSummary,
  type StateAction,
  type Turn,
} from '@microsoft/agent-host-protocol';
import { AHP_SESSIONS, dispatch, request } from '../connection/data.js';
import { useChannel } from '../connection/channel.js';
import { elapsed } from '../connection/words.js';
import { Part, type Send } from './Parts.js';
import { InputRequest } from './Question.js';
import { Activity } from './Activity.js';
import { groupParts } from './activity.js';
import { Composer } from './Composer.js';
import { WorkspaceContext } from './workspace.js';
import { ACTIVE_SESSION } from './state.js';
import { ACTIVITY_LABEL, ACTIVITY_TONE, activityOf, isRead } from './status.js';
import { factsOf, tokens, when, type TurnFacts } from './turn.js';

/** How a turn ended, in words, when it did not end well. */
const ENDED: Record<string, string> = { cancelled: 'Stopped', error: 'Ended with an error' };

/** A clock that moves once a second while `on`. */
function useNow(on: boolean): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!on) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [on]);
  return now;
}

/** The line under a turn: when, how long, the tokens, the model and the tools it called. */
function FactLine({ facts, state, live }: { facts: TurnFacts; state?: string; live: boolean }): ReactElement {
  const now = useNow(live);
  const took = live ? (facts.startedAt === undefined ? undefined : now - facts.startedAt) : facts.duration;
  const bits: string[] = [];
  if (facts.startedAt !== undefined) bits.push(when(facts.startedAt));
  if (took !== undefined) bits.push(live ? `${elapsed(took)} so far` : elapsed(took));
  if (facts.input !== undefined || facts.output !== undefined) bits.push(`\u{2191}${tokens(facts.input ?? 0)} \u{2193}${tokens(facts.output ?? 0)}`);
  if (facts.cacheRead !== undefined && facts.cacheRead > 0) bits.push(`${tokens(facts.cacheRead)} cached`);
  if (facts.model !== undefined) bits.push(facts.model);
  if (facts.tools > 0) bits.push(facts.tools === 1 ? '1 tool call' : `${facts.tools} tool calls`);
  return (
    <div className="web-turn__facts">
      {bits.join(' \u{00B7} ')}
      {state === undefined || ENDED[state] === undefined ? null : <span className="web-turn__ended" data-state={state}>{ENDED[state]}</span>}
    </div>
  );
}

const NONE: readonly ChatInputRequest[] = [];

/** A finished turn renders once: the reducer keeps its object while later turns stream. */
const TurnView = memo(function TurnView({ turn, live, send, open = NONE }: {
  turn: Turn | ActiveTurn;
  live: boolean;
  send: Send;
  /** Questions the session waits on that no part of this turn holds: what a page opened mid-question reads. */
  open?: readonly ChatInputRequest[];
}): ReactElement {
  const state = 'state' in turn ? String(turn.state) : undefined;
  const parts = turn.responseParts;
  return (
    <article className="web-turn">
      <div className="web-turn__ask">{turn.message.text}</div>
      <div className="web-turn__answer">
        {groupParts(parts, live, factsOf(turn).duration).map((shown) => shown.kind === 'activity'
          ? <Activity key={shown.id} group={shown} send={send} turnId={turn.id} />
          : <Part key={shown.index} part={shown.part} send={send} live={live} turnId={turn.id} />)}
        {live ? open.map((request) => <InputRequest key={request.id} request={request} send={send} live response={undefined} />) : null}
        {live && parts.length === 0 ? <Spinner label="Working" /> : null}
      </div>
      <FactLine facts={factsOf(turn)} {...(state === undefined ? {} : { state })} live={live} />
    </article>
  );
});

/** Asks the host for the page of turns before the oldest one shown. */
function OlderTurns({ chatUri, cursor }: { chatUri: string; cursor: string }): ReactElement {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const load = (): void => {
    setBusy(true);
    setError(null);
    request('fetchTurns', { channel: chatUri, cursor })
      .catch((caught: unknown) => setError(caught instanceof Error ? caught.message : String(caught)))
      .finally(() => setBusy(false));
  };
  return (
    <div className="web-chat__older">
      <Button label={busy ? 'Loading' : 'Load older turns'} disabled={busy} onClick={load} />
      {error === null ? null : <span className="web-note">{error}</span>}
    </div>
  );
}

/**
 * The questions this chat waits on that its running turn does not hold as a
 * part. A page opened mid-question finds them only in the session's
 * `inputNeeded`. One stays listed after the host drops it, until the turn
 * ends, so an answer sent from here stays on screen.
 */
function useOpenQuestions(needed: SessionState['inputNeeded'], chatUri: string | undefined, active: ActiveTurn | undefined): readonly ChatInputRequest[] {
  const kept = useRef<{ turn: string | undefined; requests: Map<string, ChatInputRequest> }>({ turn: undefined, requests: new Map() });
  if (kept.current.turn !== active?.id) kept.current = { turn: active?.id, requests: new Map() };
  if (active === undefined) return NONE;
  for (const entry of needed ?? []) {
    if (String(entry.kind) === 'chatInput' && entry.chat === chatUri && 'request' in entry) kept.current.requests.set(entry.id, entry.request);
  }
  const held = new Set(active.responseParts.flatMap((part) => ('request' in part ? [part.request.id] : [])));
  const out = [...kept.current.requests.values()].filter((request) => !held.has(request.id));
  return out.length === 0 ? NONE : out;
}

/** One session: what it is, its chat, and a composer to talk to it. */
export default function SessionPage({ resource }: { resource?: string }): ReactElement {
  const scena = useScena();
  const sessions = useStore<SessionSummary[]>(AHP_SESSIONS);
  const summary = sessions?.find((one) => one.resource === resource);
  const session = useChannel<SessionState>(resource, sessionReducer);
  const chatUri = session.state?.defaultChat ?? summary?.defaultChat;
  const chat = useChannel<ChatState>(chatUri, chatReducer);
  const end = useRef<HTMLDivElement>(null);
  // Following the newest turn, until a person scrolls up to read an older one.
  const following = useRef(true);
  const send = useCallback<Send>((action) => {
    if (chatUri !== undefined) dispatch(chatUri, action);
  }, [chatUri]);

  const turns = chat.state?.turns.length ?? 0;
  const open = useOpenQuestions(session.state?.inputNeeded, chatUri, chat.state?.activeTurn);
  // Grows with every delta, so the view follows text as it streams, not only new parts.
  const streamed = (chat.state?.activeTurn?.responseParts ?? []).reduce((total, part) => total + 1 + ('content' in part && typeof part.content === 'string' ? part.content.length : 0), 0);
  useEffect(() => {
    if (following.current) end.current?.scrollIntoView({ block: 'end' });
  }, [turns, streamed]);

  // A tab the layout restored is the session the details show, until another opens.
  useEffect(() => {
    if (resource !== undefined && scena.store.get(ACTIVE_SESSION) === undefined) scena.store.set(ACTIVE_SESSION, resource);
  }, [scena, resource]);

  // Opening a session is reading it, as far as the unread dot is concerned.
  const unread = summary !== undefined && !isRead(summary.status);
  useEffect(() => {
    if (unread && resource !== undefined) dispatch(resource, { type: 'session/isReadChanged', isRead: true } as StateAction);
  }, [unread, resource, turns]);

  if (summary === undefined) return <Alert tone="warning" message="This session is gone." />;
  const activity = activityOf(summary.status);
  const lifecycle = String(session.state?.lifecycle ?? 'ready');
  const doing = chat.state?.activity ?? summary.activity;

  return (
    <div className="web-chat">
      <header className="web-chat__head">
        <div className="web-chat__title">
          <Text variant="h2" text={summary.title === '' ? 'Untitled' : summary.title} />
          <Badge tone={ACTIVITY_TONE[activity]} text={ACTIVITY_LABEL[activity]} />
          {doing === undefined || doing === '' ? null : <span className="web-note">{doing}</span>}
        </div>
      </header>

      <div
        className="web-chat__turns"
        onScroll={(event) => {
          const box = event.currentTarget;
          following.current = box.scrollHeight - box.scrollTop - box.clientHeight < 48;
        }}
      >
        {lifecycle === 'creating' ? <Spinner label="Starting the session" /> : null}
        {lifecycle === 'failed' ? <Alert tone="danger" title="The session did not start" message={session.state?.creationError?.message ?? 'No reason given.'} /> : null}
        {session.error === null ? null : <Alert tone="danger" title="Session not readable" message={session.error} />}
        {chat.error === null ? null : <Alert tone="danger" title="Chat not readable" message={chat.error} />}
        {chatUri !== undefined && chat.state === undefined && chat.error === null ? <Spinner label="Reading the chat" /> : null}
        {chatUri === undefined || chat.state?.turnsNextCursor === undefined ? null : <OlderTurns chatUri={chatUri} cursor={chat.state.turnsNextCursor} />}
        <WorkspaceContext.Provider value={summary.workingDirectories?.[0] ?? null}>
          {chat.state?.turns.map((turn) => <TurnView key={turn.id} turn={turn} live={false} send={send} />)}
          {chat.state?.activeTurn === undefined ? null : <TurnView turn={chat.state.activeTurn} live send={send} open={open} />}
        </WorkspaceContext.Provider>
        {chat.state !== undefined && turns === 0 && chat.state.activeTurn === undefined ? <p className="web-note">No messages yet.</p> : null}
        <div ref={end} />
      </div>

      {chat.state === undefined || chatUri === undefined ? null : (
        <Composer
          chatUri={chatUri}
          activeId={chat.state.activeTurn?.id}
          activeStart={chat.state.activeTurn?.startedAt}
          queued={chat.state.queuedMessages}
          steering={chat.state.steeringMessage}
          draft={chat.state.draft}
          lastModel={chat.state.turns.at(-1)?.message.model?.id}
          config={session.state?.config}
          summary={summary}
          send={send}
        />
      )}
    </div>
  );
}
