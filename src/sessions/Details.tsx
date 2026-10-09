import { useMemo, type ReactElement } from 'react';
import type { TerminalState } from '@microsoft/agent-host-protocol';
import { useScena, useStore } from '@softov/scena/react';
import { chatReducer, sessionReducer, type ChatState, type SessionState, type SessionSummary } from '@microsoft/agent-host-protocol';
import { AHP_HOST, AHP_SESSIONS, type HostFacts } from '../connection/data.js';
import { useChannel } from '../connection/channel.js';
import { elapsed, folderLabel } from '../connection/words.js';
import { ACTIVE_SESSION } from './state.js';
import { foldTerminal, inFolder } from '../terminals/terminal.js';
import { tokens, totalsOf, when } from './turn.js';

/** A terminal, as a link that opens it, while its directory is in the session's folder. */
function FolderTerminal({ uri, folder }: { uri: string; folder: string }): ReactElement | null {
  const scena = useScena();
  const { state } = useChannel<TerminalState>(uri, foldTerminal);
  if (!inFolder(state?.cwd, folder)) return null;
  return (
    <button type="button" className="web-link" title="Open the terminal" onClick={() => void scena.commands.execute('ahp.openTerminal', { uri })}>
      {state?.title === '' || state?.title === undefined ? 'Terminal' : state.title}
    </button>
  );
}

/** The open session's facts, for the right sidebar. */
export default function SessionDetails(): ReactElement {
  const scena = useScena();
  const host = useStore<HostFacts | null>(AHP_HOST);
  const resource = useStore<string>(ACTIVE_SESSION);
  const sessions = useStore<SessionSummary[]>(AHP_SESSIONS);
  const summary = sessions?.find((one) => one.resource === resource);
  const session = useChannel<SessionState>(summary === undefined ? undefined : resource, sessionReducer);
  const chat = useChannel<ChatState>(session.state?.defaultChat ?? summary?.defaultChat, chatReducer);
  const turns = chat.state?.turns;
  const totals = useMemo(() => totalsOf(turns ?? []), [turns]);
  if (summary === undefined) return <p className="web-note web-details__empty">Open a session to see its details.</p>;

  const folder = summary.workingDirectories?.[0];
  const changes = summary.changes;
  const origin = summary.origin;
  const watching = session.state?.activeClients.length ?? 0;
  const chatUri = session.state?.defaultChat ?? summary.defaultChat;
  const facts: [string, ReactElement | string][] = [['Session', summary.title === '' ? 'Untitled' : summary.title], ['Session id', <code key="s">{summary.resource}</code>]];
  if (chatUri !== undefined) facts.push(['Chat id', <code key="h">{chatUri}</code>]);
  facts.push(['Agent', summary.provider]);
  if (totals.models.length > 0) facts.push(['Model', totals.models.join(', ')]);
  if (folder !== undefined) {
    facts.push(['Folder', (
      <button key="f" type="button" className="web-link" title="Show the folder in the explorer" onClick={() => void scena.commands.execute('ahp.revealFolder', { uri: folder })}>
        <code>{folderLabel(folder)}</code>
      </button>
    )]);
  }
  facts.push(['Terminal', (
    <span key="t" className="web-details__list">
      {folder === undefined ? null : (host?.terminals ?? []).map((terminal) => <FolderTerminal key={terminal.resource} uri={terminal.resource} folder={folder} />)}
      <button type="button" className="web-link" title={folder === undefined ? 'A new terminal' : 'A new terminal in the session\'s folder'} onClick={() => void scena.commands.execute('ahp.newTerminal', folder === undefined ? undefined : { cwd: folder })}>
        + New terminal
      </button>
    </span>
  )]);
  if (summary.project !== undefined) facts.push(['Project', summary.project.displayName]);
  facts.push(['Started', when(summary.createdAt)], ['Changed', when(summary.modifiedAt)]);
  if (totals.turns > 0) {
    facts.push(['Turns', `${totals.turns}${chat.state?.turnsNextCursor === undefined ? '' : '+'}`]);
    facts.push(['Working', elapsed(totals.working)]);
    facts.push(['Tokens', `\u{2191}${tokens(totals.input)} \u{2193}${tokens(totals.output)}`]);
    if (totals.tools > 0) facts.push(['Tool calls', String(totals.tools)]);
  }
  if (changes !== undefined && (changes.additions !== undefined || changes.deletions !== undefined)) {
    facts.push(['Changes', (
      <span key="c">
        <span className="web-diff--add">+{changes.additions ?? 0}</span>{' '}
        <span className="web-diff--remove">-{changes.deletions ?? 0}</span>
        {changes.files === undefined ? '' : ` in ${changes.files} files`}
      </span>
    )]);
  }
  if (origin !== undefined && String(origin.kind) === 'automation') facts.push(['From', 'An automation run']);
  if (watching > 0) facts.push(['Watching', String(watching)]);
  return (
    <dl className="web-details">
      {facts.map(([name, value]) => (
        <div key={name}>
          <dt>{name}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}
