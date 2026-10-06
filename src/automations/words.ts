import type { AutomationEntry, AutomationTrigger } from '@microsoft/agent-host-protocol';

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
