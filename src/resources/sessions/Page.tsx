import { memo, useCallback, useEffect, useRef, useState, type ReactElement } from 'react';
import { useI18n, useScena, useStore } from '@softov/scena/react';
import { Alert, Badge, Button, Spinner, Text } from '@softov/scena/ui';
import {
  chatReducer,
  sessionReducer,
  type ActiveTurn,
  type ChatInputRequest,
  type ChatState,
  type MessageAttachment,
  type SessionState,
  type SessionSummary,
  type StateAction,
  type Turn,
} from '@microsoft/agent-host-protocol';
import { ahpPaths, hostBridge } from '../../bridges/data.js';
import { useChannel } from '../../bridges/channel.js';
import { elapsed } from '../../bridges/words.js';
import { Part, type Send } from './Parts.js';
import { RawView } from './RawView.js';
import { spawnedBy } from './header.js';
import { rawOf, type RawFilter } from './raw.js';
import { SessionHeaderTools } from './SessionHeader.js';
import { InputRequest } from './Question.js';
import { Activity } from './Activity.js';
import { groupParts } from './activity-parts.js';
import { Composer } from './Composer.js';
import { SessionHostContext, WorkspaceContext } from './workspace.js';
import { ACTIVE_SESSION, type ActiveSession } from './state.js';
import { ACTIVITY_TONE, activityLabel, activityOf, isRead } from './status.js';
import { plural } from '../../i18n/locales.js';
import { factsOf, replyText, tokens, when, type TurnFacts } from './turn.js';
import { attachmentIcon, attachmentLabel, hasPreview, previewOf, type AttachmentPreviewOf } from './attachments.js';
import { AttachmentPreview } from './Attached.js';
import { EMOJIcon } from '../emojis.js';
import { CopyButton } from '../../shell/controls/CopyButton.js';
import { PageAlert } from '../../shell/view/PageAlert.js';
import { BotChat } from '../bots/chat/BotChat.js';
import { botMarkOf } from '../bots/chat/mark.js';

/** How a turn ended, as the key of its words, when it did not end well. */
const ENDED: Record<string, string> = { cancelled: 'sessions/turn/stopped', error: 'sessions/turn/failed' };

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

/** The line under a turn: a copy of its reply, when, how long, the tokens, the model and the tools it called. */
function FactLine({ facts, state, live, text }: { facts: TurnFacts; state?: string; live: boolean; text: string }): ReactElement {
  const { t } = useI18n();
  const now = useNow(live);
  const took = live ? (facts.startedAt === undefined ? undefined : now - facts.startedAt) : facts.duration;
  const bits: string[] = [];
  if (facts.startedAt !== undefined) bits.push(when(facts.startedAt));
  if (took !== undefined) bits.push(live ? t('sessions/turn/soFar', { time: elapsed(took) }) : elapsed(took));
  if (facts.input !== undefined || facts.output !== undefined) bits.push(`\u{2191}${tokens(facts.input ?? 0)} \u{2193}${tokens(facts.output ?? 0)}`);
  if (facts.cacheRead !== undefined && facts.cacheRead > 0) bits.push(t('sessions/turn/cached', { tokens: tokens(facts.cacheRead) }));
  if (facts.model !== undefined) bits.push(facts.model);
  if (facts.tools > 0) bits.push(plural('sessions/turn/toolCalls', facts.tools));
  const ended = state === undefined ? undefined : ENDED[state];
  return (
    <div className="web-turn__facts">
      {live || text === '' ? null : <CopyButton text={text} label={t('sessions/turn/copyReply')} />}
      {bits.join(' \u{00B7} ')}
      {ended === undefined ? null : <span className="web-turn__ended" data-state={state}>{t(ended)}</span>}
    </div>
  );
}

const NONE: readonly ChatInputRequest[] = [];

/** What a message carried along with its text: a file opens where it is one, what the message holds opens a preview. */
function SentAttachments({ attachments }: { attachments: readonly MessageAttachment[] }): ReactElement {
  const scena = useScena();
  const { t } = useI18n();
  const [preview, setPreview] = useState<AttachmentPreviewOf | null>(null);
  return (
    <div className="web-turn__attached">
      {attachments.map((attachment, index) => {
        const held = attachment as { uri?: unknown; displayKind?: unknown };
        const uri = typeof held.uri === 'string' && held.displayKind !== 'directory' ? held.uri : undefined;
        const label = attachmentLabel(attachment);
        const body = <><span className="web-attachment__icon">{attachmentIcon(attachment)}</span><span className="web-attachment__label">{label}</span></>;
        if (hasPreview(attachment)) return <button key={index} type="button" className="web-attachment" title={t('sessions/attachments/see', { name: label })} onClick={() => setPreview(previewOf(attachment))}>{body}</button>;
        return uri === undefined
          ? <span key={index} className="web-attachment" title={label}>{body}</span>
          : <button key={index} type="button" className="web-attachment" title={t('sessions/attachments/open', { name: label })} onClick={() => void scena.commands.execute('ahp.openFile', { uri })}>{body}</button>;
      })}
      {preview === null ? null : <AttachmentPreview preview={preview} onClose={() => setPreview(null)} />}
    </div>
  );
}

