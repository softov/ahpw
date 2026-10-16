import { useState, type ReactElement, type ReactNode } from 'react';
import { useI18n, useScena, useStore } from '@softov/scena/react';
import { Button, Spinner, Text } from '@softov/scena/ui';
import {
  automationReducer,
  type AgentInfo,
  type AutomationCapabilities,
  type AutomationState as Catalogue,
  type StateAction,
} from '@microsoft/agent-host-protocol';
import { AHP_AGENTS, AHP_AUTOMATION_CAPS, AHP_DEFAULT_DIRECTORY, AUTOMATIONS, dispatch } from '../../bridges/data.js';
import { useChannel } from '../../bridges/channel.js';
import { folderLabel, newId } from '../../bridges/words.js';
import { cronWords, definitionOf, draftOf, draftProblem, type Draft } from './words.js';
import { PageAlert } from '../../shell/view/PageAlert.js';
import { plural } from '../../i18n/locales.js';

/** Schedules most people want, so a cron expression is something to read rather than write. */
const PRESETS: { key: string; expression: string }[] = [
  { key: 'byHand', expression: '' },
  { key: 'every10Minutes', expression: '*/10 * * * *' },
  { key: 'everyHour', expression: '0 * * * *' },
  { key: 'every6Hours', expression: '0 */6 * * *' },
  { key: 'dailyAt9', expression: '0 9 * * *' },
  { key: 'weekdaysAt9', expression: '0 9 * * 1-5' },
  { key: 'mondayAt5', expression: '0 5 * * 1' },
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
  const { t } = useI18n();
  const { state, error } = useChannel<Catalogue>(AUTOMATIONS, automationReducer);
  const agents = useStore<AgentInfo[]>(AHP_AGENTS) ?? [];
  const caps = useStore<AutomationCapabilities | null>(AHP_AUTOMATION_CAPS);
  const home = useStore<string | null>(AHP_DEFAULT_DIRECTORY);
  const entry = resource === undefined ? undefined : state?.entries.find((one) => one.resource === resource);
  const [draft, setDraft] = useState<Draft | null>(null);

  if (error !== null) return <PageAlert tone="danger" title={t('automations/notices/none')} message={error} />;
  if (state === undefined) return <Spinner label={t('automations/notices/reading')} />;
  if (resource !== undefined && entry === undefined) return <PageAlert tone="warning" message={t('automations/notices/gone')} />;
  if (resource === undefined && caps?.create === undefined) return <PageAlert tone="warning" message={t('automations/edit/noCreate')} />;

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
      <Text variant="h2" text={entry === undefined ? t('automations/commands/new') : entry.definition.title === '' ? t('automations/commands/edit') : t('automations/editTitle', { title: entry.definition.title })} />

      <Field label={t('automations/edit/title')}>
        <input className="web-field" value={shown.title} onChange={(event) => set({ title: event.target.value })} />
      </Field>

      <Field label={t('automations/edit/message')} hint={t('automations/edit/messageHint')}>
        <textarea className="web-field web-form__message" rows={5} value={shown.message} onChange={(event) => set({ message: event.target.value })} />
      </Field>

      <div className="web-form__row">
        <Field label={t('automations/edit/agent')}>
          <select className="web-field" value={shown.provider} onChange={(event) => set({ provider: event.target.value, model: '' })}>
            <option value="">{t('automations/defaults/host')}</option>
            {agents.map((one) => <option key={one.provider} value={one.provider}>{one.displayName}</option>)}
          </select>
        </Field>
        <Field label={t('automations/edit/model')}>
          <select className="web-field" value={shown.model} onChange={(event) => set({ model: event.target.value })}>
            <option value="">{t('automations/defaults/agent')}</option>
            {(agent?.models ?? []).map((one) => <option key={one.id} value={one.id}>{one.name}</option>)}
          </select>
        </Field>
      </div>

      <Field label={t('automations/edit/folder')} hint={t('automations/edit/folderHint')}>
        <input className="web-field" value={shown.folder} onChange={(event) => set({ folder: event.target.value })} />
      </Field>

      <div className="web-form__row">
        <Field label={t('automations/edit/schedule')}>
          <select className="web-field" value={preset?.expression ?? 'custom'} onChange={(event) => { if (event.target.value !== 'custom') set({ expression: event.target.value }); }}>
            {PRESETS.map((one) => <option key={one.key} value={one.expression}>{t(`automations/edit/presets/${one.key}`)}</option>)}
            <option value="custom">{t('automations/edit/custom')}</option>
          </select>
        </Field>
        <Field
          label={t('automations/edit/cron')}
          hint={`${shown.expression.trim() === '' ? t('automations/edit/byHandHint') : cronWords(shown.expression)}${minimum === undefined ? '' : ` ${plural('automations/edit/minimum', minimum)}`}`}
        >
          <input className="web-field" value={shown.expression} placeholder={t('automations/edit/cronPlaceholder')} onChange={(event) => set({ expression: event.target.value })} />
        </Field>
      </div>

      {shown.expression.trim() === '' ? null : (
        <div className="web-form__row">
          <Field label={t('automations/edit/timeZone')}>
            <input className="web-field" value={shown.timeZone} onChange={(event) => set({ timeZone: event.target.value })} />
          </Field>
          <Field label={t('automations/edit/missedRuns')} hint={t('automations/edit/missedHint')}>
            <select className="web-field" value={shown.misfire} onChange={(event) => set({ misfire: event.target.value === 'runOnce' ? 'runOnce' : 'skip' })}>
              <option value="skip">{t('automations/edit/skip')}</option>
              <option value="runOnce">{t('automations/edit/runOnce')}</option>
            </select>
          </Field>
        </div>
      )}

      <div className="web-form__row">
        <Field label={t('automations/edit/afterRuns')} hint={t('automations/edit/keepsOn')}>
          <input className="web-field" inputMode="numeric" value={shown.afterRuns} onChange={(event) => set({ afterRuns: event.target.value })} />
        </Field>
        <Field label={t('automations/edit/afterDate')} hint={t('automations/edit/keepsOn')}>
          <input className="web-field" type="date" value={shown.afterDate} onChange={(event) => set({ afterDate: event.target.value })} />
        </Field>
      </div>

      <label className="web-input__row">
        <input type="checkbox" checked={shown.enabled} onChange={(event) => set({ enabled: event.target.checked })} />
        <span>{t('automations/edit/on')}</span>
      </label>

      {problem === undefined ? null : <p className="web-note">{problem}</p>}
      <div className="web-page__actions">
        <Button label={t(entry === undefined ? 'automations/edit/create' : 'automations/edit/save')} variant="primary" disabled={problem !== undefined} onClick={save} />
        <Button label={t('automations/edit/cancel')} onClick={() => scena.surfaces.close(entry === undefined ? 'automation:new' : `automation:edit:${entry.resource}`)} />
      </div>
    </div>
  );
}
