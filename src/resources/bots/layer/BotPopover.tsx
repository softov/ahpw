import { useState, type ReactElement } from 'react';
import { useI18n, useScena } from '@softov/scena/react';
import { Button, Popup } from '@softov/scena/ui';
import { chatReducer, sessionReducer, type ChatState, type SessionState, type StateAction } from '@microsoft/agent-host-protocol';
import { hostBridge } from '../../../bridges/data.js';
import { useChannel } from '../../../bridges/channel.js';
import { newId } from '../../../bridges/words.js';
import { messageOf } from '../../sessions/Composer.js';
import type { BotRecord } from '../catalogue.js';

/**
 * A floating bot, opened: what it is for, a line to say something in its chat,
 * and the way to its chat or its form. A message waits in the queue while the
 * bot is still answering.
 */
export function BotPopover({ host, bot, x, y, onClose }: { host: string; bot: BotRecord; x: number; y: number; onClose: () => void }): ReactElement {
  const scena = useScena();
  const { t } = useI18n();
  const session = useChannel<SessionState>(host, bot.session, sessionReducer);
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
    setText('');
  };

  return (
    <Popup x={x} y={y} onClose={onClose} className="web-bot-popover">
      <div className="web-bot-popover__head">
        <strong>{bot.name}</strong>
        {bot.labels.length === 0 ? null : <span className="web-bot-popover__labels">{bot.labels.join(', ')}</span>}
      </div>
      {bot.description === undefined ? null : <p className="web-bot-popover__description">{bot.description}</p>}
      {bot.session === undefined ? <p className="web-note">{t('bots/layer/noSession')}</p> : (
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
      <div className="web-bot-popover__actions">
        {bot.session === undefined ? null : <Button label={t('bots/actions/chat')} size="sm" onClick={() => run('ahp.chatWithBot')} />}
        <Button label={t('bots/actions/edit')} size="sm" onClick={() => run('ahp.editBot')} />
      </div>
    </Popup>
  );
}
