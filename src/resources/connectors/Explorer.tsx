import { useMemo, type ReactElement } from 'react';
import { useI18n, useScena, useStore } from '@softov/scena/react';
import { Alert, Spinner } from '@softov/scena/ui';
import type { PickerAction } from '@softov/scena/types';
import { ahpPaths } from '../../bridges/data.js';
import { useChannelOnEach } from '../../bridges/channel.js';
import { ADAPTERS, adaptersReducer, CONNECTORS, connectorsReducer, type AdapterRow, type ConnectorRow } from '../../bridges/connectors.js';
import { refKey, refOf, useEach, useHostNames, useShownHosts } from '../../bridges/hosts.js';
import { NO_OFFERS, type Offers } from '../../bridges/offers.js';
import type { PeopleState } from '../../bridges/people.js';
import { useServingHosts } from '../../bridges/served.js';
import { embedMode } from '../../shell/embed/index.js';
import { ExplorerList } from '../../shell/explorer/ExplorerList.js';
import { deleteConnector, meOn, ownerWord } from './actions.js';
import { connectorRows, type ConnectorEntry, type ConnectorGrouping } from './rows.js';
import { ACTIVE_CONNECTOR, connectorTab, CONNECTORS_GROUP } from './state.js';

/** The sidebar: the connectors each shown host lists to this reader, by adapter, owner or state. */
export default function ConnectorsExplorer(): ReactElement {
  const scena = useScena();
  const { t } = useI18n();
  const shown = useShownHosts();
  const hosts = useServingHosts(shown, CONNECTORS.scheme);
  const hostName = useHostNames();
  const multi = embedMode() === 'multi';
  const { states, errors } = useChannelOnEach<PeopleState<ConnectorRow>>(hosts, CONNECTORS.channel, connectorsReducer);
  // The adapters title the groups; a host that refuses them leaves each named by its adapter's name.
  const adapterStates = useChannelOnEach<PeopleState<AdapterRow>>(hosts, ADAPTERS.channel, adaptersReducer).states;
  const offers = useEach<Offers>(hosts.map((host) => ahpPaths(host).offers));
  const active = useStore<{ host: string; id: string }>(ACTIVE_CONNECTOR);
  const grouping = useStore<ConnectorGrouping | null>(CONNECTORS_GROUP) ?? 'adapter';
  const open = (key: string): void => {
    const { host, id } = refOf(key);
    void scena.commands.execute('ahp.openConnector', { host, id });
  };

  const rows = useMemo(() => {
    const entries: ConnectorEntry[] = hosts.flatMap((host, at) => {
      const adapters = (adapterStates[at]?.records ?? []).map((one) => one.record);
      const connectors = (states[at]?.records ?? []).map((one) => one.record);
      const me = meOn(offers[at] ?? NO_OFFERS);
      return connectors.map((row) => ({ host, hostName: hostName(host), row, adapters, ...(me === undefined ? {} : { me }) }));
    });
    const menu = ({ host, row }: ConnectorEntry): PickerAction[] => [
      { title: t('connectors/actions/open'), onSelect: (picker) => { picker.closeMenu(); open(refKey(host, row.id)); } },
      {
        title: t('connectors/actions/delete'),
        group: 'more',
        onSelect: (picker) => {
          picker.closeMenu();
          void deleteConnector(host, row).then((gone) => { if (gone) scena.surfaces.close(connectorTab(host, row.id)); });
        },
      },
    ];
    return connectorRows(entries, grouping, {
      multi,
      state: (state) => t(`connectors/states/${state}`),
      owner: (owner, me) => ownerWord(t, owner, me),
      noAdapter: t('connectors/explorer/noAdapter'),
      menu,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hosts, states, adapterStates, offers, hostName, grouping, t]);

  // One host's notice in mono; in multi a host that is down says so in its own place.
  const error = multi ? null : errors[0] ?? null;
  const state = multi ? states.find((one) => one !== undefined) : states[0];
  const notice = hosts.length === 0
    ? <p className="web-note web-explorer__empty">{t('connectors/explorer/notServed')}</p>
    : error !== null
      ? <Alert tone="danger" title={t('connectors/notices/none')} message={error} />
      : state === undefined
        ? <Spinner label={t('connectors/notices/reading')} />
        : rows.length === 0 ? <p className="web-note web-explorer__empty">{t('connectors/explorer/empty')}</p> : null;
  const selected = active === undefined ? null : refKey(active.host, active.id);

  return (
    <ExplorerList
      label={t('connectors/explorer/title')}
      rows={rows}
      selected={selected}
      onOpen={open}
      notice={notice}
      filterLabel={t('connectors/explorer/filter')}
      hostLines={multi}
    />
  );
}