/** A finished turn renders once: the reducer keeps its object while later turns stream. */
const TurnView = memo(function TurnView({ turn, live, send, open = NONE }: {
  turn: Turn | ActiveTurn;
  live: boolean;
  send: Send;
  /** Questions the session waits on that no part of this turn holds: what a page opened mid-question reads. */
  open?: readonly ChatInputRequest[];
}): ReactElement {
  const { t } = useI18n();
  const state = 'state' in turn ? String(turn.state) : undefined;
  const parts = turn.responseParts;
  return (
    <article className="web-turn">
      <div className="web-turn__ask">
        {turn.message.text}
        {turn.message.attachments === undefined || turn.message.attachments.length === 0 ? null : <SentAttachments attachments={turn.message.attachments} />}
      </div>
      <div className="web-turn__answer">
        {groupParts(parts, live, factsOf(turn).duration).map((shown) => shown.kind === 'activity'
          ? <Activity key={shown.id} group={shown} send={send} turnId={turn.id} />
          : <Part key={shown.index} part={shown.part} send={send} live={live} turnId={turn.id} />)}
        {live ? open.map((request) => <InputRequest key={request.id} request={request} send={send} live response={undefined} />) : null}
        {live && parts.length === 0 ? <Spinner label={t('sessions/turn/working')} /> : null}
      </div>
      <FactLine facts={factsOf(turn)} {...(state === undefined ? {} : { state })} live={live} text={replyText(turn)} />
    </article>
  );
});

