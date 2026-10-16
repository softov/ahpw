import { translate } from '@softov/scena';
import type { PickerAction } from '@softov/scena/types';
import { allows, type Offers } from '../../bridges/offers.js';
import { confirm, failed } from '../../shell/notify/index.js';
import { actOn, COMPUTER_PROVIDER, type ComputerAction, type Standing } from './machines.js';

const say = (error: unknown): void => failed(translate('computers/actions/failed'), error);

/** Starts, stops or restarts a computer, or removes it once a person has said yes; a refusal shows as a notice. */
export async function act(host: string, offers: Offers, id: string, action: ComputerAction): Promise<void> {
  if (action === 'remove' && !(await confirm({
    title: translate('computers/actions/removeTitle', { name: id }),
    body: translate('computers/actions/removeBody'),
    confirmLabel: translate('computers/actions/remove'),
    tone: 'danger',
  }))) return;
  await actOn(host, offers, id, action).catch(say);
}

/** Whether the host lets this client write or delete its computers. */
export function may(offers: Offers, operation: 'write' | 'delete'): boolean {
  const provider = offers.providers[COMPUTER_PROVIDER];
  return provider !== undefined && allows(provider, operation);
}

/** What a computer's menu offers, as far as the host lets this client write or delete. */
export function menuOf(host: string, offers: Offers, id: string, standing: Standing, controlled: boolean, open: () => void): PickerAction[] {
  const item = (title: string, run: () => void, extra: Partial<PickerAction> = {}): PickerAction => ({ title, onSelect: (menu) => { menu.closeMenu(); run(); }, ...extra });
  const items: PickerAction[] = [item(translate('computers/actions/open'), open)];
  if (controlled && may(offers, 'write')) {
    items.push(standing === 'running'
      ? item(translate('computers/actions/stop'), () => void act(host, offers, id, 'stop'))
      : item(translate('computers/actions/start'), () => void act(host, offers, id, 'start')));
    if (standing === 'running') items.push(item(translate('computers/actions/restart'), () => void act(host, offers, id, 'restart')));
  }
  items.push(item(translate('computers/actions/copyName'), () => void navigator.clipboard?.writeText(id).catch(() => undefined), { group: 'more' }));
  if (controlled && may(offers, 'delete')) items.push(item(translate('computers/actions/remove'), () => void act(host, offers, id, 'remove'), { group: 'more', color: 'red' }));
  return items;
}
