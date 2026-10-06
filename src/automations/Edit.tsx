import { useState, type ReactElement, type ReactNode } from 'react';
import { useScena, useStore } from '@softov/scena/react';
import { Alert, Button, Spinner, Text } from '@softov/scena/ui';
import {
  automationReducer,
  type AgentInfo,
  type AutomationCapabilities,
  type AutomationState as Catalogue,
  type StateAction,
} from '@microsoft/agent-host-protocol';
import { AHP_AGENTS, AHP_AUTOMATION_CAPS, AHP_DEFAULT_DIRECTORY, AUTOMATIONS, dispatch } from '../connection/data.js';
import { useChannel } from '../connection/channel.js';
import { folderLabel, newId } from '../connection/words.js';
import { cronWords, definitionOf, draftOf, draftProblem, type Draft } from './words.js';

/** Schedules most people want, so a cron expression is something to read rather than write. */
const PRESETS: { label: string; expression: string }[] = [
  { label: 'By hand only', expression: '' },
  { label: 'Every 10 minutes', expression: '*/10 * * * *' },
  { label: 'Every hour', expression: '0 * * * *' },
  { label: 'Every 6 hours', expression: '0 */6 * * *' },
  { label: 'Every day at 09:00', expression: '0 9 * * *' },
  { label: 'Weekdays at 09:00', expression: '0 9 * * 1-5' },
  { label: 'Every Monday at 05:00', expression: '0 5 * * 1' },
];

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }): ReactElement {
  return (
    <label className="web-form__field">
      <span className="web-input__label">{label}</span>
      {children}
      {hint === undefined ? null : <span className="web-input__hint">{hint}</span>}
    </label>
  );
}