/** Asks the host for the page of turns before the oldest one shown. */
function OlderTurns({ host, chatUri, cursor }: { host: string; chatUri: string; cursor: string }): ReactElement {
  const { t } = useI18n();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const load = (): void => {
    setBusy(true);
    setError(null);
    hostBridge(host).request('fetchTurns', { channel: chatUri, cursor })
      .catch((caught: unknown) => setError(caught instanceof Error ? caught.message : String(caught)))
      .finally(() => setBusy(false));
  };
  return (
    <div className="web-chat__older">
      <Button label={busy ? t('sessions/chat/loading') : t('sessions/chat/older')} disabled={busy} onClick={load} />
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
export default function SessionPage({ host, resource }: { host: string; resource?: string }): ReactElement {
  const scena = useScena();
  const { t } = useI18n();
  const sessions = useStore<SessionSummary[]>(ahpPaths(host).sessions);
  const summary = sessions?.find((one) => one.resource === resource);
  const session = useChannel<SessionState>(host, resource, sessionReducer);
  // The chat the page shows: the one picked in the header while the session still has it, else the default.
  const [picked, setPicked] = useState<string | undefined>(undefined);
  const chosen = picked !== undefined && (session.state?.chats ?? []).some((one) => one.resource === picked) ? picked : undefined;
  const chatUri = chosen ?? session.state?.defaultChat ?? summary?.defaultChat;
  // The Raw view, and which steps it keeps; the page opens on the chat.
  const [raw, setRaw] = useState(false);
  const [rawFilter, setRawFilter] = useState<RawFilter>('all');
  const chat = useChannel<ChatState>(host, chatUri, chatReducer);
  const end = useRef<HTMLDivElement>(null);
  // Following the newest turn, until a person scrolls up to read an older one.
  const following = useRef(true);
  const send = useCallback<Send>((action) => {
    if (chatUri !== undefined) hostBridge(host).dispatch(chatUri, action);
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
    if (resource !== undefined && scena.store.get(ACTIVE_SESSION) === undefined) scena.store.set(ACTIVE_SESSION, { host, resource } satisfies ActiveSession);
  }, [scena, host, resource]);

  // Opening a session is reading it, as far as the unread dot is concerned.
  const unread = summary !== undefined && !isRead(summary.status);
  useEffect(() => {
    if (unread && resource !== undefined) hostBridge(host).dispatch(resource, { type: 'session/isReadChanged', isRead: true } as StateAction);
  }, [unread, resource, turns]);

  if (summary === undefined) return <PageAlert tone="warning" message={t('sessions/chat/gone')} />;
  // The header's buttons and the Raw view, the same on a session and on a chat with a bot.
  const tools = (
    <SessionHeaderTools
      host={host}
      summary={summary}
      session={session.state}
      chatUri={chatUri}
      onChat={setPicked}
      raw={raw}
      onRaw={setRaw}
    />
  );
  const rawView = raw && chat.state !== undefined ? (
    <SessionHostContext.Provider value={host}>
      <WorkspaceContext.Provider value={summary.workingDirectories?.[0] ?? null}>
        <RawView
          turns={rawOf(chat.state.turns, chat.state.activeTurn)}
          filter={rawFilter}
          onFilter={setRawFilter}
          spawned={spawnedBy(session.state?.chats ?? [], chatUri)}
          onOpenChat={setPicked}
        />
      </WorkspaceContext.Provider>
    </SessionHostContext.Provider>
  ) : null;
  // A session with a bot's mark is a chat with that bot, whatever its provider: only what is said shows.
  const mark = botMarkOf(summary._meta) ?? botMarkOf(session.state?._meta);
  if (mark !== undefined) return <BotChat host={host} mark={mark} summary={summary} session={session} chat={chat} chatUri={chatUri} send={send} tools={tools} rawView={rawView} />;
  const activity = activityOf(summary.status);
  const lifecycle = String(session.state?.lifecycle ?? 'ready');
  const doing = chat.state?.activity ?? summary.activity;

  return (
    <div className="web-chat">
      <header className="web-chat__head">
        <div className="web-chat__head-row">
          <div className="web-chat__title">
            <Text variant="h2" text={summary.title === '' ? t('sessions/untitled') : summary.title} />
            <Badge tone={ACTIVITY_TONE[activity]} text={activityLabel(activity)} />
          </div>
          {tools}
        </div>
        {doing === undefined || doing === '' ? null : <span className="web-note web-chat__doing">{doing}</span>}
      </header>

      <div
        className="web-chat__turns"
        onScroll={(event) => {
          const box = event.currentTarget;
          following.current = box.scrollHeight - box.scrollTop - box.clientHeight < 48;
        }}
      >
        {lifecycle === 'creating' ? <Spinner label={t('sessions/chat/starting')} /> : null}
        {lifecycle === 'failed' ? <Alert tone="danger" title={t('sessions/chat/notStarted')} message={session.state?.creationError?.message ?? t('sessions/chat/noReason')} /> : null}
        {session.error === null ? null : <Alert tone="danger" title={t('sessions/chat/sessionUnreadable')} message={session.error} />}
        {chat.error === null ? null : <Alert tone="danger" title={t('sessions/chat/chatUnreadable')} message={chat.error} />}
        {chatUri !== undefined && chat.state === undefined && chat.error === null ? <Spinner label={t('sessions/chat/reading')} /> : null}
        {chatUri === undefined || chat.state?.turnsNextCursor === undefined ? null : <OlderTurns host={host} chatUri={chatUri} cursor={chat.state.turnsNextCursor} />}
        <SessionHostContext.Provider value={host}>
          <WorkspaceContext.Provider value={summary.workingDirectories?.[0] ?? null}>
            {rawView ?? (
              <>
                {chat.state?.turns.map((turn) => <TurnView key={turn.id} turn={turn} live={false} send={send} />)}
                {chat.state?.activeTurn === undefined ? null : <TurnView turn={chat.state.activeTurn} live send={send} open={open} />}
              </>
            )}
          </WorkspaceContext.Provider>
        </SessionHostContext.Provider>
        {chat.state !== undefined && turns === 0 && chat.state.activeTurn === undefined ? <p className="web-note">{t('sessions/chat/empty')}</p> : null}
        <div ref={end} />
      </div>

      {chat.state === undefined || chatUri === undefined ? null : (
        <Composer
          host={host}
          chatUri={chatUri}
          activeId={chat.state.activeTurn?.id}
          activeStart={chat.state.activeTurn?.startedAt}
          queued={chat.state.queuedMessages}
          steering={chat.state.steeringMessage}
          draft={chat.state.draft}
          lastModel={chat.state.turns.at(-1)?.message.model?.id}
          lastUsage={chat.state.turns.at(-1)?.usage}
          config={session.state?.config}
          changesets={session.state?.changesets}
          summary={summary}
          send={send}
        />
      )}
    </div>
  );
}
