import { useMemo, type ReactElement } from 'react';
import { translate } from '@softov/scena';
import { useI18n, useScena, useStore } from '@softov/scena/react';
import { Alert, Spinner } from '@softov/scena/ui';
import { automationReducer, type AutomationCapabilities, type AutomationState as Catalogue } from '@microsoft/agent-host-protocol';
import { AHP_AUTOMATION_CAPS, AUTOMATIONS, refresh } from '../../bridges/data.js';
import { useChannel } from '../../bridges/channel.js';
import { ExplorerList, type Dot, type Row } from '../../shell/explorer/ExplorerList.js';
import { menuOf, runNow } from './actions.js';
import { ACTIVE_AUTOMATION } from './state.js';
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

/** The sidebar: the daemon's automations, by title, with when they run and how the last run went. */
export default function AutomationExplorer(): ReactElement {
  const scena = useScena();
  const { t } = useI18n();
  const { state, error } = useChannel<Catalogue>(AUTOMATIONS, automationReducer);
  const caps = useStore<AutomationCapabilities | null>(AHP_AUTOMATION_CAPS);
  const active = useStore<string>(ACTIVE_AUTOMATION);
  const open = (resource: string): void => void scena.commands.execute('ahp.openAutomation', { resource });
  const edit = (resource: string): void => void scena.commands.execute('ahp.editAutomation', { resource });

  const rows = useMemo<Row[]>(
    () => [...(state?.entries ?? [])]
      .sort((a, b) => titleOf(a).localeCompare(titleOf(b)))
      .map((entry) => {
        const now = stateOf(entry);
        const last = runsByTime(entry)[0];
        const facts = last === undefined ? undefined : runFacts(last);
        const agent = entry.definition.session.provider;
        const runs = entry.runCount ?? entry.runs.length;
        return {
          key: entry.resource,
          dot: DOT[now],
          dotLabel: t(`automations/state/${now}`),
          title: titleOf(entry),
          ...(entry.nextRunAt === undefined || !entry.definition.enabled ? {} : { time: at(entry.nextRunAt) }),
          lines: [
            [whenLine(entry), agent].filter((bit) => bit !== undefined).join(' \u{00B7} '),
            facts === undefined
              ? t('automations/explorer/neverRun')
              : `${plural('automations/explorer/runs', runs)} \u{00B7} ${RUN_STATES.has(facts.status) ? t(`automations/explorer/last/${facts.status}`, { at: at(facts.at) }) : t('automations/explorer/last/other', { status: facts.status, at: at(facts.at) })}`,
          ],
          menu: menuOf(entry, () => open(entry.resource), () => edit(entry.resource)),
          ...(entry.operations.map(String).includes('run')
            ? { action: { icon: EMOJIcon.run, label: t('automations/actions/runNow'), run: () => void runNow(entry).catch(say) } }
            : {}),
        };
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state, t],
  );

  const notice = error !== null
    ? <Alert tone="danger" title={t('automations/notices/none')} message={error} />
    : state === undefined
      ? <Spinner label={t('automations/notices/reading')} />
      : rows.length === 0 ? <p className="web-note web-explorer__empty">{t('automations/explorer/empty')}</p> : null;

  return (
    <ExplorerList
      title={t('automations/explorer/title')}
      actions={[
        ...(caps?.create === undefined ? [] : [{ icon: '+', label: t('automations/commands/new'), run: () => void scena.commands.execute('ahp.newAutomation') }]),
        { icon: EMOJIcon.reload, label: t('common/reload'), run: () => void refresh(AUTOMATIONS) },
      ]}
      rows={rows}
      selected={active ?? null}
      onOpen={open}
      notice={notice}
      filterLabel={t('automations/explorer/filter')}
    />
  );
}
