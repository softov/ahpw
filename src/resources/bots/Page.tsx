import type { ReactElement } from 'react';
import { useI18n, useScena, useStore } from '@softov/scena/react';
import { Button, DetailList, Spinner, Text, type DetailItem } from '@softov/scena/ui';
import { useChannel } from '../../bridges/channel.js';
import { embedMode } from '../../shell/embed/index.js';
import { HostTag } from '../../shell/explorer/HostLines.js';
import { PageAlert } from '../../shell/view/PageAlert.js';
import { timeOf } from '../automations/words.js';
import { Bood } from './Bood.js';
import { BOTS, botsReducer, type BotsState } from './catalogue.js';
import { refKey } from '../../bridges/hosts.js';
import { BOT_CHAT_OPENING } from './state.js';

/** One bot: its figure, what it is for, whose it is, and its chat. */
export default function BotPage({ host, slug }: { host: string; slug?: string }): ReactElement {
  const scena = useScena();
  const { t } = useI18n();
  const { state, error } = useChannel<BotsState>(host, BOTS, botsReducer);
  const opening = useStore<string | null>(BOT_CHAT_OPENING) === refKey(host, slug ?? '');
  if (error !== null) return <PageAlert tone="danger" title={t('bots/notices/none')} message={error} />;
  if (state === undefined) return <Spinner label={t('bots/notices/reading')} />;
  const bot = state.bots.find((one) => one.id === slug);
  if (bot === undefined) return <PageAlert tone="warning" message={t('bots/notices/gone')} />;

  const facts: DetailItem[] = [
    ...(embedMode() === 'multi' ? [{ label: t('common/host'), value: <HostTag host={host} /> }] : []),
    ...(bot.labels.length === 0 ? [] : [{ label: t('bots/facts/labels'), value: bot.labels.join(', ') }]),
    { label: t('bots/facts/owner'), value: bot.owner },
    ...(bot.harness === undefined ? [] : [{ label: t('bots/facts/agent'), value: bot.harness }]),
    ...(bot.model === undefined ? [] : [{ label: t('bots/facts/model'), value: bot.model }]),
    ...(bot.computer === undefined ? [] : [{ label: t('bots/facts/computer'), value: bot.computer }]),
    { label: t('bots/facts/workspace'), value: <span className="web-method">{bot.workspace}</span> },
    { label: t('bots/facts/created'), value: timeOf(bot.createdAt) },
    { label: t('bots/facts/changed'), value: timeOf(bot.updatedAt) },
  ];
  const run = (command: string): void => void scena.commands.execute(command, { host, slug: bot.id });

  return (
    <div className="web-page">
      <div className="web-bot">
        <Bood body={bot.body} color={bot.color} width={120} />
        <div className="web-bot__words">
          <Text variant="h2" text={bot.name} />
          {(bot.description ?? '').trim() === '' ? null : <p className="web-bot__description">{bot.description}</p>}
          <div className="web-page__actions">
            <Button label={t(opening ? 'bots/chat/opening' : 'bots/actions/chat')} variant="primary" disabled={opening} onClick={() => run('ahp.chatWithBot')} />
            <Button label={t('bots/actions/edit')} onClick={() => run('ahp.editBot')} />
            <Button label={t('bots/actions/delete')} onClick={() => run('ahp.deleteBot')} />
          </div>
        </div>
      </div>
      <DetailList items={facts} columns={2} />
      {(bot.instructions ?? '').trim() === '' ? null : (
        <>
          <Text variant="h3" text={t('bots/facts/instructions')} />
          <p className="web-bot__instructions">{bot.instructions}</p>
        </>
      )}
    </div>
  );
}
