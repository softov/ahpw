import { translate } from '@softov/scena';
import type { PickerAction, Scena } from '@softov/scena/types';
import type { TerminalInfo } from '@microsoft/agent-host-protocol';
import { AHP_HOST, type HostFacts } from '../../bridges/data.js';
import { exitCodeOf, hasExited, holderOf, terminalTitle } from './terminal.js';
import { EMOJIcon } from '../emojis.js';

/** The icon terminals show on their tabs and rows. */
export const TERMINAL_ICON = EMOJIcon.terminal;

/** Who holds a terminal, in words. */
export function holderText(info: TerminalInfo, clientId: string | null): string {
  const holder = holderOf(info.claim, clientId);
  if (holder.kind === 'you') return translate('terminals/holder/you');
  if (holder.kind === 'session') return translate('terminals/holder/session');
  return translate('terminals/holder/another');
}

/** A terminal row's second line: who holds it, and how it ended. */
export function terminalDetail(info: TerminalInfo, clientId: string | null): string {
  if (!hasExited(info)) return holderText(info, clientId);
  const code = exitCodeOf(info);
  const holder = holderText(info, clientId);
  return code === null ? translate('terminals/exited', { holder }) : translate('terminals/exitedWith', { holder, code });
}

/** The host's terminals as palette rows, filtered by `query`. Selecting one opens it in the bottom panel. */
export function terminalItems(scena: Scena, query: string): PickerAction[] {
  const host = scena.store.get<HostFacts | null>(AHP_HOST);
  const words = query.trim().toLowerCase();
  return (host?.terminals ?? [])
    // Found by its shown title, and by the English word as well.
    .filter((info) => words === '' || `terminal ${translate('terminals/rows/title', { title: terminalTitle(info) })}`.toLowerCase().includes(words))
    .map((info) => ({
      title: translate('terminals/rows/title', { title: terminalTitle(info) }),
      description: terminalDetail(info, host?.clientId ?? null),
      icon: TERMINAL_ICON,
      group: translate('terminals/rows/group'),
      onSelect: (menu) => {
        menu.closeMenu();
        void scena.commands.execute('ahp.openTerminal', { uri: info.resource });
      },
    }));
}
