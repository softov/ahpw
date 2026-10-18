import { useEffect, useRef, useState, type ReactElement, type ReactNode } from 'react';
import { useI18n } from '@softov/scena/react';
import { Alert, Markdown, Spinner } from '@softov/scena/ui';
import type { ChatState, SessionState, SessionSummary } from '@microsoft/agent-host-protocol';
import { hostBridge } from '../../../bridges/data.js';
import { saveFile } from '../../../lib/save-file.js';
import { EMOJIcon } from '../../emojis.js';
import { Composer } from '../../sessions/Composer.js';
import { Part, type Send } from '../../sessions/Parts.js';
import { activityOf } from '../../sessions/status.js';
import { Bood } from '../Bood.js';
import { colorOf } from '../look.js';
import { chatItems, type BotMark, type ChatFile, type ChatItem } from './mark.js';

/** A file in a bot's reply: a row that saves it on this computer. */
function FileRow({ host, file }: { host: string; file: ChatFile }): ReactElement {
  const { t } = useI18n();
  const [failure, setFailure] = useState<string | null>(null);
  const download = (): void => {
    setFailure(null);
    void hostBridge(host).readBlob(file.uri, file.contentType ?? 'application/octet-stream').then(
      (blob) => saveFile(file.name, blob),
      (error: unknown) => setFailure(error instanceof Error ? error.message : String(error)),
    );
  };
  return (
    <>
      <button type="button" className="web-botchat__file" title={t('bots/chat/download', { name: file.name })} onClick={download}>
        <span aria-hidden="true">{EMOJIcon.download}</span>
        <span className="web-botchat__file-name">{file.name}</span>
      </button>
      {failure === null ? null : <p className="web-botchat__failure">{failure}</p>}
    </>
  );
}

/** One thing a turn shows: the person's bubble, the bot's bubble, or a grey line. */
function Item({ host, mark, item, send, live, turnId }: { host: string; mark: BotMark; item: ChatItem; send: Send; live: boolean; turnId: string }): ReactElement {
  const { t } = useI18n();
  switch (item.kind) {
    case 'said':
      return <div className="web-botchat__said">{item.text}</div>;
    case 'reply':
      return (
        <div className="web-botchat__reply">
          <Bood body={mark.body} color={mark.color} width={28} still />
          <div className="web-botchat__bubble">
            <span className="web-botchat__name" style={{ color: colorOf(mark.color) }}>{mark.name}</span>
            {item.texts.map((text, at) => <div key={at} className="web-md"><Markdown text={text} /></div>)}
            {item.files.map((file) => <FileRow key={file.uri} host={host} file={file} />)}
            {item.asks.map((part, at) => <Part key={at} part={part} send={send} live={live} turnId={turnId} />)}
          </div>
        </div>
      );
    case 'notice':
      return <p className="web-botchat__notice" data-tone={item.tone}>{item.text}</p>;
    case 'noReply':
      return <p className="web-botchat__notice" data-tone="quiet">{t('bots/chat/noReply', { name: mark.name })}</p>;
  }
}

/**
 * A chat with a bot: the person's messages on the right, the bot's replies on
 * the left with its name and figure, notices as grey lines, and one line over
 * the composer while the bot works. A question or an approval the bot waits on
 * is drawn in its bubble; its other tools and thinking are its own work, which
 * the chat does not show. The header has the session's buttons, and its Raw
 * view shows every step in place of the bubbles.
 */
export function BotChat({ host, mark, summary, session, chat, chatUri, send, tools, rawView }: {
  host: string;
  mark: BotMark;
  summary: SessionSummary;
  session: { state: SessionState | undefined; error: string | null };
  chat: { state: ChatState | undefined; error: string | null };
  chatUri: string | undefined;
  send: Send;
  /** The session header's buttons. */
  tools: ReactNode;
  /** The Raw view while it is on, drawn in place of the bubbles. */
  rawView: ReactNode;
}): ReactElement {
  const { t } = useI18n();
  const end = useRef<HTMLDivElement>(null);
  // Following the newest message, until a person scrolls up to read an older one.
  const following = useRef(true);
  const turns = chat.state?.turns ?? [];
  const active = chat.state?.activeTurn;
  const shown = (active?.responseParts.length ?? 0) + turns.length;
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (following.current) end.current?.scrollIntoView({ block: 'end' });
  }, [shown]);
  // A tab drawn while hidden cannot scroll; when it shows, and whenever its box changes size, it goes to the newest message.
  useEffect(() => {
    const held = box.current;
    if (held === null) return;
    const watch = new ResizeObserver(() => {
      if (following.current) end.current?.scrollIntoView({ block: 'end' });
    });
    watch.observe(held);
    return () => watch.disconnect();
  }, []);

  const activity = activityOf(summary.status);
  const working = activity === 'running' || activity === 'input';
  const doing = chat.state?.activity ?? summary.activity;

  return (
    <div className="web-chat web-botchat">
      <header className="web-botchat__head">
        <Bood body={mark.body} color={mark.color} width={36} />
        <h2 className="web-botchat__title">{mark.name}</h2>
        {tools}
      </header>

      <div
        ref={box}
        className="web-botchat__turns"
        onScroll={(event) => {
          const box = event.currentTarget;
          following.current = box.scrollHeight - box.scrollTop - box.clientHeight < 48;
        }}
      >
        {session.error === null ? null : <Alert tone="danger" message={session.error} />}
        {chat.error === null ? null : <Alert tone="danger" message={chat.error} />}
        {chatUri !== undefined && chat.state === undefined && chat.error === null ? <Spinner label={t('bots/chat/reading')} /> : null}
        {rawView ?? (
          <>
            {turns.map((turn) => chatItems(turn, false).map((item, at) => <Item key={`${turn.id}:${at}`} host={host} mark={mark} item={item} send={send} live={false} turnId={turn.id} />))}
            {active === undefined ? null : chatItems(active, true).map((item, at) => <Item key={`${active.id}:${at}`} host={host} mark={mark} item={item} send={send} live turnId={active.id} />)}
          </>
        )}
        {chat.state !== undefined && turns.length === 0 && active === undefined ? <p className="web-botchat__notice" data-tone="quiet">{t('bots/chat/empty', { name: mark.name })}</p> : null}
        <div ref={end} />
      </div>

      {working ? (
        <p className="web-botchat__status">
          <span className="web-botchat__pulse" aria-hidden="true" />
          {t('bots/chat/working', { name: mark.name })}
          {doing === undefined || doing === null || doing === '' ? null : <span className="web-note">{` \u{00B7} ${doing}`}</span>}
        </p>
      ) : null}

      {chat.state === undefined || chatUri === undefined ? null : (
        <Composer
          host={host}
          chatUri={chatUri}
          activeId={active?.id}
          activeStart={active?.startedAt}
          queued={chat.state.queuedMessages}
          steering={chat.state.steeringMessage}
          draft={chat.state.draft}
          lastModel={turns.at(-1)?.message.model?.id}
          lastUsage={turns.at(-1)?.usage}
          config={session.state?.config}
          changesets={session.state?.changesets}
          summary={summary}
          send={send}
          placeholder={t('bots/chat/message', { name: mark.name })}
          steers
        />
      )}
    </div>
  );
}
