import type { ReactElement } from 'react';
import { useScena } from '@softov/scena/react';
import { Alert, Badge, Button, DetailList, Markdown, Spinner, Text, type DetailItem } from '@softov/scena/ui';
import { automationReducer, type AutomationState } from '@microsoft/agent-host-protocol';
import { AUTOMATIONS } from '../connection/data.js';
import { useChannel } from '../connection/channel.js';
import { folderLabel } from '../connection/words.js';
import { timeOf, titleOf, triggerLine } from './words.js';

const RUN_TONE: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
  pending: 'default',
  running: 'info',
  completed: 'success',
  failed: 'danger',
  cancelled: 'default',
};

/** One automation: what it sends, when, and its recent runs. */
export default function AutomationPage({ resource }: { resource?: string }): ReactElement {
  const scena = useScena();
  const { state, error } = useChannel<AutomationState>(AUTOMATIONS, automationReducer);
  if (error !== null) return <Alert tone="danger" title="No automations" message={error} />;
  if (state === undefined) return <Spinner label="Reading the automations" />;
  const entry = state.entries.find((one) => one.resource === resource);
  if (entry === undefined) return <Alert tone="warning" message="This automation is gone." />;
  const { definition } = entry;
  const folders = definition.session.workingDirectories ?? [];
  const items: DetailItem[] = [
    { label: 'Status', value: <Badge tone={definition.enabled ? 'success' : 'default'} text={definition.enabled ? 'On' : 'Off'} /> },
    ...(definition.session.provider === undefined ? [] : [{ label: 'Agent', value: definition.session.provider }]),
    ...(entry.nextRunAt === undefined ? [] : [{ label: 'Next run', value: timeOf(entry.nextRunAt) }]),
    ...(entry.runCount === undefined ? [] : [{ label: 'Runs', value: String(entry.runCount) }]),
    ...(folders.length === 0 ? [] : [{ label: 'Folders', value: folders.map(folderLabel).join('\n'), span: true }]),
    { label: 'When', value: definition.triggers.length === 0 ? 'Only when run by hand' : definition.triggers.map(triggerLine).join('\n'), span: true },
  ];
  return (
    <div className="web-page">
      <Text variant="h2" text={titleOf(entry)} />
      <DetailList items={items} columns={2} />
      <Text variant="h3" text="Message" />
      <Markdown text={definition.message.text} />
      <Text variant="h3" text="Recent runs" />
      {entry.runs.length === 0 ? <p className="web-note">No runs yet.</p> : (
        <ul className="web-runs">
          {entry.runs.map((run) => {
            const status = String((run.lifecycle as { status?: string }).status ?? '');
            const at = (run.lifecycle as { startedAt?: string; createdAt?: string }).startedAt ?? (run.lifecycle as { createdAt?: string }).createdAt;
            return (
              <li key={run.resource}>
                <Badge tone={RUN_TONE[status] ?? 'default'} text={status === '' ? 'Run' : status} />
                <span className="web-method">{timeOf(at)}</span>
                {run.primarySession === undefined ? null : (
                  <Button label="Open session" onClick={() => void scena.commands.execute('ahp.openSession', { resource: run.primarySession })} />
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
