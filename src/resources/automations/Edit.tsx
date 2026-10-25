import { useMemo, useRef, useState, type ReactElement } from 'react';
import { getLocale } from '@softov/scena';
import { useI18n, useScena, useStore } from '@softov/scena/react';
import { Button, ContextMenu, Spinner, Text } from '@softov/scena/ui';
import type { PickerAction } from '@softov/scena/types';
import {
  automationReducer,
  type AgentInfo,
  type AutomationCapabilities,
  type AutomationState as Catalogue,
  type StateAction,
} from '@microsoft/agent-host-protocol';
import { ahpPaths, AUTOMATIONS, hostBridge } from '../../bridges/data.js';
import { HOST_LIST, type HostName } from '../../bridges/hosts.js';
import { embedMode } from '../../shell/embed/index.js';
import { writeLastHost } from '../sessions/last-host.js';
import { useChannel } from '../../bridges/channel.js';
import { folderLabel, newId } from '../../bridges/words.js';
import { cronWords, definitionOf, draftOf, draftProblem, type Draft } from './words.js';
import { PageAlert } from '../../shell/view/PageAlert.js';
import { Field } from '../../shell/view/Field.js';
import { plural } from '../../i18n/locales.js';
import { useAgentIconSrc } from '../agents/icons.js';
import { EMOJIcon } from '../emojis.js';
import { confirm } from '../../shell/notify/confirm.js';
import { templatesIn, type AutomationTemplate } from './templates.js';

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

/** The agent an automation runs with, picked from a list that draws each agent's icon; empty is the host's default. */
function AgentField({ host, agents, value, onChange }: { host: string; agents: readonly AgentInfo[]; value: string; onChange: (provider: string) => void }): ReactElement {
  const { t } = useI18n();
  const iconSrcOf = useAgentIconSrc(useMemo(() => [host], [host]));
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);
  const agent = agents.find((one) => one.provider === value);
  const image = value === '' ? undefined : iconSrcOf(host, value);
  const pick = (provider: string) => (list: { closeMenu: () => void }): void => {
    list.closeMenu();
    onChange(provider);
  };
  return (
    <>
      <button
        type="button"
        className="web-field web-agent-field"
        aria-haspopup="menu"
        aria-expanded={menu !== null}
        onClick={(event) => {
          const box = event.currentTarget.getBoundingClientRect();
          setMenu({ x: box.left, y: box.bottom });
        }}
      >
        {image === undefined ? null : <img className="web-agent-field__image" src={image} alt="" />}
        <span className="web-agent-field__label">{value === '' ? t('automations/defaults/host') : agent?.displayName ?? value}</span>
        <span aria-hidden="true">{EMOJIcon.caretDown}</span>
      </button>
      {menu === null ? null : (
        <ContextMenu
          spec={{
            items: [
              { title: t('automations/defaults/host'), active: value === '', onSelect: pick('') },
              ...agents.map((one): PickerAction => {
                const iconSrc = iconSrcOf(host, one.provider);
                return { title: one.displayName, ...(iconSrc === undefined ? {} : { iconSrc }), active: one.provider === value, onSelect: pick(one.provider) };
              }),
            ],
          }}
          x={menu.x}
          y={menu.y}
          onClose={() => setMenu(null)}
        />
      )}
    </>
  );
}

/** A button that lists the examples and hands back the one picked, asking first when it would replace what was typed. */
function ExamplesButton({ dirty, onPick }: { dirty: boolean; onPick: (template: AutomationTemplate) => void }): ReactElement {
  const { t } = useI18n();
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);
  const anchor = useRef<HTMLDivElement>(null);
  const take = (template: AutomationTemplate) => (list: { closeMenu: () => void }): void => {
    list.closeMenu();
    if (!dirty) {
      onPick(template);
      return;
    }
    void confirm({ title: t('automations/edit/examples/replace'), body: t('automations/edit/examples/replaceNote'), confirmLabel: t('automations/edit/examples/replaceYes'), cancelLabel: t('automations/edit/examples/replaceNo') })
      .then((yes) => { if (yes) onPick(template); });
  };
  // The menu sits inside the anchor: a page's own children take its gutter as a margin.
  return (
    <div ref={anchor}>
      <Button
        label={`${t('automations/edit/examples/open')} ${EMOJIcon.caretDown}`}
        onClick={() => {
          const box = anchor.current?.getBoundingClientRect();
          if (box !== undefined) setMenu({ x: box.left, y: box.bottom });
        }}
      />
      {menu === null ? null : (
        <ContextMenu
          spec={{
            rich: true,
            items: templatesIn(getLocale()).map((one) => ({
              title: one.title,
              description: cronWords(one.expression),
              icon: one.emoji,
              group: t(`automations/edit/examples/${one.group}`),
              onSelect: take(one),
            })),
          }}
          x={menu.x}
          y={menu.y}
          onClose={() => setMenu(null)}
        />
      )}
    </div>
  );
}

