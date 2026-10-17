import { useEffect, useState, type MouseEvent, type ReactElement } from 'react';
import { useI18n, useScena, useStore } from '@softov/scena/react';
import { ContextMenu } from '@softov/scena/ui';
import type { PickerAction } from '@softov/scena/types';
import type { ChatState, SessionState, SessionSummary, TerminalState } from '@microsoft/agent-host-protocol';
import { ahpPaths, hostBridge, type HostFacts } from '../../bridges/data.js';
import { plural } from '../../i18n/locales.js';
import { EMOJIcon } from '../emojis.js';
import { inFolder } from '../terminals/terminal.js';
import { claimedTerminals, subagentsOf } from './header.js';
import type { RawFilter } from './raw.js';

/**
 * The session's terminals: the ones it holds by claim, and the others whose
 * directory is in its folder, which is how a terminal opened from ahpw for the
 * session is found. The directories are read once per change of the list.
 */
function useSessionTerminals(host: string, session: string, folder: string | undefined): string[] {
  const facts = useStore<HostFacts | null>(ahpPaths(host).host);
  const terminals = facts?.terminals ?? [];
  const claimed = claimedTerminals(terminals, session);
  const others = terminals.map((info) => info.resource).filter((uri) => !claimed.includes(uri));
  const othersKey = others.join('\n');
  const [inside, setInside] = useState<string[]>([]);
  useEffect(() => {
    if (folder === undefined || others.length === 0) {
      setInside([]);
      return undefined;
    }
    let live = true;
    void Promise.all(others.map((uri) => hostBridge(host).readOnce<TerminalState>(uri)
      .then((state) => (inFolder(state?.cwd, folder) ? uri : null), () => null)))
      .then((found) => { if (live) setInside(found.filter((uri): uri is string => uri !== null)); });
    return () => { live = false; };
  // `others` is read through its key, so a list of the same terminals does not read them again.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [host, othersKey, folder]);
  return [...claimed, ...inside];
}

/**
 * The header's buttons, each shown only when it has something to count:
 * changed files, terminals, subagents and the session's chats, and the Raw
 * view's toggle.
 */
export function SessionHeaderTools({ host, summary, session, chat, chatUri, onChat, raw, onRaw }: {
  host: string;
  summary: SessionSummary;
  session: SessionState | undefined;
  chat: ChatState | undefined;
  chatUri: string | undefined;
  onChat: (uri: string) => void;
  raw: boolean;
  onRaw: (on: boolean, filter?: RawFilter) => void;
}): ReactElement {
  const scena = useScena();
  const { t } = useI18n();
  const [menu, setMenu] = useState<{ x: number; y: number; items: PickerAction[] } | null>(null);
  const changes = summary.changes;
  const terminals = useSessionTerminals(host, summary.resource, summary.workingDirectories?.[0]);
  const subagents = subagentsOf(chat?.turns ?? [], chat?.activeTurn);
  const chats = session?.chats ?? [];
  const chatAt = chats.findIndex((one) => one.resource === chatUri);
  const run = (command: string, args?: unknown): void => { void scena.commands.execute(command, args); };

  const pickChat = (event: MouseEvent<HTMLButtonElement>): void => {
    const box = event.currentTarget.getBoundingClientRect();
    setMenu({
      x: box.left,
      y: box.bottom,
      items: chats.map((one, at) => ({
        title: one.title === '' ? t('sessions/header/chatN', { n: at + 1 }) : one.title,
        active: one.resource === chatUri,
        onSelect: (picked) => { picked.closeMenu(); onChat(one.resource); },
      })),
    });
  };

  return (
    <div className="web-chat__tools">
      {changes?.files === undefined || changes.files === 0 ? null : (
        <button type="button" className="web-chat__tool" title={plural('sessions/header/files', changes.files)} onClick={() => run('ahp.showRight.changes:explorer')}>
          <span className="web-diff--add">+{changes.additions ?? 0}</span>
          <span className="web-diff--remove">{'\u{2212}'}{changes.deletions ?? 0}</span>
        </button>
      )}
      {terminals.length === 0 ? null : (
        <button
          type="button"
          className="web-chat__tool"
          title={plural('sessions/header/terminals', terminals.length)}
          onClick={() => (terminals.length === 1 ? run('ahp.openTerminal', { uri: terminals[0] }) : run('ahp.showRight.session:details'))}
        >
          {`${EMOJIcon.terminal} ${String(terminals.length)}`}
        </button>
      )}
      {subagents.total === 0 ? null : (
        <button
          type="button"
          className="web-chat__tool"
          data-live={subagents.running > 0 ? 'true' : undefined}
          title={subagents.running > 0 ? t('sessions/header/subagentsRunning', { running: subagents.running, total: subagents.total }) : plural('sessions/header/subagents', subagents.total)}
          onClick={() => onRaw(true, 'subagents')}
        >
          {`${EMOJIcon.subagent} ${subagents.running > 0 ? `${String(subagents.running)}/${String(subagents.total)}` : String(subagents.total)}`}
        </button>
      )}
      {chats.length < 2 ? null : (
        <button type="button" className="web-chat__tool" title={t('sessions/header/chats')} aria-haspopup="menu" onClick={pickChat}>
          {`${String(chatAt + 1)}/${String(chats.length)} \u{25BE}`}
        </button>
      )}
      <button type="button" className="web-chat__tool" aria-pressed={raw} data-on={raw ? 'true' : undefined} title={t(raw ? 'sessions/raw/back' : 'sessions/raw/open')} onClick={() => onRaw(!raw)}>
        {t('sessions/raw/button')}
      </button>
      {menu === null ? null : <ContextMenu spec={{ items: menu.items }} x={menu.x} y={menu.y} onClose={() => setMenu(null)} />}
    </div>
  );
}
