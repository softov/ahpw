import { useState, type ReactElement, type ReactNode } from 'react';
import { translate } from '@softov/scena';
import { useI18n, useScena, useStore } from '@softov/scena/react';
import { Alert, Badge, Button, DetailList, Markdown, Spinner, Text, type DetailItem } from '@softov/scena/ui';
import { automationReducer, type AutomationCapabilities, type AutomationEntry, type AutomationState as Catalogue } from '@microsoft/agent-host-protocol';
import { AHP_AUTOMATION_CAPS, AUTOMATIONS, request } from '../../bridges/data.js';
import { useChannel } from '../../bridges/channel.js';
import { elapsed, folderLabel } from '../../bridges/words.js';
import { tokens } from '../sessions/turn.js';
import { cancelRun, remove, runNow, setEnabled } from './actions.js';
import { cronWords, runFacts, runsByTime, stateOf, timeOf, titleOf, type AutomationState } from './words.js';
import { PageAlert } from '../../shell/view/PageAlert.js';
import { plural } from '../../i18n/locales.js';

type Tone = 'default' | 'success' | 'warning' | 'danger' | 'info';

const STATE: Record<AutomationState, Tone> = { running: 'info', failed: 'danger', on: 'success', off: 'default' };

/** The tone of each run state the page has words for, under `automations/run/<state>`. */
const RUN: Record<string, Tone> = { pending: 'default', running: 'info', completed: 'success', failed: 'danger', cancelled: 'default' };

/** How a run began: by hand, or by which trigger and for when. */
function originOf(origin: unknown): string {
  const said = origin as { kind?: string; trigger?: string; scheduledFor?: string; catchUp?: boolean };
  if (String(said.kind) !== 'trigger') return translate('automations/origin/byHand');
  const how = said.catchUp === true ? 'catchUp' : 'scheduled';
  if (said.scheduledFor === undefined) return translate(`automations/origin/${how}`);
  return translate(`automations/origin/${how}For`, { time: timeOf(said.scheduledFor) });
}

/** Values that each take a line of their own. */
const lines = (values: readonly ReactNode[]): ReactElement => (
  <span className="web-lines">{values.map((value, index) => <span key={index}>{value}</span>)}</span>
);

/** The facts of a definition, as a list. */
function factsOf(entry: AutomationEntry): DetailItem[] {
  const { definition } = entry;
  const session = definition.session;
  const folders = session.workingDirectories ?? [];
  const schedules = definition.triggers.filter((trigger) => 'schedule' in trigger);
  const events = definition.triggers.filter((trigger) => !('schedule' in trigger));
  const stops = (definition.disableConditions ?? []).map((one) => ('max' in one ? plural('automations/facts/afterRuns', one.max) : translate('automations/facts/afterDate', { date: timeOf(one.date) })));
  const items: DetailItem[] = [
    { label: translate('automations/facts/agent'), value: session.provider ?? translate('automations/defaults/host') },
    { label: translate('automations/facts/model'), value: session.model?.id ?? translate('automations/defaults/agent') },
  ];
  if (folders.length > 0) items.push({ label: translate('automations/facts/folder'), value: lines(folders.map(folderLabel)) });
  if (session.config !== undefined && Object.keys(session.config).length > 0) {
    items.push({ label: translate('automations/facts/settings'), value: lines(Object.entries(session.config).map(([key, value]) => `${key}: ${String(value)}`)) });
  }
  for (const trigger of schedules) {
    if (!('schedule' in trigger)) continue;
    items.push({ label: translate('automations/facts/schedule'), value: lines([cronWords(trigger.schedule.expression), <span key="raw" className="web-method">{`${trigger.schedule.expression} \u{00B7} ${trigger.schedule.timeZone}`}</span>]) });
    items.push({ label: translate('automations/facts/missedRuns'), value: translate(String(trigger.misfirePolicy) === 'runOnce' ? 'automations/facts/runOnce' : 'automations/facts/skipped') });
  }
  if (schedules.length === 0 && events.length === 0) items.push({ label: translate('automations/facts/schedule'), value: translate('automations/facts/byHandOnly') });
  for (const trigger of events) {
    if ('schedule' in trigger) continue;
    items.push({ label: translate('automations/facts/event'), value: `${trigger.title}${trigger.events.length === 0 ? '' : `: ${trigger.events.map((one) => one.title).join(', ')}`}` });
  }
  if (stops.length > 0) items.push({ label: translate('automations/facts/turnsOff'), value: lines(stops) });
  if (entry.nextRunAt !== undefined && definition.enabled) items.push({ label: translate('automations/facts/nextRun'), value: timeOf(entry.nextRunAt) });
  items.push({ label: translate('automations/facts/runs'), value: String(entry.runCount ?? entry.runs.length) });
  if ((entry.customizations?.length ?? 0) > 0) items.push({ label: translate('automations/facts/customizations'), value: String(entry.customizations?.length) });
  items.push({ label: translate('automations/facts/created'), value: timeOf(entry.createdAt) }, { label: translate('automations/facts/changed'), value: timeOf(entry.modifiedAt) });
  return items;
}

