import { useMemo, type ReactElement } from 'react';
import { useI18n, useScena, useStore } from '@softov/scena/react';
import { Alert, Spinner } from '@softov/scena/ui';
import type { PickerAction } from '@softov/scena/types';
import { ahpPaths } from '../../bridges/data.js';
import { useChannelOnEach } from '../../bridges/channel.js';
import { refKey, refOf, useEach, useHostNames, useShownHosts } from '../../bridges/hosts.js';
import type { Offers } from '../../bridges/offers.js';
import {
  comparePolicies, POLICIES, POLICIES_CHANNEL, policiesReducer, policyActive, policyGroup, writesPolicies,
  type PoliciesState, type Policy, type PolicyGrouping,
} from '../../bridges/policies.js';
import { useServingHosts } from '../../bridges/served.js';
import { embedMode } from '../../shell/embed/index.js';
import { ExplorerList, type Dot, type Row } from '../../shell/explorer/ExplorerList.js';
import { ACTIVE_POLICY, POLICIES_GROUP } from './state.js';
import { kindWord, limitsLine, matchLine, scopeWord } from './words.js';

/** An allow is green and a deny red; a row out of its window is hollow, since no check reads it now. */
function dotOf(row: Policy, now: Date): Dot {
  if (!policyActive(row, now)) return 'off';
  return row.effect === 'deny' ? 'failed' : 'ok';
}

/** The sidebar: the policies of the shown hosts that list them, under their kind, their scope, or in one list. */
export default function PoliciesExplorer(): ReactElement {
  const scena = useScena();
  const { t } = useI18n();
  const shown = useShownHosts();
  const hosts = useServingHosts(shown, POLICIES_CHANNEL);
  const offers = useEach<Offers>(hosts.map((host) => ahpPaths(host).offers));
  const hostName = useHostNames();
  const multi = embedMode() === 'multi';
  const by = useStore<PolicyGrouping | null>(POLICIES_GROUP) ?? 'kind';
  const policies = useChannelOnEach<PoliciesState>(hosts, POLICIES.channel, policiesReducer);
  const active = useStore<{ host: string; id: string }>(ACTIVE_POLICY);

  const rows = useMemo<Row[]>(() => {
    const now = new Date();
    const sorted = hosts
      .flatMap((host, at) => (policies.states[at]?.records ?? []).map(({ record }) => ({ host, row: record, writes: offers[at] !== undefined && writesPolicies(offers[at]) })))
      .sort((a, b) => comparePolicies(by)(a.row, b.row) || a.host.localeCompare(b.host));
    return sorted.map(({ host, row, writes }): Row => {
      const run = (command: string): void => { void scena.commands.execute(command, { host, id: row.id }); };
      const item = (title: string, command: string, extra: Partial<PickerAction> = {}): PickerAction => ({ title, onSelect: (menu) => { menu.closeMenu(); run(command); }, ...extra });
      const group = policyGroup(row, by);
      // What the group heading does not say already: the scope under a kind, the kind under a scope, both in one list.
      const about = by === 'kind' ? [scopeWord(row.scope)] : by === 'scope' ? [kindWord(row.kind)] : [kindWord(row.kind), scopeWord(row.scope)];
      return {
        key: refKey(host, row.id),
        dot: dotOf(row, now),
        dotLabel: t(`policies/effect/${row.effect}`),
        title: row.id,
        ...(group === undefined ? {} : { group: { key: group, label: by === 'kind' ? kindWord(group) : scopeWord(group) } }),
        lines: [
          [multi ? hostName(host) : undefined, t(`policies/effect/${row.effect}`), ...about, matchLine(row)].filter((bit) => bit !== undefined).join(' \u{00B7} '),
          limitsLine(row),
        ],
        menu: [
          item(t('policies/actions/open'), 'ahp.openPolicy'),
          ...(writes ? [item(t('policies/actions/delete'), 'ahp.deletePolicy', { group: 'more', color: 'red' })] : []),
        ],
      };
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hosts, offers, policies.states, by, multi, hostName, t]);

  const error = multi ? null : policies.errors[0] ?? null;
  const read = multi ? policies.states.some((one) => one !== undefined) : policies.states[0] !== undefined;
  const notice = hosts.length === 0
    ? <p className="web-note web-explorer__empty">{t('policies/explorer/notServed')}</p>
    : error !== null
      ? <Alert tone="danger" title={t('policies/notices/none')} message={error} />
      : !read
        ? <Spinner label={t('policies/notices/reading')} />
        : rows.length === 0 ? <p className="web-note web-explorer__empty">{t('policies/explorer/empty')}</p> : null;

  return (
    <ExplorerList
      label={t('policies/explorer/title')}
      rows={rows}
      selected={active === undefined ? null : refKey(active.host, active.id)}
      onOpen={(key) => { void scena.commands.execute('ahp.openPolicy', refOf(key)); }}
      notice={notice}
      filterLabel={t('policies/explorer/filter')}
      hostLines={multi}
    />
  );
}
