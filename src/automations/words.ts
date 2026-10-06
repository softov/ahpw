import type { AutomationDefinition, AutomationEntry, AutomationRunSummary, AutomationScheduleTrigger, AutomationTrigger } from '@microsoft/agent-host-protocol';
import { folderLabel, folderUri } from '../connection/words.js';

const when = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' });

/** An ISO time as a person reads it, or the text as given. */
export function timeOf(iso: string | undefined): string {
  if (iso === undefined) return '';
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? iso : when.format(date);
}

/** One trigger, in a line: a schedule's expression and zone, or an event's title. */
export function triggerLine(trigger: AutomationTrigger): string {
  if ('schedule' in trigger) return `${trigger.schedule.expression} (${trigger.schedule.timeZone})`;
  return trigger.title;
}

/** An automation's title, or a stand-in when it has none. */
export const titleOf = (entry: AutomationEntry): string => (entry.definition.title === '' ? 'Untitled' : entry.definition.title);

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const pad = (value: string): string => value.padStart(2, '0');

/** A cron expression in words when it is one of the common shapes, or the expression as given. */
export function cronWords(expression: string): string {
  const parts = expression.trim().split(/\s+/);
  if (parts.length !== 5) return expression;
  const [minute, hour, day, month, week] = parts as [string, string, string, string, string];
  const every = /^\*\/(\d+)$/;
  if (day === '*' && month === '*' && week === '*') {
    if (hour === '*' && every.test(minute)) return `Every ${every.exec(minute)![1]} minutes`;
    if (hour === '*' && minute === '*') return 'Every minute';
    if (/^\d+$/.test(minute) && every.test(hour)) return `Every ${every.exec(hour)![1]} hours`;
    if (/^\d+$/.test(minute) && hour === '*') return `Every hour at :${pad(minute)}`;
    if (/^\d+$/.test(minute) && /^\d+$/.test(hour)) return `Every day at ${pad(hour)}:${pad(minute)}`;
  }
  if (day === '*' && month === '*' && /^\d$/.test(week) && /^\d+$/.test(minute) && /^\d+$/.test(hour)) {
    return `Every ${DAYS[Number(week) % 7]} at ${pad(hour)}:${pad(minute)}`;
  }
  if (day === '*' && month === '*' && week === '1-5' && /^\d+$/.test(minute) && /^\d+$/.test(hour)) {
    return `Weekdays at ${pad(hour)}:${pad(minute)}`;
  }
  return expression;
}

/** An automation's triggers in one line: its schedules in words, its events by title, or by hand. */
export function whenLine(entry: AutomationEntry): string {
  const triggers = entry.definition.triggers;
  if (triggers.length === 0) return 'Run by hand';
  return triggers.map((trigger) => ('schedule' in trigger ? cronWords(trigger.schedule.expression) : trigger.title)).join(', ');
}

/** A run's state, start and end, read off whichever lifecycle it is in. */
export interface RunFacts {
  status: string;
  at: string;
  took?: number;
  error?: string;
  input?: number;
  output?: number;
}

export function runFacts(run: AutomationRunSummary): RunFacts {
  const life = run.lifecycle as { status: string; createdAt: string; startedAt?: string; completedAt?: string; error?: { message: string }; usage?: { inputTokens?: number; outputTokens?: number } };
  const start = Date.parse(life.startedAt ?? life.createdAt);
  const end = life.completedAt === undefined ? Number.NaN : Date.parse(life.completedAt);
  return {
    status: String(life.status),
    at: life.startedAt ?? life.createdAt,
    ...(Number.isNaN(start) || Number.isNaN(end) ? {} : { took: Math.max(0, end - start) }),
    ...(life.error === undefined ? {} : { error: life.error.message }),
    ...(life.usage?.inputTokens === undefined ? {} : { input: life.usage.inputTokens }),
    ...(life.usage?.outputTokens === undefined ? {} : { output: life.usage.outputTokens }),
  };
}

/** The runs, newest first. */
export const runsByTime = (entry: AutomationEntry): AutomationRunSummary[] => [...entry.runs].sort((a, b) => runFacts(b).at.localeCompare(runFacts(a).at));

/** What an automation is doing, most urgent first. */
export type AutomationState = 'running' | 'failed' | 'on' | 'off';

