import { useState, type ReactElement, type ReactNode } from 'react';
import { useScena, useStore } from '@softov/scena/react';
import { Alert, Badge, Button, DetailList, Markdown, Spinner, Text, type DetailItem } from '@softov/scena/ui';
import { automationReducer, type AutomationCapabilities, type AutomationEntry, type AutomationState as Catalogue } from '@microsoft/agent-host-protocol';
import { AHP_AUTOMATION_CAPS, AUTOMATIONS, request } from '../connection/data.js';
import { useChannel } from '../connection/channel.js';
import { elapsed, folderLabel } from '../connection/words.js';
import { tokens } from '../sessions/turn.js';
import { cancelRun, remove, runNow, setEnabled } from './actions.js';
import { cronWords, runFacts, runsByTime, stateOf, timeOf, titleOf, type AutomationState } from './words.js';

type Tone = 'default' | 'success' | 'warning' | 'danger' | 'info';

const STATE: Record<AutomationState, { tone: Tone; text: string }> = {
  running: { tone: 'info', text: 'Running' },
  failed: { tone: 'danger', text: 'Last run failed' },
  on: { tone: 'success', text: 'On' },
  off: { tone: 'default', text: 'Off' },
};

const RUN: Record<string, { tone: Tone; text: string }> = {
  pending: { tone: 'default', text: 'Waiting' },
  running: { tone: 'info', text: 'Running' },
  completed: { tone: 'success', text: 'Done' },
  failed: { tone: 'danger', text: 'Failed' },
  cancelled: { tone: 'default', text: 'Stopped' },
};

/** How a run began: by hand, or by which trigger and for when. */
function originOf(origin: unknown): string {
  const said = origin as { kind?: string; trigger?: string; scheduledFor?: string; catchUp?: boolean };
  if (String(said.kind) !== 'trigger') return 'By hand';
  const when = said.scheduledFor === undefined ? '' : ` for ${timeOf(said.scheduledFor)}`;
  return `${said.catchUp === true ? 'Catch-up' : 'Scheduled'}${when}`;
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
  const stops = (definition.disableConditions ?? []).map((one) => ('max' in one ? `After ${one.max} runs` : `After ${timeOf(one.date)}`));
  const items: DetailItem[] = [
    { label: 'Agent', value: session.provider ?? 'The host default' },
    { label: 'Model', value: session.model?.id ?? 'The agent default' },
  ];
  if (folders.length > 0) items.push({ label: 'Folder', value: lines(folders.map(folderLabel)) });
  if (session.config !== undefined && Object.keys(session.config).length > 0) {
    items.push({ label: 'Settings', value: lines(Object.entries(session.config).map(([key, value]) => `${key}: ${String(value)}`)) });
  }
  for (const trigger of schedules) {
    if (!('schedule' in trigger)) continue;
    items.push({ label: 'Schedule', value: lines([cronWords(trigger.schedule.expression), <span key="raw" className="web-method">{`${trigger.schedule.expression} \u{00B7} ${trigger.schedule.timeZone}`}</span>]) });
    items.push({ label: 'Missed runs', value: String(trigger.misfirePolicy) === 'runOnce' ? 'Run once when back' : 'Skipped' });
  }
  if (schedules.length === 0 && events.length === 0) items.push({ label: 'Schedule', value: 'Run by hand only' });
  for (const trigger of events) {
    if ('schedule' in trigger) continue;
    items.push({ label: 'Event', value: `${trigger.title}${trigger.events.length === 0 ? '' : `: ${trigger.events.map((one) => one.title).join(', ')}`}` });
  }
  if (stops.length > 0) items.push({ label: 'Turns off', value: lines(stops) });
  if (entry.nextRunAt !== undefined && definition.enabled) items.push({ label: 'Next run', value: timeOf(entry.nextRunAt) });
  items.push({ label: 'Runs', value: String(entry.runCount ?? entry.runs.length) });
  if ((entry.customizations?.length ?? 0) > 0) items.push({ label: 'Customizations', value: String(entry.customizations?.length) });
  items.push({ label: 'Created', value: timeOf(entry.createdAt) }, { label: 'Changed', value: timeOf(entry.modifiedAt) });
  return items;
}

/** One automation: what it sends, where, when, and how its runs went. */
export default function AutomationPage({ resource }: { resource?: string }): ReactElement {
  const scena = useScena();
  const { state, error } = useChannel<Catalogue>(AUTOMATIONS, automationReducer);
  const caps = useStore<AutomationCapabilities | null>(AHP_AUTOMATION_CAPS);
  const [failure, setFailure] = useState<string | null>(null);
  if (error !== null) return <Alert tone="danger" title="No automations" message={error} />;
  if (state === undefined) return <Spinner label="Reading the automations" />;
  const entry = state.entries.find((one) => one.resource === resource);
  if (entry === undefined) return <Alert tone="warning" message="This automation is gone." />;

  const can = (operation: string): boolean => entry.operations.map(String).includes(operation);
  const now = STATE[stateOf(entry)];
  const runs = runsByTime(entry);
  const say = (caught: unknown): void => setFailure(caught instanceof Error ? caught.message : String(caught));

  return (
    <div className="web-page">
      <div className="web-page__head">
        <div className="web-chat__title">
          <Text variant="h2" text={titleOf(entry)} />
          <Badge tone={now.tone} text={now.text} />
        </div>
        <div className="web-page__actions">
          {can('run') ? <Button label="Run now" variant="primary" onClick={() => void runNow(entry).catch(say)} /> : null}
          {can('update') ? <Button label={entry.definition.enabled ? 'Turn off' : 'Turn on'} onClick={() => setEnabled(entry, !entry.definition.enabled)} /> : null}
          {can('update') ? <Button label="Edit" onClick={() => void scena.commands.execute('ahp.editAutomation', { resource: entry.resource })} /> : null}
          {can('remove') ? <Button label="Delete" onClick={() => remove(entry)} /> : null}
        </div>
      </div>
      {failure === null ? null : <Alert tone="danger" message={failure} />}

      <DetailList items={factsOf(entry)} columns={2} />

      <Text variant="h3" text="Message" />
      <div className="web-automation__message"><Markdown text={entry.definition.message.text} /></div>

      <Text variant="h3" text="Runs" />
      {runs.length === 0 ? <p className="web-note">No runs yet.</p> : (
        <table className="web-runs">
          <thead>
            <tr><th>Status</th><th>How</th><th>Started</th><th>Took</th><th>Tokens</th><th /></tr>
          </thead>
          <tbody>
            {runs.map((run) => {
              const facts = runFacts(run);
              const shown = RUN[facts.status] ?? { tone: 'default' as Tone, text: facts.status };
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
                      <Button label="Open session" size="sm" onClick={() => void scena.commands.execute('ahp.openSession', { resource: run.primarySession })} />
                    )}
                    {live && caps?.runCancellation !== undefined ? <Button label="Stop" size="sm" onClick={() => cancelRun(run.resource)} /> : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
      {entry.runsNextCursor === undefined ? null : (
        <Button
          label="Load older runs"
          onClick={() => void request('fetchAutomationRuns', { channel: AUTOMATIONS, automation: entry.resource, cursor: entry.runsNextCursor } as never).catch(say)}
        />
      )}
    </div>
  );
}
