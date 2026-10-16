import { useMemo, type ReactElement } from 'react';
import { translate } from '@softov/scena';
import { useI18n, useScena, useStore } from '@softov/scena/react';
import { Alert, Spinner } from '@softov/scena/ui';
import { automationReducer, type AutomationState as Catalogue } from '@microsoft/agent-host-protocol';
import { AUTOMATIONS } from '../../bridges/data.js';
import { useChannelOnEach } from '../../bridges/channel.js';
import { refKey, refOf, useHostNames, useShownHosts } from '../../bridges/hosts.js';
import { embedMode } from '../../shell/embed/index.js';
import { ExplorerList, type Dot, type Row } from '../../shell/explorer/ExplorerList.js';
import { menuOf, runNow } from './actions.js';
import { ACTIVE_AUTOMATION, AUTOMATIONS_FILTER, AUTOMATIONS_GROUP, AUTOMATIONS_SORT } from './state.js';
import { groupOf, keeps, sortAutomations, type AutoFilter, type AutoGroup, type AutoItem, type AutoSort } from './arrange.js';
import { arrange } from '../sessions/grouping.js';
import { runFacts, runsByTime, stateOf, titleOf, whenLine, type AutomationState } from './words.js';
import { failed } from '../../shell/notify/index.js';
import { EMOJIcon } from '../emojis.js';
import { plural, dateFormat } from '../../i18n/locales.js';

const DOT: Record<AutomationState, Dot> = { running: 'working', failed: 'failed', on: 'ok', off: 'off' };
/** The run states the last run's line has its own words for; any other is named as the host sends it. */
const RUN_STATES = new Set(['pending', 'running', 'completed', 'failed', 'cancelled']);

const short = dateFormat({ month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
const at = (iso: string | undefined): string => {
  if (iso === undefined) return '';
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? '' : short.format(date);
};

const say = (error: unknown): void => failed(translate('automations/actions/couldNotRun'), error);

/** The sidebar: the shown hosts' automations, by title, with when they run and how the last run went. */
export default function AutomationExplorer(): ReactElement {
  const scena = useScena();
  const { t } = useI18n();
  const hosts = useShownHosts();
  const hostName = useHostNames();
  const multi = embedMode() === 'multi';
  const { states, errors } = useChannelOnEach<Catalogue>(hosts, AUTOMATIONS, automationReducer);
  const active = useStore<{ host: string; resource: string }>(ACTIVE_AUTOMATION);
  const open = (key: string): void => {
    const { host, id } = refOf(key);
    void scena.commands.execute('ahp.openAutomation', { host, resource: id });
  };
  const edit = (host: string, resource: string): void => void scena.commands.execute('ahp.editAutomation', { host, resource });
  const grouping = useStore<AutoGroup | null>(AUTOMATIONS_GROUP) ?? 'none';
  const sorting = useStore<AutoSort | null>(AUTOMATIONS_SORT) ?? 'name';
  const filter = useStore<AutoFilter | null>(AUTOMATIONS_FILTER) ?? 'all';

  const rows = useMemo<Row[]>(
    () => {
      const today = new Date();
      const listed = hosts.flatMap((host, at) => (states[at]?.entries ?? []).map((entry) => {
        const last = runsByTime(entry)[0];
        const item: AutoItem = {
          host,
          hostName: hostName(host),
          title: titleOf(entry),
          state: stateOf(entry),
          ...(entry.nextRunAt === undefined || !entry.definition.enabled ? {} : { nextRunAt: entry.nextRunAt }),
          ...(last === undefined ? {} : { lastRunAt: runFacts(last).at }),
        };
        return { host, entry, item };
      })).filter((one) => keeps(one.item, filter));
      const sorted = sortAutomations(listed, (one) => one.item, sorting);
      return arrange(sorted, (one) => groupOf(one.item, grouping, today)).map(({ host, entry, item }) => {
        const inGroup = groupOf(item, grouping, today);
        const now = stateOf(entry);
        const last = runsByTime(entry)[0];
        const facts = last === undefined ? undefined : runFacts(last);
        const agent = entry.definition.session.provider;
        const runs = entry.runCount ?? entry.runs.length;
        return {
          key: refKey(host, entry.resource),
          dot: DOT[now],
          dotLabel: t(`automations/state/${now}`),
          title: titleOf(entry),
          ...(entry.nextRunAt === undefined || !entry.definition.enabled ? {} : { time: at(entry.nextRunAt) }),
          lines: [
            [multi && grouping !== 'host' ? hostName(host) : undefined, whenLine(entry), agent].filter((bit) => bit !== undefined).join(' \u{00B7} '),
            facts === undefined
              ? t('automations/explorer/neverRun')
              : `${plural('automations/explorer/runs', runs)} \u{00B7} ${RUN_STATES.has(facts.status) ? t(`automations/explorer/last/${facts.status}`, { at: at(facts.at) }) : t('automations/explorer/last/other', { status: facts.status, at: at(facts.at) })}`,
          ],
          menu: menuOf(host, entry, () => open(refKey(host, entry.resource)), () => edit(host, entry.resource)),
          ...(entry.operations.map(String).includes('run')
            ? { action: { icon: EMOJIcon.run, label: t('automations/actions/runNow'), run: () => void runNow(host, entry).catch(say) } }
            : {}),
          ...(inGroup === undefined ? {} : { group: inGroup }),
        };
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [hosts, states, hostName, grouping, sorting, filter, t],
  );

  // One host's notice in mono; in multi a host that is down says so in its own place (hosts plan 02 task 03).
  const error = multi ? null : errors[0] ?? null;
  const state = multi ? states.find((one) => one !== undefined) : states[0];
  const notice = error !== null
    ? <Alert tone="danger" title={t('automations/notices/none')} message={error} />
    : state === undefined
      ? <Spinner label={t('automations/notices/reading')} />
      : rows.length === 0 ? <p className="web-note web-explorer__empty">{t('automations/explorer/empty')}</p> : null;

  return (
    <ExplorerList
      label={t('automations/explorer/title')}
      rows={rows}
      selected={active === undefined ? null : refKey(active.host, active.resource)}
      onOpen={open}
      notice={notice}
      filterLabel={t('automations/explorer/filter')}
      hostLines={multi}
    />
  );
}
