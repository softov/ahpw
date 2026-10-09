import type { PickerAction, Scena } from '@softov/scena/types';
import type { TerminalInfo } from '@microsoft/agent-host-protocol';
import { AHP_HOST, type HostFacts } from '../connection/data.js';
import { exitCodeOf, hasExited, holderOf, terminalTitle } from './terminal.js';
import { EMOJIcon } from '../emojis.js';

/** The icon terminals show on their tabs and rows. */
export const TERMINAL_ICON = EMOJIcon.terminal;

/** Who holds a terminal, in words. */
export function holderText(info: TerminalInfo, clientId: string | null): string {
  const holder = holderOf(info.claim, clientId);
  if (holder.kind === 'you') return 'Yours';
  if (holder.kind === 'session') return 'Held by a session';
  return 'Held by another client';
}

/** A terminal row's second line: who holds it, and how it ended. */
export function terminalDetail(info: TerminalInfo, clientId: string | null): string {
  if (!hasExited(info)) return holderText(info, clientId);
  const code = exitCodeOf(info);
  return `${holderText(info, clientId)}, exited${code === null ? '' : ` with ${code}`}`;
}

/** The host's terminals as palette rows, filtered by `query`. Selecting one opens it in the bottom panel. */
export function terminalItems(scena: Scena, query: string): PickerAction[] {
  const host = scena.store.get<HostFacts | null>(AHP_HOST);
  const words = query.trim().toLowerCase();
  return (host?.terminals ?? [])
    .filter((info) => words === '' || `terminal ${terminalTitle(info)}`.toLowerCase().includes(words))
    .map((info) => ({
      title: `Terminal: ${terminalTitle(info)}`,
      description: terminalDetail(info, host?.clientId ?? null),
      icon: TERMINAL_ICON,
      group: 'Terminals',
      onSelect: (menu) => {
        menu.closeMenu();
        void scena.commands.execute('ahp.openTerminal', { uri: info.resource });
      },
    }));
}
