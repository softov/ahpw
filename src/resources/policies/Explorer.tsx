import { useMemo, type ReactElement } from 'react';
import { useI18n, useScena, useStore } from '@softov/scena/react';
import { Spinner } from '@softov/scena/ui';
import type { PickerAction } from '@softov/scena/types';
import { useChannelOnEach } from '../../bridges/channel.js';
import { ahpPaths } from '../../bridges/data.js';
import { refKey, refOf, useHostNames, useShownHosts } from '../../bridges/hosts.js';
import { NO_OFFERS, type Offers } from '../../bridges/offers.js';
import { POLICIES, policiesReducer, servesPolicies, writesPolicies, type PoliciesState } from '../../bridges/policies.js';
import { useServingHosts } from '../../bridges/served.js';
import { embedMode } from '../../shell/embed/index.js';
import { ExplorerList, type Row } from '../../shell/explorer/ExplorerList.js';
import { ACTIVE_POLICY } from './state.js';

/** A row's key: the host and the id, NUL between them. */
const rowKey = (host: string, id: string): string => refKey(host, id);

/** The sidebar: the policies of the shown hosts that list them, grouped by host when there are several. */
export default function PoliciesExplorer(): ReactElement {
  const scena = useScena();
  const { t } = useI18n();
  const shown = useShownHosts();
  const hosts = useServingHosts(shown, servesPolicies);
  const hostName = useHostNames();
  const multi = embedMode() === 'multi';
  const policies = useChannelOnEach<PoliciesState>(hosts, POLICIES.channel, policiesReducer);
  const active = useStore<{ host: string; id: string }>(ACTIVE_POLICY);

  const rows = useMemo<Row[]>(() => {
    const offersOf = (host: string): Offers => scena.store.get<Offers>(ahpPaths(host).offers) ?? NO_OFFERS;
    const groupOf = (host: string): { key: string; label: string } => (multi
      ? { key: `host:${host}`, label: hostName(host) }
      : { key: 'policies', label: t('policies/explorer/policies') });
    const word = (what: 'kind' | 'effect', value: string): string => {
      const key = `policies/${what}/${value}`;
      const words = t(key);
      return words === `{${key}}` ? value : words;
    };
    const errors = hosts.flatMap((host, at): Row[] => {
      const error = policies.errors[at];
      return error === null || error === undefined ? [] : [{
        key: `error|${host}`,
        dot: 'failed',
        dotLabel: t('policies/notices/none'),
        title: hostName(host),
        group: groupOf(host),
        lines: [error],
        menu: [],
      }];
    });
    const held = hosts.flatMap((host, at) => (policies.states[at]?.records ?? []).map((one) => ({ host, ...one })));
    const listed = held.map(({ host, id, record }): Row => {
      const open = (command: string): void => { void scena.commands.execute(command, { host, id }); };
      const item = (title: string, command: string, extra: Partial<PickerAction> = {}): PickerAction => ({ title, onSelect: (menu) => { menu.closeMenu(); open(command); }, ...extra });
      return {
        key: rowKey(host, id),
        dot: record.effect === 'deny' ? 'attention' : 'quiet',
        dotLabel: id,
        title: id,
        group: groupOf(host),
        lines: [[word('kind', record.kind), word('effect', record.effect), record.scope].join(' \u{00B7} ')],
        menu: [
          item(t('policies/actions/open'), 'ahp.openPolicy'),
          ...(writesPolicies(offersOf(host)) ? [item(t('policies/actions/delete'), 'ahp.deletePolicy', { group: 'more', color: 'red' })] : []),
        ],
      };
    });
    return [...errors, ...listed].sort((a, b) => (a.group?.key ?? '').localeCompare(b.group?.key ?? '') || a.title.localeCompare(b.title));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hosts, policies.states, policies.errors, hostName, multi, scena, t]);

  const read = policies.states.some((one) => one !== undefined);
  const refused = policies.errors.some((one) => one !== null);
  const notice = hosts.length === 0
    ? <p className="web-note web-explorer__empty">{t('policies/explorer/notServed')}</p>
    : !read && !refused
      ? <Spinner label={t('policies/notices/reading')} />
      : rows.length === 0 ? <p className="web-note web-explorer__empty">{t('policies/explorer/empty')}</p> : null;

  return (
    <ExplorerList
      label={t('policies/explorer/title')}
      rows={rows}
      selected={active === undefined ? null : rowKey(active.host, active.id)}
      onOpen={(key) => {
        if (key.startsWith('error|')) return;
        void scena.commands.execute('ahp.openPolicy', refOf(key));
      }}
      notice={notice}
      filterLabel={t('policies/explorer/filter')}
      hostLines={multi}
    />
  );
}
