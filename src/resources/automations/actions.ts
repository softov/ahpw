import { translate } from '@softov/scena';
import type { PickerAction } from '@softov/scena/types';
import type { AutomationEntry, StateAction } from '@microsoft/agent-host-protocol';
import { AUTOMATIONS, hostBridge } from '../../bridges/data.js';
import { newId } from '../../bridges/words.js';
import { titleOf } from './words.js';
import { confirm, failed } from '../../shell/notify/index.js';

/** Run an automation now, outside its schedule. */
export function runNow(host: string, entry: AutomationEntry): Promise<unknown> {
  return hostBridge(host).request('runAutomation', { channel: AUTOMATIONS, automation: entry.resource, requestId: `manual-${newId()}` } as never);
}

/** Turn an automation on or off. */
export function setEnabled(host: string, entry: AutomationEntry, enabled: boolean): void {
  hostBridge(host).dispatch(AUTOMATIONS, { type: 'automation/updateRequested', resource: entry.resource, changes: { enabled } } as StateAction);
}

/** Delete an automation, once a person has said yes. */
export async function remove(host: string, entry: AutomationEntry): Promise<void> {
  if (!(await confirm({ title: translate('automations/actions/deleteTitle', { title: titleOf(entry) }), body: translate('automations/actions/deleteBody'), confirmLabel: translate('automations/actions/delete'), tone: 'danger' }))) return;
  hostBridge(host).dispatch(AUTOMATIONS, { type: 'automation/removed', resource: entry.resource } as StateAction);
}

/** Ask a running run to stop. */
export function cancelRun(host: string, run: string): void {
  hostBridge(host).dispatch(run, { type: 'automationRun/cancelRequested' } as StateAction);
}

const say = (error: unknown): void => failed(translate('automations/actions/couldNotRun'), error);

/** What an automation's menu offers, as far as the host allows. */
export function menuOf(host: string, entry: AutomationEntry, open: () => void, edit: () => void): PickerAction[] {
  const can = (operation: string): boolean => entry.operations.map(String).includes(operation);
  const items: PickerAction[] = [{ title: translate('automations/actions/open'), onSelect: (menu) => { menu.closeMenu(); open(); } }];
  if (can('run')) items.push({ title: translate('automations/actions/runNow'), onSelect: (menu) => { menu.closeMenu(); void runNow(host, entry).catch(say); } });
  if (can('update')) {
    items.push({ title: translate(entry.definition.enabled ? 'automations/actions/turnOff' : 'automations/actions/turnOn'), onSelect: (menu) => { menu.closeMenu(); setEnabled(host, entry, !entry.definition.enabled); } });
    items.push({ title: translate('automations/actions/edit'), onSelect: (menu) => { menu.closeMenu(); edit(); } });
  }
  items.push({ title: translate('automations/actions/copyLink'), group: 'more', onSelect: (menu) => { menu.closeMenu(); void navigator.clipboard?.writeText(entry.resource).catch(() => undefined); } });
  if (can('remove')) items.push({ title: translate('automations/actions/delete'), group: 'more', color: 'red', onSelect: (menu) => { menu.closeMenu(); void remove(host, entry); } });
  return items;
}