/** One automation: what it sends, where, when, and how its runs went. */
export default function AutomationPage({ resource }: { resource?: string }): ReactElement {
  const scena = useScena();
  const { t } = useI18n();
  const { state, error } = useChannel<Catalogue>(AUTOMATIONS, automationReducer);
  const caps = useStore<AutomationCapabilities | null>(AHP_AUTOMATION_CAPS);
  const [failure, setFailure] = useState<string | null>(null);
  if (error !== null) return <PageAlert tone="danger" title={t('automations/notices/none')} message={error} />;
  if (state === undefined) return <Spinner label={t('automations/notices/reading')} />;
  const entry = state.entries.find((one) => one.resource === resource);
  if (entry === undefined) return <PageAlert tone="warning" message={t('automations/notices/gone')} />;

  const can = (operation: string): boolean => entry.operations.map(String).includes(operation);
  const now = stateOf(entry);
  const runs = runsByTime(entry);
  const say = (caught: unknown): void => setFailure(caught instanceof Error ? caught.message : String(caught));

  return (
    <div className="web-page">
      <div className="web-page__head">
        <div className="web-chat__title">
          <Text variant="h2" text={titleOf(entry)} />
          <Badge tone={STATE[now]} text={t(`automations/state/${now}`)} />
        </div>
        <div className="web-page__actions">
          {can('run') ? <Button label={t('automations/actions/runNow')} variant="primary" onClick={() => void runNow(entry).catch(say)} /> : null}
          {can('update') ? <Button label={t(entry.definition.enabled ? 'automations/actions/turnOff' : 'automations/actions/turnOn')} onClick={() => setEnabled(entry, !entry.definition.enabled)} /> : null}
          {can('update') ? <Button label={t('automations/actions/edit')} onClick={() => void scena.commands.execute('ahp.editAutomation', { resource: entry.resource })} /> : null}
          {can('remove') ? <Button label={t('automations/actions/delete')} onClick={() => void remove(entry)} /> : null}
        </div>
      </div>
      {failure === null ? null : <Alert tone="danger" message={failure} />}

      <DetailList items={factsOf(entry)} columns={2} />

      <Text variant="h3" text={t('automations/page/message')} />
      <div className="web-automation__message"><Markdown text={entry.definition.message.text} /></div>

      <Text variant="h3" text={t('automations/page/runs')} />
      {runs.length === 0 ? <p className="web-note">{t('automations/page/noRuns')}</p> : (
        <table className="web-runs">
          <thead>
            <tr>
              <th>{t('automations/page/columns/status')}</th>
              <th>{t('automations/page/columns/how')}</th>
              <th>{t('automations/page/columns/started')}</th>
              <th>{t('automations/page/columns/took')}</th>
              <th>{t('automations/page/columns/tokens')}</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {runs.map((run) => {
              const facts = runFacts(run);
              const tone = RUN[facts.status];
              const shown = tone === undefined ? { tone: 'default' as Tone, text: facts.status } : { tone, text: t(`automations/run/${facts.status}`) };
              const live = facts.status === 'running' || facts.status === 'pending';
              return (
                <tr key={run.resource}>
                  <td><Badge tone={shown.tone} text={shown.text} />{facts.error === undefined ? null : <div className="web-note">{facts.error}</div>}</td>
                  <td>{originOf(run.origin)}</td>
                  <td>{timeOf(facts.at)}</td>
                  <td>{facts.took === undefined ? '' : elapsed(facts.took)}</td>
                  <td>{facts.input === undefined && facts.output === undefined ? '' : `\u{2191}${tokens(facts.input ?? 0)} \u{2193}${tokens(facts.output ?? 0)}`}</td>
                  <td className="web-runs__actions">
                    {run.primarySession === undefined ? null : (
                      <Button label={t('automations/page/openSession')} size="sm" onClick={() => void scena.commands.execute('ahp.openSession', { resource: run.primarySession })} />
                    )}
                    {live && caps?.runCancellation !== undefined ? <Button label={t('automations/page/stop')} size="sm" onClick={() => cancelRun(run.resource)} /> : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
      {entry.runsNextCursor === undefined ? null : (
        <Button
          label={t('automations/page/loadOlder')}
          onClick={() => void request('fetchAutomationRuns', { channel: AUTOMATIONS, automation: entry.resource, cursor: entry.runsNextCursor } as never).catch(say)}
        />
      )}
    </div>
  );
}
