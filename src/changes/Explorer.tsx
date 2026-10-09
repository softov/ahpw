import { useEffect, useMemo, useState, type ReactElement } from 'react';
import { useScena, useStore } from '@softov/scena/react';
import { Alert, Button, Spinner } from '@softov/scena/ui';
import type { PickerAction } from '@softov/scena/types';
import {
  changesetReducer,
  sessionReducer,
  type ChangesetOperation,
  type ChangesetState,
  type SessionState,
  type SessionSummary,
  type StateAction,
} from '@microsoft/agent-host-protocol';
import { AHP_SESSIONS, dispatch, refresh, request } from '../connection/data.js';
import { useChannel } from '../connection/channel.js';
import { textOf } from '../connection/words.js';
import { ExplorerList, type Dot, type Row } from '../explorer/ExplorerList.js';
import { ACTIVE_SESSION } from '../sessions/state.js';
import { openAsItems, viewersOf } from '../files/viewers.js';
import { confirm } from '../notify/index.js';
import { changeOf, firstScope, relativeDir, scopesOf, type Change } from './words.js';

const DOT: Record<Change['status'], Dot> = { added: 'ok', modified: 'fresh', deleted: 'failed' };
const LETTER: Record<Change['status'], string> = { added: 'Added', modified: 'Changed', deleted: 'Deleted' };

/** Whether an operation applies to the whole changeset, or to one file. */
const scoped = (operation: ChangesetOperation, scope: string): boolean => operation.scopes.map(String).includes(scope);

