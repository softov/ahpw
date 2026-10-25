import { useEffect, useState, type ReactElement } from 'react';
import { useI18n, useScena, useStore } from '@softov/scena/react';
import { Button, Popup, Spinner } from '@softov/scena/ui';
import { chatReducer, sessionReducer, type AgentInfo, type ChatState, type SessionState, type StateAction } from '@microsoft/agent-host-protocol';
import { ahpPaths, hostBridge } from '../../../bridges/data.js';
import { NO_OFFERS, type Offers } from '../../../bridges/offers.js';
import { useChannel } from '../../../bridges/channel.js';
import { newId } from '../../../bridges/words.js';
import { messageOf } from '../../sessions/Composer.js';
import { EMOJIcon } from '../../emojis.js';
import { readBotChat, servesBotChats, type BotRecord } from '../catalogue.js';

/**
 * A floating bot, opened: its name, which opens the bot, what it is for, a
 * line to say something in its chat, and an icon to its chat. Sending opens
 * the chat; a message waits in the queue while the bot is still answering.
 */
export function BotPopover({ host, bot, x, y, onClose }: { host: string; bot: BotRecord; x: number; y: number; onClose: () => void }): ReactElement {
  const scena = useScena();
  const { t } = useI18n();
  const offers = useStore<Offers>(ahpPaths(host).offers) ?? NO_OFFERS;
  const chats = servesBotChats(useStore<AgentInfo[]>(ahpPaths(host).agents));
  // The person's own chat with the bot, which the first read starts: undefined while reading, null when they may not chat.
  const [chatSession, setChatSession] = useState<string | null | undefined>(undefined);
  const [failure, setFailure] = useState<string | null>(null);
  useEffect(() => {
    let live = true;
    void readBotChat(host, offers, bot, chats).then(
      (uri) => { if (live) setChatSession(uri); },
      (error: unknown) => { if (live) setFailure(error instanceof Error ? error.message : String(error)); },
    );
    return () => { live = false; };
  }, [host, offers, bot, chats]);
  const session = useChannel<SessionState>(host, chatSession ?? undefined, sessionReducer);
  const chatUri = session.state?.defaultChat;
  const chat = useChannel<ChatState>(host, chatUri, chatReducer);
  const [text, setText] = useState('');
  const run = (command: string): void => {
    onClose();
    void scena.commands.execute(command, { host, slug: bot.id });
  };
  const send = (): void => {
    const said = text.trim();
    if (said === '' || chatUri === undefined) return;
    const message = messageOf(said, undefined, []);
    hostBridge(host).dispatch(chatUri, (chat.state?.activeTurn === undefined
      ? { type: 'chat/turnStarted', turnId: newId(), startedAt: new Date().toISOString(), message }
      : { type: 'chat/pendingMessageSet', kind: 'queued', id: newId(), message }) as StateAction);
    run('ahp.chatWithBot');
  };

  return (
    <Popup x={x} y={y} onClose={onClose} className="web-bot-popover">
      <div className="web-bot-popover__head">
        <button type="button" className="web-bot-popover__name" title={t('bots/commands/open')} onClick={() => run('ahp.openBot')}>{bot.name}</button>
        {bot.labels.length === 0 ? null : <span className="web-bot-popover__labels">{bot.labels.join(', ')}</span>}
        {chatSession === null || chatSession === undefined ? null : (
          <button type="button" className="web-bot-popover__chat" title={t('bots/actions/chat')} aria-label={t('bots/actions/chat')} onClick={() => run('ahp.chatWithBot')}>
            {EMOJIcon.sessions}
          </button>
        )}
      </div>
      {bot.description === undefined ? null : <p className="web-bot-popover__description">{bot.description}</p>}
      {failure !== null ? <p className="web-bot-popover__failure">{failure}</p>
        : chatSession === undefined ? <Spinner label={t('bots/chat/opening')} />
          : chatSession === null ? <p className="web-note">{t(chats ? 'bots/chat/cannot' : 'bots/chat/noHost')}</p> : (
        <form className="web-bot-popover__say" onSubmit={(event) => { event.preventDefault(); send(); }}>
          <input
            className="web-field"
            value={text}
            autoFocus
            placeholder={t('bots/layer/say', { name: bot.name })}
            aria-label={t('bots/layer/say', { name: bot.name })}
            onChange={(event) => setText(event.target.value)}
          />
          <Button label={t('bots/layer/send')} variant="primary" disabled={text.trim() === '' || chatUri === undefined} onClick={send} />
        </form>
      )}
    </Popup>
  );
}
