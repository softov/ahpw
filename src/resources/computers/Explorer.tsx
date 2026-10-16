import { useMemo, type ReactElement } from 'react';
import { useI18n, useScena, useStore } from '@softov/scena/react';
import { Alert, Spinner } from '@softov/scena/ui';
import { ahpPaths } from '../../bridges/data.js';
import { useChannelOnEach } from '../../bridges/channel.js';
import { refKey, refOf, useEach, useHostNames, useShownHosts } from '../../bridges/hosts.js';
import { NO_OFFERS, type Offers } from '../../bridges/offers.js';
import { useServingHosts } from '../../bridges/served.js';
import { embedMode } from '../../shell/embed/index.js';
import { ExplorerList, type Dot, type Row } from '../../shell/explorer/ExplorerList.js';
import { arrange } from '../sessions/grouping.js';
import { EMOJIcon } from '../emojis.js';
import { act, may, menuOf } from './actions.js';
import { groupOf, keeps, type ComputerFilter, type ComputerGroup } from './arrange.js';
import { COMPUTERS, COMPUTERS_SCHEME, computersReducer, factsOf, standingOf, type ComputersState, type Standing } from './machines.js';
import { ACTIVE_COMPUTER, COMPUTERS_FILTER, COMPUTERS_GROUP } from './state.js';

const DOT: Record<Standing, Dot> = { running: 'ok', problem: 'failed', stopped: 'off' };

/** The sidebar: the computers of the shown hosts that serve them, by name, with their image and state. */
export default function ComputerExplorer(): ReactElement {
  const scena = useScena();
  const { t } = useI18n();
  const shown = useShownHosts();
  const hosts = useServingHosts(shown, COMPUTERS_SCHEME);
  const hostName = useHostNames();
  const multi = embedMode() === 'multi';
  const { states, errors } = useChannelOnEach<ComputersState>(hosts, COMPUTERS, computersReducer);
  const offers = useEach<Offers>(hosts.map((host) => ahpPaths(host).offers));
  const active = useStore<{ host: string; id: string }>(ACTIVE_COMPUTER);
  const grouping = useStore<ComputerGroup | null>(COMPUTERS_GROUP) ?? 'none';
  const filter = useStore<ComputerFilter | null>(COMPUTERS_FILTER) ?? 'all';
  const open = (key: string): void => {
    const { host, id } = refOf(key);
    void scena.commands.execute('ahp.openComputer', { host, id });
  };

  const rows = useMemo<Row[]>(() => {
    const listed = hosts.flatMap((host, at) => (states[at]?.records ?? []).map(({ id, record }) => {
      const facts = factsOf(record);
      return { host, id, facts, offers: offers[at] ?? NO_OFFERS, item: { host, hostName: hostName(host), standing: standingOf(facts) } };
    }))
      .filter((one) => keeps(one.item, filter))
      .sort((a, b) => a.id.localeCompare(b.id));
    return arrange(listed, (one) => groupOf(one.item, grouping)).map(({ host, id, facts, offers: held, item }) => {
      const inGroup = groupOf(item, grouping);
      const running = item.standing === 'running';
      return {
        key: refKey(host, id),
        dot: DOT[item.standing],
        dotLabel: t(`computers/standing/${item.standing}`),
        title: id,
        lines: [
          [multi && grouping !== 'host' ? hostName(host) : undefined, facts.image ?? facts.destination, t(`computers/standing/${item.standing}`)]
            .filter((bit) => bit !== undefined).join(' \u{00B7} '),
        ],
        menu: menuOf(host, held, id, item.standing, facts.controlled, () => open(refKey(host, id))),
        ...(facts.controlled && may(held, 'write')
          ? { action: { icon: running ? EMOJIcon.stop : EMOJIcon.run, label: t(running ? 'computers/actions/stop' : 'computers/actions/start'), run: () => void act(host, held, id, running ? 'stop' : 'start') } }
          : {}),
        ...(inGroup === undefined ? {} : { group: inGroup }),
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hosts, states, offers, hostName, grouping, filter, t]);

  // One host's notice in mono; in multi a host that is down says so in its own place.
  const error = multi ? null : errors[0] ?? null;
  const state = multi ? states.find((one) => one !== undefined) : states[0];
  const notice = hosts.length === 0
    ? <p className="web-note web-explorer__empty">{t('computers/explorer/notServed')}</p>
    : error !== null
      ? <Alert tone="danger" title={t('computers/notices/none')} message={error} />
      : state === undefined
        ? <Spinner label={t('computers/notices/reading')} />
        : rows.length === 0 ? <p className="web-note web-explorer__empty">{t('computers/explorer/empty')}</p> : null;

  return (
    <ExplorerList
      label={t('computers/explorer/title')}
      rows={rows}
      selected={active === undefined ? null : refKey(active.host, active.id)}
      onOpen={open}
      notice={notice}
      filterLabel={t('computers/explorer/filter')}
      hostLines={multi}
    />
  );
}
