import { useMemo, type ReactElement } from 'react';
import { useScena, useStore } from '@softov/scena/react';
import { Alert, Spinner } from '@softov/scena/ui';
import { automationReducer, type AutomationCapabilities, type AutomationState as Catalogue } from '@microsoft/agent-host-protocol';
import { AHP_AUTOMATION_CAPS, AUTOMATIONS, refresh } from '../connection/data.js';
import { useChannel } from '../connection/channel.js';
import { ExplorerList, type Dot, type Row } from '../explorer/ExplorerList.js';
import { menuOf, runNow } from './actions.js';
import { ACTIVE_AUTOMATION } from './state.js';
import { runFacts, runsByTime, stateOf, titleOf, whenLine, type AutomationState } from './words.js';
import { failed } from '../notify/index.js';

const DOT: Record<AutomationState, Dot> = { running: 'working', failed: 'failed', on: 'ok', off: 'off' };
const WORD: Record<AutomationState, string> = { running: 'Running', failed: 'Last run failed', on: 'On', off: 'Off' };
const RUN_WORD: Record<string, string> = { pending: 'waiting', running: 'running', completed: 'done', failed: 'failed', cancelled: 'stopped' };

const short = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
const at = (iso: string | undefined): string => {
  if (iso === undefined) return '';
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? '' : short.format(date);
};

const say = (error: unknown): void => failed('The automation could not run', error);

/** The sidebar: the daemon's automations, by title, with when they run and how the last run went. */
export default function AutomationExplorer(): ReactElement {
  const scena = useScena();
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
          dotLabel: WORD[now],
          title: titleOf(entry),
          ...(entry.nextRunAt === undefined || !entry.definition.enabled ? {} : { time: at(entry.nextRunAt) }),
          lines: [
            [whenLine(entry), agent].filter((bit) => bit !== undefined).join(' \u{00B7} '),
            facts === undefined ? 'Never run' : `${runs} ${runs === 1 ? 'run' : 'runs'} \u{00B7} last ${RUN_WORD[facts.status] ?? facts.status} ${at(facts.at)}`,
          ],
          menu: menuOf(entry, () => open(entry.resource), () => edit(entry.resource)),
          ...(entry.operations.map(String).includes('run')
            ? { action: { icon: '\u{25B6}\u{FE0E}', label: 'Run now', run: () => void runNow(entry).catch(say) } }
            : {}),
        };
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state],
  );

  const notice = error !== null
    ? <Alert tone="danger" title="No automations" message={error} />
    : state === undefined
      ? <Spinner label="Reading the automations" />
      : rows.length === 0 ? <p className="web-note web-explorer__empty">No automations yet.</p> : null;

  return (
    <ExplorerList
      title="Automations"
      actions={[
        ...(caps?.create === undefined ? [] : [{ icon: '+', label: 'New automation', run: () => void scena.commands.execute('ahp.newAutomation') }]),
        { icon: '\u{21BB}', label: 'Reload', run: () => void refresh(AUTOMATIONS) },
      ]}
      rows={rows}
      selected={active ?? null}
      onOpen={open}
      notice={notice}
      filterLabel="Filter automations"
    />
  );
}