/** Creates an automation, or edits the one named by `resource`. */
export default function AutomationEditPage({ host: opened, resource }: { host: string; resource?: string }): ReactElement {
  // A new automation with every host may move to another host; one that exists stays on its own.
  const [picked, setPicked] = useState(opened);
  const host = resource === undefined && embedMode() === 'multi' ? picked : opened;
  const hostList = useStore<HostName[]>(HOST_LIST);
  const scena = useScena();
  const { t } = useI18n();
  const { state, error } = useChannel<Catalogue>(host, AUTOMATIONS, automationReducer);
  const agents = useStore<AgentInfo[]>(ahpPaths(host).agents) ?? [];
  const caps = useStore<AutomationCapabilities | null>(ahpPaths(host).automationCaps);
  const home = useStore<string | null>(ahpPaths(host).defaultDirectory);
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
      hostBridge(host).dispatch(AUTOMATIONS, { type: 'automation/createRequested', resource: created, definition } as StateAction);
      scena.surfaces.close('automation:new');
      writeLastHost(host);
      void scena.commands.execute('ahp.openAutomation', { host, resource: created });
    } else {
      hostBridge(host).dispatch(AUTOMATIONS, { type: 'automation/updateRequested', resource: entry.resource, changes: definition } as StateAction);
      scena.surfaces.close(`automation:edit:${host}:${entry.resource}`);
      void scena.commands.execute('ahp.openAutomation', { host, resource: entry.resource });
    }
  };

  return (
    <div className="web-page web-form">
      <Text variant="h2" text={entry === undefined ? t('automations/commands/new') : entry.definition.title === '' ? t('automations/commands/edit') : t('automations/editTitle', { title: entry.definition.title })} />

      {resource === undefined && embedMode() === 'multi' ? (
        <Field label={t('automations/edit/host')}>
          <select className="web-field" value={host} onChange={(event) => { setPicked(event.target.value); writeLastHost(event.target.value); setDraft(null); }}>
            {(hostList ?? []).map((one) => <option key={one.id} value={one.id}>{one.name}</option>)}
          </select>
        </Field>
      ) : null}

      {entry === undefined ? (
        <ExamplesButton
          dirty={shown.title.trim() !== '' || shown.message.trim() !== '' || shown.expression.trim() !== ''}
          onPick={(template) => set({ title: template.title, message: template.prompt, expression: template.expression })}
        />
      ) : null}

      <Field label={t('automations/edit/title')}>
        <input className="web-field" value={shown.title} onChange={(event) => set({ title: event.target.value })} />
      </Field>

      <Field label={t('automations/edit/message')} hint={t('automations/edit/messageHint')}>
        <textarea className="web-field web-form__message" rows={5} value={shown.message} onChange={(event) => set({ message: event.target.value })} />
      </Field>

      <div className="web-form__row">
        <Field label={t('automations/edit/agent')}>
          <AgentField host={host} agents={agents} value={shown.provider} onChange={(provider) => set({ provider, model: '' })} />
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
          <input className="web-field" type="number" min={1} step={1} value={shown.afterRuns} onChange={(event) => set({ afterRuns: event.target.value })} />
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
        <Button label={t('automations/edit/cancel')} onClick={() => scena.surfaces.close(entry === undefined ? 'automation:new' : `automation:edit:${host}:${entry.resource}`)} />
      </div>
    </div>
  );
}
