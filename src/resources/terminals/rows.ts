import { translate } from '@softov/scena';
import type { PickerAction, Scena } from '@softov/scena/types';
import type { TerminalInfo } from '@microsoft/agent-host-protocol';
import { ahpPaths, type HostFacts } from '../../bridges/data.js';
import { everyHost, hostNameOf } from '../../bridges/hosts.js';
import { embedMode } from '../../shell/embed/index.js';
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

/** Every host's terminals as palette rows, filtered by `query`. Selecting one opens it in the bottom panel. */
export function terminalItems(scena: Scena, query: string): PickerAction[] {
  const words = query.trim().toLowerCase();
  const multi = embedMode() === 'multi';
  return everyHost(scena.store).flatMap((id) => terminalItemsOf(scena, id, words, multi));
}

function terminalItemsOf(scena: Scena, id: string, words: string, multi: boolean): PickerAction[] {
  const host = scena.store.get<HostFacts | null>(ahpPaths(id).host);
  return (host?.terminals ?? [])
    // Found by its shown title, and by the English word as well.
    .filter((info) => words === '' || `terminal ${translate('terminals/rows/title', { title: terminalTitle(info) })}`.toLowerCase().includes(words))
    .map((info) => ({
      title: translate('terminals/rows/title', { title: terminalTitle(info) }),
      // With every host, each row says its host first.
      description: [multi ? hostNameOf(scena.store, id) : undefined, terminalDetail(info, host?.clientId ?? null)].filter((bit) => bit !== undefined).join(' \u{00B7} '),
      icon: TERMINAL_ICON,
      group: translate('terminals/rows/group'),
      onSelect: (menu) => {
        menu.closeMenu();
        void scena.commands.execute('ahp.openTerminal', { host: id, uri: info.resource });
      },
    }));
}
