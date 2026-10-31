import { useEffect, useState, type MouseEvent, type ReactElement } from 'react';
import { useI18n, useScena, useStore } from '@softov/scena/react';
import { ContextMenu } from '@softov/scena/ui';
import type { PickerAction } from '@softov/scena/types';
import type { ChatState, SessionState, SessionSummary, TerminalState } from '@microsoft/agent-host-protocol';
import { ahpPaths, hostBridge, type HostFacts } from '../../bridges/data.js';
import { plural } from '../../i18n/locales.js';
import { EMOJIcon } from '../emojis.js';
import { inFolder } from '../terminals/terminal.js';
import type { BotMark } from '../bots/chat/mark.js';
import { viewEntries } from '../../shell/right-sidebar.js';
import { claimedTerminals, subagentChats, subagentsOf } from './header.js';

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
 * changed files, terminals, the subagents (one per chat its calls hand work
 * to, each opened from its menu), the session's own chats, a way back from a
 * subagent's chat, and a menu: the views that show the session, a new
 * terminal in its folder, the bot a chat is with, and how the chat reads:
 * the Raw view, and the calls hidden. Each of those, while on, shows
 * its icon, which turns it off.
 */
export function SessionHeaderTools({ host, summary, session, chat, chatUri, onChat, onSubagent, raw, onRaw, calls, bot }: {
  host: string;
  summary: SessionSummary;
  session: SessionState | undefined;
  chat: ChatState | undefined;
  chatUri: string | undefined;
  onChat: (uri: string) => void;
  /** Opens a subagent's chat: here when it is this session's, else its own session. */
  onSubagent: (chat: string) => void;
  raw: boolean;
  onRaw: (on: boolean) => void;
  /** Whether the chat hides its calls, on a page that draws them. */
  calls?: { hidden: boolean; onHidden: (hidden: boolean) => void };
  /** The bot the session is a chat with. */
  bot?: BotMark;
}): ReactElement {
  const scena = useScena();
  const { t } = useI18n();
  const [menu, setMenu] = useState<{ x: number; y: number; items: PickerAction[] } | null>(null);
  const changes = summary.changes;
  const folder = summary.workingDirectories?.[0];
  const terminals = useSessionTerminals(host, summary.resource, folder);
  const chats = session?.chats ?? [];
  const subagents = subagentsOf(chat?.turns ?? [], chat?.activeTurn, chats);
  const running = subagents.filter((one) => one.running).length;
  // The switcher counts the session's own chats; a subagent's chat is reached from its button.
  const spawned = subagentChats(chats);
  const own = chats.filter((one) => !spawned.includes(one));
  const ownAt = own.findIndex((one) => one.resource === chatUri);
  const inSubagent = spawned.some((one) => one.resource === chatUri);
  const run = (command: string, args?: unknown): void => { void scena.commands.execute(command, args); };

  /** A menu under the button that clicked it. */
  const show = (event: MouseEvent<HTMLButtonElement>, items: PickerAction[]): void => {
    const box = event.currentTarget.getBoundingClientRect();
    setMenu({ x: box.left, y: box.bottom, items });
  };
  const ownMenu = (event: MouseEvent<HTMLButtonElement>): void => show(event, own.map((one, at) => ({
    title: one.title === '' ? t('sessions/header/chatN', { n: at + 1 }) : one.title,
    active: one.resource === chatUri,
    onSelect: (picked) => { picked.closeMenu(); onChat(one.resource); },
  })));
  const subagentMenu = (event: MouseEvent<HTMLButtonElement>): void => show(event, subagents.map((one, at) => ({
    title: one.title === '' ? t('sessions/header/subagentN', { n: at + 1 }) : one.title,
    ...(one.running ? { description: t('sessions/header/subagentRunning') } : {}),
    active: one.chat === chatUri,
    onSelect: (picked) => { picked.closeMenu(); onSubagent(one.chat); },
  })));
  const views = t('sessions/header/views');
  const reads = t('sessions/header/reads');
  const viewMenu = (event: MouseEvent<HTMLButtonElement>): void => show(event, [
    ...viewEntries(scena).map((one): PickerAction => ({ title: one.title, icon: one.icon, group: views, onSelect: (picked) => { picked.closeMenu(); run(`ahp.view.${one.key}`); } })),
    ...(folder === undefined ? [] : [{ title: t('sessions/header/newTerminal'), icon: EMOJIcon.terminal, group: views, onSelect: (picked) => { picked.closeMenu(); run('ahp.newTerminal', { host, cwd: folder }); } } satisfies PickerAction]),
    ...(bot === undefined ? [] : [{ title: t('bots/commands/open'), icon: EMOJIcon.bots, group: reads, onSelect: (picked) => { picked.closeMenu(); run('ahp.openBot', { host, slug: bot.bot, name: bot.name }); } } satisfies PickerAction]),
    { title: t('sessions/raw/button'), icon: EMOJIcon.data, group: reads, active: raw, onSelect: () => onRaw(!raw) },
    ...(calls === undefined ? [] : [{ title: t('sessions/header/hideCalls'), icon: EMOJIcon.callsHidden, group: reads, active: calls.hidden, onSelect: () => calls.onHidden(!calls.hidden) }]),
  ]);

  return (
    <div className="web-chat__tools">
      {changes?.files === undefined || changes.files === 0 ? null : (
        <button type="button" className="web-chat__tool" title={plural('sessions/header/files', changes.files)} onClick={() => run('ahp.showRight.changes:explorer')}>
          <span>{`${EMOJIcon.file} ${String(changes.files)}`}</span>
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
      {subagents.length === 0 ? null : (
        <button
          type="button"
          className="web-chat__tool"
          data-live={running > 0 ? 'true' : undefined}
          data-on={inSubagent ? 'true' : undefined}
          title={running > 0 ? t('sessions/header/subagentsRunning', { running, total: subagents.length }) : plural('sessions/header/subagents', subagents.length)}
          aria-haspopup="menu"
          onClick={subagentMenu}
        >
          {`${EMOJIcon.subagent} ${running > 0 ? `${String(running)}/${String(subagents.length)}` : String(subagents.length)}`}
        </button>
      )}
      {inSubagent && own[0] !== undefined ? (
        <button type="button" className="web-chat__tool" title={t('sessions/header/backToChat')} onClick={() => onChat(session?.defaultChat ?? own[0]!.resource)}>
          {'\u{21A9}'}
        </button>
      ) : null}
      {own.length < 2 ? null : (
        <button type="button" className="web-chat__tool" title={t('sessions/header/chats')} aria-haspopup="menu" onClick={ownMenu}>
          {`${ownAt < 0 ? '\u{2013}' : String(ownAt + 1)}/${String(own.length)} \u{25BE}`}
        </button>
      )}
      {calls?.hidden === true ? (
        <button type="button" className="web-chat__tool" data-on="true" title={t('sessions/header/showCalls')} onClick={() => calls.onHidden(false)}>
          {EMOJIcon.callsHidden}
        </button>
      ) : null}
      {raw ? (
        <button type="button" className="web-chat__tool" data-on="true" title={t('sessions/raw/back')} onClick={() => onRaw(false)}>
          {EMOJIcon.data}
        </button>
      ) : null}
      <button type="button" className="web-chat__tool" title={t('sessions/header/view')} aria-haspopup="menu" onClick={viewMenu}>
        {EMOJIcon.more}
      </button>
      {menu === null ? null : <ContextMenu spec={{ items: menu.items }} x={menu.x} y={menu.y} onClose={() => setMenu(null)} />}
    </div>
  );
}
