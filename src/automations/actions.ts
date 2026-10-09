import type { PickerAction } from '@softov/scena/types';
import type { AutomationEntry, StateAction } from '@microsoft/agent-host-protocol';
import { AUTOMATIONS, dispatch, request } from '../connection/data.js';
import { newId } from '../connection/words.js';
import { titleOf } from './words.js';
import { confirm, failed } from '../notify/index.js';

/** Run an automation now, outside its schedule. */
export function runNow(entry: AutomationEntry): Promise<unknown> {
  return request('runAutomation', { channel: AUTOMATIONS, automation: entry.resource, requestId: `manual-${newId()}` } as never);
}

/** Turn an automation on or off. */
export function setEnabled(entry: AutomationEntry, enabled: boolean): void {
  dispatch(AUTOMATIONS, { type: 'automation/updateRequested', resource: entry.resource, changes: { enabled } } as StateAction);
}

/** Delete an automation, once a person has said yes. */
export async function remove(entry: AutomationEntry): Promise<void> {
  if (!(await confirm({ title: `Delete "${titleOf(entry)}"?`, body: 'Its run history goes with it.', confirmLabel: 'Delete', tone: 'danger' }))) return;
  dispatch(AUTOMATIONS, { type: 'automation/removed', resource: entry.resource } as StateAction);
}

/** Ask a running run to stop. */
export function cancelRun(run: string): void {
  dispatch(run, { type: 'automationRun/cancelRequested' } as StateAction);
}

const say = (error: unknown): void => failed('The automation could not run', error);

/** What an automation's menu offers, as far as the host allows. */
export function menuOf(entry: AutomationEntry, open: () => void, edit: () => void): PickerAction[] {
  const can = (operation: string): boolean => entry.operations.map(String).includes(operation);
  const items: PickerAction[] = [{ title: 'Open', onSelect: (host) => { host.closeMenu(); open(); } }];
  if (can('run')) items.push({ title: 'Run now', onSelect: (host) => { host.closeMenu(); void runNow(entry).catch(say); } });
  if (can('update')) {
    items.push({ title: entry.definition.enabled ? 'Turn off' : 'Turn on', onSelect: (host) => { host.closeMenu(); setEnabled(entry, !entry.definition.enabled); } });
    items.push({ title: 'Edit', onSelect: (host) => { host.closeMenu(); edit(); } });
  }
  items.push({ title: 'Copy link', group: 'more', onSelect: (host) => { host.closeMenu(); void navigator.clipboard?.writeText(entry.resource).catch(() => undefined); } });
  if (can('remove')) items.push({ title: 'Delete', group: 'more', color: 'red', onSelect: (host) => { host.closeMenu(); void remove(entry); } });
  return items;
}