/** The sidebar: what the open session changed, by file, with the host's operations on it. */
export default function ChangesExplorer(): ReactElement {
  const scena = useScena();
  const active = useStore<string>(ACTIVE_SESSION);
  const sessions = useStore<SessionSummary[]>(AHP_SESSIONS);
  const summary = sessions?.find((one) => one.resource === active);
  const session = useChannel<SessionState>(active, sessionReducer);
  const scopes = useMemo(() => scopesOf(session.state?.changesets), [session.state?.changesets]);
  const [chosen, setChosen] = useState<string | undefined>(undefined);
  const scope = scopes.find((one) => one.uri === chosen) ?? firstScope(scopes);
  const changes = useChannel<ChangesetState>(scope?.uri, changesetReducer);
  const [said, setSaid] = useState<{ tone: 'info' | 'danger'; text: string } | null>(null);
  const workspace = summary?.workingDirectories?.[0] ?? null;

  useEffect(() => setSaid(null), [scope?.uri]);

  const run = async (operation: ChangesetOperation, target?: Change): Promise<void> => {
    if (scope === undefined) return;
    const question = textOf(operation.confirmation);
    if (question !== '' && !(await confirm({ title: question, confirmLabel: operation.label }))) return;
    setSaid(null);
    request('invokeChangesetOperation', {
      channel: scope.uri,
      operationId: operation.id,
      ...(target === undefined ? {} : { target: { kind: 'resource', resource: target.file } }),
    } as never)
      .then((result) => {
        const answer = result as unknown as { message?: string | { markdown: string }; followUp?: { content?: { uri: string }; external?: string } } | null;
        if (answer?.message !== undefined) setSaid({ tone: 'info', text: textOf(answer.message) });
        if (answer?.followUp?.external !== undefined) window.open(answer.followUp.external, '_blank', 'noopener');
        else if (answer?.followUp?.content !== undefined) void scena.commands.execute('ahp.openFile', { uri: answer.followUp.content.uri });
      })
      .catch((error: unknown) => setSaid({ tone: 'danger', text: error instanceof Error ? error.message : String(error) }));
  };

  const openChange = (change: Change): void => void scena.commands.execute('ahp.openDiff', {
    file: change.file,
    ...(change.before === undefined ? {} : { before: change.before }),
    ...(change.after === undefined ? {} : { after: change.after }),
  });

  const files = useMemo(() => (changes.state?.files ?? []).map(changeOf), [changes.state?.files]);
  const operations = changes.state?.operations ?? [];
  const rows = useMemo<Row[]>(() => files.map((change) => {
    const menu: PickerAction[] = [{ title: 'Open change', onSelect: (host) => { host.closeMenu(); openChange(change); } }];
    if (change.status !== 'deleted') {
      menu.push({ title: 'Open file', onSelect: (host) => { host.closeMenu(); void scena.commands.execute('ahp.openFile', { uri: change.file }); } });
      menu.push(...openAsItems(scena, change.file, viewersOf(scena, change.file)[0]?.component ?? null));
    }
    if (scope?.review === true) {
      menu.push({
        title: change.reviewed ? 'Mark as not reviewed' : 'Mark as reviewed',
        onSelect: (host) => {
          host.closeMenu();
          if (scope !== undefined) dispatch(scope.uri, { type: 'changeset/filesReviewChanged', files: [change.id], reviewed: !change.reviewed } as StateAction);
        },
      });
    }
    for (const operation of operations.filter((one) => scoped(one, 'resource'))) {
      menu.push({ title: operation.label, group: 'file', ...(operation.description === undefined ? {} : { description: operation.description }), onSelect: (host) => { host.closeMenu(); void run(operation, change); } });
    }
    const counts = change.added === undefined && change.removed === undefined
      ? LETTER[change.status]
      : <>{LETTER[change.status]} <span className="web-diff--add">+{change.added ?? 0}</span> <span className="web-diff--remove">-{change.removed ?? 0}</span></>;
    return {
      key: change.id,
      dot: change.reviewed ? 'off' : DOT[change.status],
      dotLabel: change.reviewed ? `${LETTER[change.status]}, reviewed` : LETTER[change.status],
      title: change.name,
      lines: [relativeDir(change.dir, workspace), counts],
      menu,
      strong: !change.reviewed,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [files, operations, scope?.uri, scope?.review, workspace]);

  const status = String(changes.state?.status ?? '');
  const whole = operations.filter((one) => scoped(one, 'changeset'));
  const notice = (
    <>
      {active === undefined ? <p className="web-note web-explorer__empty">Open a session to see what it changed.</p> : null}
      {active !== undefined && session.state !== undefined && scopes.length === 0 ? <p className="web-note web-explorer__empty">This session tracks no changes.</p> : null}
      {scopes.length > 1 ? (
        <select className="web-explorer__filter web-changes__scope" aria-label="Which changes" value={scope?.uri ?? ''} onChange={(event) => setChosen(event.target.value)}>
          {scopes.map((one) => <option key={one.uri} value={one.uri}>{one.label}</option>)}
        </select>
      ) : null}
      {whole.length === 0 ? null : (
        <div className="web-changes__ops">
          {whole.map((operation) => (
            <Button
              key={operation.id}
              label={String(operation.status) === 'running' ? `${operation.label}\u{2026}` : operation.label}
              size="sm"
              disabled={String(operation.status) === 'running'}
              onClick={() => void run(operation)}
            />
          ))}
        </div>
      )}
      {said === null ? null : <Alert tone={said.tone} message={said.text} />}
      {changes.error === null ? null : <Alert tone="danger" title="Changes not readable" message={changes.error} />}
      {changes.state?.error === undefined ? null : <Alert tone="danger" message={changes.state.error.message} />}
      {scope !== undefined && (changes.state === undefined || status === 'computing') && changes.error === null ? <Spinner label="Working out the changes" /> : null}
      {changes.state !== undefined && status !== 'computing' && files.length === 0 ? <p className="web-note web-explorer__empty">No changes.</p> : null}
    </>
  );

  return (
    <ExplorerList
      title={summary === undefined ? 'Changes' : `Changes \u{00B7} ${summary.title || 'Untitled'}`}
      actions={scope === undefined ? [] : [{ icon: '\u{21BB}', label: 'Reload', run: () => void refresh(scope.uri) }]}
      rows={rows}
      selected={null}
      onOpen={(key) => {
        const change = files.find((one) => one.id === key);
        if (change !== undefined) openChange(change);
      }}
      notice={notice}
      filterLabel="Filter files"
    />
  );
}
