import { useMemo, type ReactElement } from 'react';
import { useStore } from '@softov/scena/react';
import { chatReducer, sessionReducer, type ChatState, type SessionState, type SessionSummary } from '@microsoft/agent-host-protocol';
import { AHP_SESSIONS } from '../connection/data.js';
import { useChannel } from '../connection/channel.js';
import { elapsed, folderLabel } from '../connection/words.js';
import { ACTIVE_SESSION } from './state.js';
import { tokens, totalsOf, when } from './turn.js';

/** The open session's facts, for the right sidebar. */
export default function SessionDetails(): ReactElement {
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
  const facts: [string, ReactElement | string][] = [['Session', summary.title === '' ? 'Untitled' : summary.title], ['Agent', summary.provider]];
  if (totals.models.length > 0) facts.push(['Model', totals.models.join(', ')]);
  if (folder !== undefined) facts.push(['Folder', <code key="f">{folderLabel(folder)}</code>]);
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
