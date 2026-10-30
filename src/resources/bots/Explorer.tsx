import { useMemo, type ReactElement } from 'react';
import { useI18n, useScena, useStore } from '@softov/scena/react';
import { Alert, Spinner } from '@softov/scena/ui';
import type { PickerAction } from '@softov/scena/types';
import { useChannelOnEach } from '../../bridges/channel.js';
import { refKey, refOf, useHostNames, useShownHosts } from '../../bridges/hosts.js';
import { useServingHosts } from '../../bridges/served.js';
import { embedMode } from '../../shell/embed/index.js';
import { ExplorerList, type Row } from '../../shell/explorer/ExplorerList.js';
import { Bood } from './Bood.js';
import { BOTS, BOTS_SCHEME, botsReducer, type BotsState } from './catalogue.js';
import { ACTIVE_BOT } from './state.js';

/** The sidebar: the bots of the shown hosts that serve them, each drawn, with its labels and host. */
export default function BotExplorer(): ReactElement {
  const scena = useScena();
  const { t } = useI18n();
  const hosts = useServingHosts(useShownHosts(), BOTS_SCHEME);
  const hostName = useHostNames();
  const multi = embedMode() === 'multi';
  const { states, errors } = useChannelOnEach<BotsState>(hosts, BOTS, botsReducer);
  const active = useStore<{ host: string; slug: string }>(ACTIVE_BOT);
  const run = (command: string, key: string, extra: Record<string, string> = {}): void => {
    const { host, id } = refOf(key);
    void scena.commands.execute(command, { host, slug: id, ...extra });
  };

  const rows = useMemo<Row[]>(() => hosts
    .flatMap((host, at) => (states[at]?.bots ?? []).map((bot) => ({ host, bot })))
    .sort((a, b) => a.bot.name.localeCompare(b.bot.name))
    .map(({ host, bot }) => {
      const key = refKey(host, bot.id);
      const item = (title: string, command: string, extra: Partial<PickerAction> = {}, args: Record<string, string> = {}): PickerAction => ({ title, onSelect: (menu) => { menu.closeMenu(); run(command, key, args); }, ...extra });
      return {
        key,
        dot: 'quiet',
        dotLabel: bot.name,
        icon: <Bood body={bot.body} color={bot.color} width={44} still />,
        title: bot.name,
        lines: [
          [multi ? hostName(host) : undefined, bot.labels.length === 0 ? undefined : bot.labels.join(', ')].filter((bit) => bit !== undefined).join(' \u{00B7} '),
          ...(bot.description === undefined ? [] : [bot.description]),
        ].filter((line) => line !== ''),
        menu: [
          item(t('bots/actions/open'), 'ahp.openBot'),
          item(t('bots/actions/openMain'), 'ahp.chatWithBot', {}, { place: 'main' }),
          item(t('bots/actions/openRight'), 'ahp.chatWithBot', {}, { place: 'right' }),
          item(t('bots/actions/edit'), 'ahp.editBot'),
          item(t('bots/actions/delete'), 'ahp.deleteBot', { group: 'more', color: 'red' }),
        ],
      };
    }),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  [hosts, states, hostName, t]);

  const error = multi ? null : errors[0] ?? null;
  const state = multi ? states.find((one) => one !== undefined) : states[0];
  const notice = hosts.length === 0
    ? <p className="web-note web-explorer__empty">{t('bots/explorer/notServed')}</p>
    : error !== null
      ? <Alert tone="danger" title={t('bots/notices/none')} message={error} />
      : state === undefined
        ? <Spinner label={t('bots/notices/reading')} />
        : rows.length === 0 ? <p className="web-note web-explorer__empty">{t('bots/explorer/empty')}</p> : null;

  return (
    <ExplorerList
      label={t('bots/explorer/title')}
      rows={rows}
      selected={active === undefined ? null : refKey(active.host, active.slug)}
      onOpen={(key) => run('ahp.openBot', key)}
      notice={notice}
      filterLabel={t('bots/explorer/filter')}
      hostLines={multi}
    />
  );
}