/** Creates an automation, or edits the one named by `resource`. */
export default function AutomationEditPage({ resource }: { resource?: string }): ReactElement {
  const scena = useScena();
  const { state, error } = useChannel<Catalogue>(AUTOMATIONS, automationReducer);
  const agents = useStore<AgentInfo[]>(AHP_AGENTS) ?? [];
  const caps = useStore<AutomationCapabilities | null>(AHP_AUTOMATION_CAPS);
  const home = useStore<string | null>(AHP_DEFAULT_DIRECTORY);
  const entry = resource === undefined ? undefined : state?.entries.find((one) => one.resource === resource);
  const [draft, setDraft] = useState<Draft | null>(null);

  if (error !== null) return <Alert tone="danger" title="No automations" message={error} />;
  if (state === undefined) return <Spinner label="Reading the automations" />;
  if (resource !== undefined && entry === undefined) return <Alert tone="warning" message="This automation is gone." />;
  if (resource === undefined && caps?.create === undefined) return <Alert tone="warning" message="This host does not let clients create automations." />;

  const shown = draft ?? draftOf(entry, { ...(agents[0] === undefined ? {} : { provider: agents[0].provider }), ...(home === null || home === undefined ? {} : { folder: folderLabel(home) }) });
  const set = (patch: Partial<Draft>): void => setDraft({ ...shown, ...patch });
  const agent = agents.find((one) => one.provider === shown.provider);
  const problem = draftProblem(shown);
  const minimum = caps?.schedules?.minIntervalMinutes;
  const preset = PRESETS.find((one) => one.expression === shown.expression.trim());

  const save = (): void => {
    if (problem !== undefined) return;
    const definition = definitionOf(shown, entry?.definition);
    if (entry === undefined) {
      const created = `ahp-automation:/${newId()}`;
      dispatch(AUTOMATIONS, { type: 'automation/createRequested', resource: created, definition } as StateAction);
      scena.surfaces.close('automation:new');
      void scena.commands.execute('ahp.openAutomation', { resource: created });
    } else {
      dispatch(AUTOMATIONS, { type: 'automation/updateRequested', resource: entry.resource, changes: definition } as StateAction);
      scena.surfaces.close(`automation:edit:${entry.resource}`);
      void scena.commands.execute('ahp.openAutomation', { resource: entry.resource });
    }
  };

  return (
    <div className="web-page web-form">
      <Text variant="h2" text={entry === undefined ? 'New automation' : `Edit ${entry.definition.title || 'automation'}`} />

      <Field label="Title">
        <input className="web-field" value={shown.title} onChange={(event) => set({ title: event.target.value })} />
      </Field>

      <Field label="Message" hint="What the agent is told each time it runs.">
        <textarea className="web-field web-form__message" rows={5} value={shown.message} onChange={(event) => set({ message: event.target.value })} />
      </Field>

      <div className="web-form__row">
        <Field label="Agent">
          <select className="web-field" value={shown.provider} onChange={(event) => set({ provider: event.target.value, model: '' })}>
            <option value="">The host default</option>
            {agents.map((one) => <option key={one.provider} value={one.provider}>{one.displayName}</option>)}
          </select>
        </Field>
        <Field label="Model">
          <select className="web-field" value={shown.model} onChange={(event) => set({ model: event.target.value })}>
            <option value="">The agent default</option>
            {(agent?.models ?? []).map((one) => <option key={one.id} value={one.id}>{one.name}</option>)}
          </select>
        </Field>
      </div>

      <Field label="Folder" hint="A folder on the daemon's machine.">
        <input className="web-field" value={shown.folder} onChange={(event) => set({ folder: event.target.value })} />
      </Field>

      <div className="web-form__row">
        <Field label="Schedule">
          <select className="web-field" value={preset?.expression ?? 'custom'} onChange={(event) => { if (event.target.value !== 'custom') set({ expression: event.target.value }); }}>
            {PRESETS.map((one) => <option key={one.label} value={one.expression}>{one.label}</option>)}
            <option value="custom">Custom</option>
          </select>
        </Field>
        <Field
          label="Cron expression"
          hint={`${shown.expression.trim() === '' ? 'Runs only when started by hand.' : cronWords(shown.expression)}${minimum === undefined ? '' : ` At most every ${minimum} minutes.`}`}
        >
          <input className="web-field" value={shown.expression} placeholder="minute hour day month weekday" onChange={(event) => set({ expression: event.target.value })} />
        </Field>
      </div>

      {shown.expression.trim() === '' ? null : (
        <div className="web-form__row">
          <Field label="Time zone">
            <input className="web-field" value={shown.timeZone} onChange={(event) => set({ timeZone: event.target.value })} />
          </Field>
          <Field label="Missed runs" hint="What happens to a run due while the daemon was down.">
            <select className="web-field" value={shown.misfire} onChange={(event) => set({ misfire: event.target.value === 'runOnce' ? 'runOnce' : 'skip' })}>
              <option value="skip">Skip them</option>
              <option value="runOnce">Run once when back</option>
            </select>
          </Field>
        </div>
      )}

      <div className="web-form__row">
        <Field label="Turn off after runs" hint="Empty keeps it on.">
          <input className="web-field" inputMode="numeric" value={shown.afterRuns} onChange={(event) => set({ afterRuns: event.target.value })} />
        </Field>
        <Field label="Turn off after" hint="Empty keeps it on.">
          <input className="web-field" type="date" value={shown.afterDate} onChange={(event) => set({ afterDate: event.target.value })} />
        </Field>
      </div>

      <label className="web-input__row">
        <input type="checkbox" checked={shown.enabled} onChange={(event) => set({ enabled: event.target.checked })} />
        <span>On</span>
      </label>

      {problem === undefined ? null : <p className="web-note">{problem}</p>}
      <div className="web-page__actions">
        <Button label={entry === undefined ? 'Create' : 'Save'} variant="primary" disabled={problem !== undefined} onClick={save} />
        <Button label="Cancel" onClick={() => scena.surfaces.close(entry === undefined ? 'automation:new' : `automation:edit:${entry.resource}`)} />
      </div>
    </div>
  );
}