export function stateOf(entry: AutomationEntry): AutomationState {
  const runs = runsByTime(entry);
  if (runs.some((run) => { const status = runFacts(run).status; return status === 'running' || status === 'pending'; })) return 'running';
  if (!entry.definition.enabled) return 'off';
  if (runs[0] !== undefined && runFacts(runs[0]).status === 'failed') return 'failed';
  return 'on';
}

/** What the form edits: the fields of a definition a person sets. */
export interface Draft {
  title: string;
  message: string;
  provider: string;
  model: string;
  folder: string;
  expression: string;
  timeZone: string;
  misfire: 'skip' | 'runOnce';
  enabled: boolean;
  afterRuns: string;
  afterDate: string;
}

/** The zone this browser is in, which is the one a person means by "9 in the morning". */
export const localZone = (): string => Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

/** A draft from an automation, or an empty one for a new automation. */
export function draftOf(entry: AutomationEntry | undefined, defaults: { provider?: string; folder?: string } = {}): Draft {
  const definition = entry?.definition;
  const schedule = definition?.triggers.find((trigger) => 'schedule' in trigger) as AutomationScheduleTrigger | undefined;
  const conditions = definition?.disableConditions ?? [];
  const afterRuns = conditions.find((one) => 'max' in one) as { max: number } | undefined;
  const afterDate = conditions.find((one) => 'date' in one) as { date: string } | undefined;
  return {
    title: definition?.title ?? '',
    message: definition?.message.text ?? '',
    provider: definition?.session.provider ?? defaults.provider ?? '',
    model: definition?.session.model?.id ?? '',
    folder: definition?.session.workingDirectories?.[0] === undefined ? defaults.folder ?? '' : folderLabel(definition.session.workingDirectories[0]),
    expression: schedule?.schedule.expression ?? '',
    timeZone: schedule?.schedule.timeZone ?? localZone(),
    misfire: String(schedule?.misfirePolicy ?? 'skip') === 'runOnce' ? 'runOnce' : 'skip',
    enabled: definition?.enabled ?? true,
    afterRuns: afterRuns === undefined ? '' : String(afterRuns.max),
    afterDate: afterDate === undefined ? '' : afterDate.date.slice(0, 10),
  };
}

/** Why a draft cannot be saved, or nothing when it can. */
export function draftProblem(draft: Draft): string | undefined {
  if (draft.title.trim() === '') return 'Give it a title.';
  if (draft.message.trim() === '') return 'Say what it sends.';
  if (draft.expression.trim() !== '' && draft.expression.trim().split(/\s+/).length !== 5) return 'A schedule is five fields: minute, hour, day, month, weekday.';
  if (draft.afterRuns.trim() !== '' && !/^[1-9]\d*$/.test(draft.afterRuns.trim())) return 'Stop after a whole number of runs.';
  return undefined;
}

/** The definition a draft describes. Event triggers the form does not edit are kept from `kept`. */
export function definitionOf(draft: Draft, kept?: AutomationDefinition): AutomationDefinition {
  const events = (kept?.triggers ?? []).filter((trigger) => !('schedule' in trigger));
  const expression = draft.expression.trim();
  const conditions = [
    ...(draft.afterRuns.trim() === '' ? [] : [{ kind: 'afterRuns', max: Number(draft.afterRuns.trim()) }]),
    ...(draft.afterDate === '' ? [] : [{ kind: 'afterDate', date: new Date(`${draft.afterDate}T23:59:59`).toISOString() }]),
  ];
  // What the form owns is rebuilt from the draft, so clearing a field clears it; everything else is kept.
  const { disableConditions: _conditions, ...base } = kept ?? ({} as Partial<AutomationDefinition>);
  const { provider: _provider, model: _model, workingDirectories: _folders, ...session } = kept?.session ?? {};
  return {
    ...base,
    title: draft.title.trim(),
    message: { ...(kept?.message ?? {}), text: draft.message, origin: { kind: 'automation' } },
    session: {
      ...session,
      ...(draft.provider === '' ? {} : { provider: draft.provider }),
      ...(draft.model === '' ? {} : { model: { id: draft.model } }),
      ...(draft.folder.trim() === '' ? {} : { workingDirectories: [folderUri(draft.folder)] }),
    },
    enabled: draft.enabled,
    triggers: [
      ...(expression === '' ? [] : [{ id: 'schedule', kind: 'schedule', schedule: { expression, timeZone: draft.timeZone.trim() || 'UTC' }, misfirePolicy: draft.misfire }]),
      ...events,
    ],
    ...(conditions.length === 0 ? {} : { disableConditions: conditions }),
  } as AutomationDefinition;
}
