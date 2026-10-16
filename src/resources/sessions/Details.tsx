import { useMemo, type ReactElement } from 'react';
import type { TerminalState } from '@microsoft/agent-host-protocol';
import { useI18n, useScena, useStore } from '@softov/scena/react';
import { chatReducer, sessionReducer, type ChatState, type SessionState, type SessionSummary } from '@microsoft/agent-host-protocol';
import { ahpPaths, type HostFacts } from '../../bridges/data.js';
import { embedMode } from '../../shell/embed/index.js';
import { HostTag } from '../../shell/explorer/HostLines.js';
import { useChannel } from '../../bridges/channel.js';
import { elapsed, folderLabel } from '../../bridges/words.js';
import { plural } from '../../i18n/locales.js';
import { ACTIVE_SESSION, type ActiveSession } from './state.js';
import { foldTerminal, inFolder } from '../terminals/terminal.js';
import { tokens, totalsOf, when } from './turn.js';

/** A terminal, as a link that opens it, while its directory is in the session's folder. */
function FolderTerminal({ host, uri, folder }: { host: string; uri: string; folder: string }): ReactElement | null {
  const scena = useScena();
  const { t } = useI18n();
  const { state } = useChannel<TerminalState>(host, uri, foldTerminal);
  if (!inFolder(state?.cwd, folder)) return null;
  return (
    <button type="button" className="web-link" title={t('sessions/details/openTerminal')} onClick={() => void scena.commands.execute('ahp.openTerminal', { uri })}>
      {state?.title === '' || state?.title === undefined ? t('sessions/details/terminal') : state.title}
    </button>
  );
}

/** The open session's facts, for the right sidebar. */
export default function SessionDetails(): ReactElement {
  const scena = useScena();
  const { t } = useI18n();
  const active = useStore<ActiveSession>(ACTIVE_SESSION);
  const at = active?.host ?? '';
  const resource = active?.resource;
  const hostFacts = useStore<HostFacts | null>(ahpPaths(at).host);
  const sessions = useStore<SessionSummary[]>(ahpPaths(at).sessions);
  const summary = sessions?.find((one) => one.resource === resource);
  const session = useChannel<SessionState>(at, summary === undefined ? undefined : resource, sessionReducer);
  const chat = useChannel<ChatState>(at, session.state?.defaultChat ?? summary?.defaultChat, chatReducer);
  const turns = chat.state?.turns;
  const totals = useMemo(() => totalsOf(turns ?? []), [turns]);
  if (summary === undefined) return <p className="web-note web-details__empty">{t('sessions/details/empty')}</p>;

  const folder = summary.workingDirectories?.[0];
  const changes = summary.changes;
  const origin = summary.origin;
  const watching = session.state?.activeClients.length ?? 0;
  const chatUri = session.state?.defaultChat ?? summary.defaultChat;
  const facts: [string, ReactElement | string][] = [
    // With every host, the host first: the rest is that host's.
    ...(embedMode() === 'multi' ? [[t('common/host'), <HostTag key="host" host={at} />] as [string, ReactElement]] : []),
    [t('sessions/details/session'), summary.title === '' ? t('sessions/untitled') : summary.title],
    [t('sessions/details/sessionId'), <code key="s">{summary.resource}</code>],
  ];
  if (chatUri !== undefined) facts.push([t('sessions/details/chatId'), <code key="h">{chatUri}</code>]);
  facts.push([t('sessions/details/agent'), summary.provider]);
  if (totals.models.length > 0) facts.push([t('sessions/details/model'), totals.models.join(', ')]);
  if (folder !== undefined) {
    facts.push([t('sessions/details/folder'), (
      <button key="f" type="button" className="web-link" title={t('sessions/details/revealFolder')} onClick={() => void scena.commands.execute('ahp.revealFolder', { host: at, uri: folder })}>
        <code>{folderLabel(folder)}</code>
      </button>
    )]);
  }
  facts.push([t('sessions/details/terminal'), (
    <span key="t" className="web-details__list">
      {folder === undefined ? null : (hostFacts?.terminals ?? []).map((terminal) => <FolderTerminal key={terminal.resource} host={at} uri={terminal.resource} folder={folder} />)}
      <button type="button" className="web-link" title={folder === undefined ? t('sessions/details/newTerminalHint') : t('sessions/details/newTerminalInFolder')} onClick={() => void scena.commands.execute('ahp.newTerminal', { host: at, ...(folder === undefined ? {} : { cwd: folder }) })}>
        {t('sessions/details/newTerminal')}
      </button>
    </span>
  )]);
  if (summary.project !== undefined) facts.push([t('sessions/details/project'), summary.project.displayName]);
  facts.push([t('sessions/details/started'), when(summary.createdAt)], [t('sessions/details/changed'), when(summary.modifiedAt)]);
  if (totals.turns > 0) {
    facts.push([t('sessions/details/turns'), `${totals.turns}${chat.state?.turnsNextCursor === undefined ? '' : '+'}`]);
    facts.push([t('sessions/details/working'), elapsed(totals.working)]);
    facts.push([t('sessions/details/tokens'), `\u{2191}${tokens(totals.input)} \u{2193}${tokens(totals.output)}`]);
    if (totals.tools > 0) facts.push([t('sessions/details/toolCalls'), String(totals.tools)]);
  }
  if (changes !== undefined && (changes.additions !== undefined || changes.deletions !== undefined)) {
    facts.push([t('sessions/details/changes'), (
      <span key="c">
        <span className="web-diff--add">+{changes.additions ?? 0}</span>{' '}
        <span className="web-diff--remove">-{changes.deletions ?? 0}</span>
        {changes.files === undefined ? '' : ` ${plural('sessions/details/inFiles', changes.files)}`}
      </span>
    )]);
  }
  if (origin !== undefined && String(origin.kind) === 'automation') facts.push([t('sessions/details/from'), t('sessions/details/automation')]);
  if (watching > 0) facts.push([t('sessions/details/watching'), String(watching)]);
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
