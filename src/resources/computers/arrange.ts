import { translate } from '@softov/scena';
import type { Group } from '../sessions/grouping.js';
import type { Standing } from './machines.js';

/** What the computers list is grouped by and filtered to, as ahpapp's list offers. */
export type ComputerGroup = 'none' | 'host' | 'state';
export type ComputerFilter = 'all' | Standing;

export const COMPUTER_GROUPS: readonly ComputerGroup[] = ['none', 'host', 'state'];
export const COMPUTER_FILTERS: readonly ComputerFilter[] = ['all', 'running', 'stopped', 'problem'];

/** One computer as the list arranges it. */
export interface ComputerItem {
  host: string;
  hostName: string;
  standing: Standing;
}

/** The state groups, in the order a person reads them: problems first, then what runs. */
const STATE_ORDER: readonly Standing[] = ['problem', 'running', 'stopped'];

/** The group of one computer, or undefined when the list is not grouped. */
export function groupOf(item: ComputerItem, by: ComputerGroup): Group | undefined {
  switch (by) {
    case 'none':
      return undefined;
    case 'host':
      return { key: item.host, label: item.hostName };
    case 'state':
      return { key: item.standing, label: translate(`computers/standing/${item.standing}`), rank: STATE_ORDER.indexOf(item.standing) };
  }
}

export const keeps = (item: ComputerItem, filter: ComputerFilter): boolean => filter === 'all' || item.standing === filter;

/** Where each choice is kept, per browser. */
export const CHOICE_KEYS = { group: 'ahpd-web.computer-group', filter: 'ahpd-web.computer-filter' } as const;
