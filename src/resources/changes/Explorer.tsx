import { useMemo, useState, type MouseEvent, type ReactElement, type ReactNode } from 'react';
import { useI18n, useScena, useStore } from '@softov/scena/react';
import { Alert, ContextMenu, Spinner, Tree, type TreeNode } from '@softov/scena/ui';
import type { PickerAction } from '@softov/scena/types';
import { sessionReducer, type ChangesetOperation, type SessionState, type SessionSummary } from '@microsoft/agent-host-protocol';
import { ahpPaths, hostBridge } from '../../bridges/data.js';
import { useChannel } from '../../bridges/channel.js';
import { ACTIVE_SESSION, type ActiveSession } from '../sessions/state.js';
import { openAsItems, viewersOf } from '../files/viewers.js';
import { plural } from '../../i18n/locales.js';
import { EMOJIcon } from '../emojis.js';
import { iconOf, openChange, scoped, toneOf, useChangeset } from './changeset.js';
import { ChangesetForms } from './Forms.js';
import { firstScope, folderTree, groupChanges, letterOf, relativeDir, scopesOf, type Change, type ChangeFolder, type ChangeGrouping } from './words.js';

/** How the files are drawn: one row each with its folder beside it, or under their folders. */
type View = 'list' | 'tree';

const VIEW_KEY = 'ahpd-web.changes-view';
const GROUPING_KEY = 'ahpd-web.changes-grouping';


function readKept<T extends string>(key: string, allowed: readonly T[]): T | null {
  try {
    const held = localStorage.getItem(key);
    return allowed.find((one) => one === held) ?? null;
  } catch {
    return null;
  }
}

function keep(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Not kept, which only means the next visit starts from the default.
  }
}

/** The message each letter is read as. */
const WORD: Record<ReturnType<typeof letterOf>, string> = { A: 'changes/status/added', M: 'changes/status/modified', D: 'changes/status/deleted', U: 'changes/status/untracked' };

/** The sidebar: what the open session changed, by file, with the host's operations on it. */
export default function ChangesExplorer(): ReactElement {
  const scena = useScena();
  const { t } = useI18n();
  const opened = useStore<ActiveSession>(ACTIVE_SESSION);
  // The active session's host; nothing is read while no session is open.
  const at = opened?.host ?? '';
  const active = opened?.resource;
  const sessions = useStore<SessionSummary[]>(ahpPaths(at).sessions);
  const summary = sessions?.find((one) => one.resource === active);
  const session = useChannel<SessionState>(at, active, sessionReducer);
  const scopes = useMemo(() => scopesOf(session.state?.changesets), [session.state?.changesets]);
  const [chosen, setChosen] = useState<string | undefined>(undefined);
  const scope = scopes.find((one) => one.uri === chosen) ?? firstScope(scopes);
  const changes = useChangeset(at, scope?.uri);
  const { files, operations } = changes;
  const workspace = summary?.workingDirectories?.[0] ?? null;

  const [view, setView] = useState<View>(() => readKept<View>(VIEW_KEY, ['list', 'tree']) ?? 'list');
  const [picked, setPicked] = useState<ChangeGrouping | null>(() => readKept<ChangeGrouping>(GROUPING_KEY, ['review', 'staging', 'none']));
  const review = scope?.review === true;
  const staging = files.some((one) => one.staged || one.unstaged);
  const groupings: ChangeGrouping[] = [...(review ? ['review' as const] : []), ...(staging ? ['staging' as const] : []), 'none'];
  const grouping = picked !== null && groupings.includes(picked) ? picked : groupings[0] ?? 'none';

  const [filter, setFilter] = useState('');
  const [collapsed, setCollapsed] = useState<ReadonlySet<string>>(new Set());
  const [selected, setSelected] = useState<string | null>(null);
  const [menu, setMenu] = useState<{ x: number; y: number; items: PickerAction[] } | null>(null);

  const fileOps = operations.filter((one) => scoped(one, 'resource'));
  // Create PR prepares before it asks, so Prepare PR beside it would open the same form.
  const offersCreate = operations.some((one) => one.id === 'create-pr');
  const whole = operations.filter((one) => scoped(one, 'changeset') && !(offersCreate && one.id === 'prepare-pull-request'));
  const busy = (operation: ChangesetOperation): boolean => String(operation.status) === 'running';

  const menuOf = (change: Change): PickerAction[] => {
    const items: PickerAction[] = [{ title: t('changes/openChange'), onSelect: (host) => { host.closeMenu(); openChange(scena, at, change, scope?.uri, review); } }];
    if (change.status !== 'deleted') {
      items.push({ title: t('changes/openFile'), onSelect: (host) => { host.closeMenu(); void scena.commands.execute('ahp.openFile', { uri: change.file }); } });
      items.push(...openAsItems(scena, at, change.file, viewersOf(scena, change.file)[0]?.component ?? null));
    }
    if (review) {
      items.push({ title: t(change.reviewed ? 'changes/markNotReviewed' : 'changes/markReviewed'), onSelect: (host) => { host.closeMenu(); changes.review([change], !change.reviewed); } });
    }
    for (const operation of fileOps) {
      items.push({
        title: operation.label,
        ...(operation.description === undefined ? {} : { tooltip: operation.description }),
        group: 'file',
        ...(operation.confirmation === undefined ? {} : { color: 'red' }),
        onSelect: (host) => { host.closeMenu(); void changes.run(operation, change); },
      });
    }
    return items;
  };

  /** A row's end: counts and letter, which a hover swaps for the row's actions. */
  const endOf = (change: Change): ReactNode => {
    const letter = letterOf(change);
    const act = (event: MouseEvent, then: () => void): void => {
      event.stopPropagation();
      then();
    };
    return (
      <span className="web-change__end">
        <span className="web-change__actions">
          {review ? (
            <button type="button" className="web-change__action" title={t(change.reviewed ? 'changes/markNotReviewed' : 'changes/markReviewed')} aria-label={t(change.reviewed ? 'changes/markNotReviewed' : 'changes/markReviewed')} aria-pressed={change.reviewed} onClick={(event) => act(event, () => changes.review([change], !change.reviewed))}>
              {EMOJIcon.check}
            </button>
          ) : null}
          {change.status === 'deleted' ? null : (
            <button type="button" className="web-change__action" title={t('changes/openFile')} aria-label={t('changes/openFile')} onClick={(event) => act(event, () => void scena.commands.execute('ahp.openFile', { uri: change.file }))}>
              {EMOJIcon.file}
            </button>
          )}
          {fileOps.map((operation) => (
            <button key={operation.id} type="button" className="web-change__action" title={operation.label} aria-label={operation.label} disabled={busy(operation)} onClick={(event) => act(event, () => void changes.run(operation, change))}>
              {iconOf(operation)}
            </button>
          ))}
        </span>
        <span className="web-change__counts">
          {change.added === undefined && change.removed === undefined ? null : <><span className="web-diff--add">+{change.added ?? 0}</span> <span className="web-diff--remove">-{change.removed ?? 0}</span></>}
        </span>
        <span className="web-change__letter" data-letter={letter} title={t(WORD[letter])}>{letter}</span>
      </span>
    );
  };

  const needle = filter.trim().toLowerCase();
  const shown = needle === '' ? files : files.filter((one) => `${relativeDir(one.dir, workspace)}/${one.name}`.toLowerCase().includes(needle));
  const groups = groupChanges(shown, grouping);

  // The rows, and which change each file row stands for, for its menu.
  const byKey = new Map<string, Change>();
  const nodes = ((): TreeNode<Change>[] => {
    const fileNode = (change: Change, group: string): TreeNode<Change> => {
      const key = `${group}|${change.id}`;
      byKey.set(key, change);
      const dir = relativeDir(change.dir, workspace);
      return {
        key,
        label: (
          <span className="web-change" data-reviewed={change.reviewed ? 'true' : 'false'} data-deleted={change.status === 'deleted' ? 'true' : 'false'} title={`${dir}/${change.name}`}>
            <span className="web-change__name">{change.name}</span>
            {view === 'list' && dir !== '.' ? <span className="web-change__dir">{dir}</span> : null}
          </span>
        ),
        icon: viewersOf(scena, change.file)[0]?.opens?.icon ?? EMOJIcon.file,
        trailing: endOf(change),
        data: change,
      };
    };
    const folderNode = (folder: ChangeFolder, group: string): TreeNode<Change> => ({
      key: `${group}|dir:${folder.path}`,
      label: <span className="web-change__name" title={folder.path}>{folder.name}</span>,
      icon: EMOJIcon.folder,
      children: [...folder.folders.map((one) => folderNode(one, group)), ...folder.changes.map((one) => fileNode(one, group))],
    });
    const bodyOf = (list: Change[], group: string): TreeNode<Change>[] => {
      if (view === 'list') return list.map((one) => fileNode(one, group));
      const root = folderTree(list, workspace);
      return [...root.folders.map((one) => folderNode(one, group)), ...root.changes.map((one) => fileNode(one, group))];
    };
    return grouping === 'none'
      ? bodyOf(groups[0]?.changes ?? [], 'all')
      : groups.map((group): TreeNode<Change> => ({
        key: `group:${group.key}`,
        icon: '',
        label: <span className="web-change__group">{group.label}</span>,
        trailing: <span className="web-explorer__count">{group.changes.length}</span>,
        children: bodyOf(group.changes, group.key),
      }));
  })();

  // Every group and folder starts open; what is kept is what a person closed.
  const branches: string[] = [];
  const walk = (list: TreeNode<Change>[]): void => {
    for (const node of list) {
      if (node.children === undefined) continue;
      branches.push(node.key);
      walk(node.children);
    }
  };
  walk(nodes);
  const expanded = new Set(branches.filter((key) => !collapsed.has(key)));

  const openMenu = (event: MouseEvent<HTMLElement>): void => {
    const key = (event.target as HTMLElement).closest<HTMLElement>('[data-key]')?.dataset.key;
    const change = key === undefined ? undefined : byKey.get(key);
    if (change === undefined) return;
    event.preventDefault();
    setSelected(key ?? null);
    setMenu({ x: event.clientX, y: event.clientY, items: menuOf(change) });
  };

  const status = String(changes.state?.status ?? '');
  const notice = (
    <>
      {active === undefined ? <p className="web-note web-explorer__empty">{t('changes/noSession')}</p> : null}
      {active !== undefined && session.state !== undefined && scopes.length === 0 ? <p className="web-note web-explorer__empty">{t('changes/untracked')}</p> : null}
      {changes.said === null ? null : <Alert tone={changes.said.tone} message={changes.said.text} />}
      {changes.error === null ? null : <Alert tone="danger" title={t('changes/notReadable')} message={changes.error} />}
      {changes.state?.error === undefined ? null : <Alert tone="danger" message={changes.state.error.message} />}
      {scope !== undefined && (changes.state === undefined || status === 'computing') && changes.error === null ? <Spinner label={t('changes/computing')} /> : null}
      {changes.state !== undefined && status !== 'computing' && files.length === 0 ? <p className="web-note web-explorer__empty">{t('changes/none')}</p> : null}
    </>
  );

  const headButton = (icon: string, label: string, run: (event: MouseEvent<HTMLButtonElement>) => void, extra?: { on?: boolean; busy?: boolean; disabled?: boolean; tone?: string | null }): ReactElement => (
    <button
      key={label}
      type="button"
      className="web-explorer__action"
      title={label}
      aria-label={label}
      aria-pressed={extra?.on}
      data-on={extra?.on === true ? 'true' : 'false'}
      data-busy={extra?.busy === true ? 'true' : 'false'}
      data-tone={extra?.tone ?? undefined}
      disabled={extra?.disabled}
      onClick={run}
    >
      <span className="web-explorer__icon">{icon}</span>
    </button>
  );

  const showAs = (next: View): void => {
    setView(next);
    keep(VIEW_KEY, next);
  };

  const openScopes = (event: MouseEvent<HTMLButtonElement>): void => {
    const box = event.currentTarget.getBoundingClientRect();
    const items: PickerAction[] = scopes.map((one) => ({
      title: one.label,
      icon: one.uri === scope?.uri ? EMOJIcon.check : '',
      onSelect: (host) => { host.closeMenu(); setChosen(one.uri); },
    }));
    setMenu({ x: box.left, y: box.bottom, items });
  };

  const openOptions = (event: MouseEvent<HTMLButtonElement>): void => {
    const box = event.currentTarget.getBoundingClientRect();
    const mark = (on: boolean): { icon: string } => ({ icon: on ? EMOJIcon.check : '' });
    const items: PickerAction[] = whole.map((operation) => {
      const tone = toneOf(operation);
      return {
        title: operation.label,
        ...(operation.description === undefined ? {} : { tooltip: operation.description }),
        group: 'changes',
        icon: iconOf(operation),
        ...(tone === null ? {} : { color: tone }),
        disabled: busy(operation),
        onSelect: (host) => { host.closeMenu(); void changes.run(operation); },
      };
    });
    items.push(
      { title: t('changes/view/list'), group: 'view', ...mark(view === 'list'), onSelect: (host) => { host.closeMenu(); showAs('list'); } },
      { title: t('changes/view/tree'), group: 'view', ...mark(view === 'tree'), onSelect: (host) => { host.closeMenu(); showAs('tree'); } },
    );
    if (groupings.length > 1) {
      for (const one of groupings) {
        items.push({ title: t(`changes/grouping/${one}`), group: 'group', ...mark(one === grouping), onSelect: (host) => { host.closeMenu(); setPicked(one); keep(GROUPING_KEY, one); } });
      }
    }
    if (branches.length > 0) {
      items.push({ title: t('changes/expandAll'), group: 'folders', icon: '', onSelect: (host) => { host.closeMenu(); setCollapsed(new Set()); } });
      items.push({ title: t('changes/collapseAll'), group: 'folders', icon: '', onSelect: (host) => { host.closeMenu(); setCollapsed(new Set(branches)); } });
    }
    setMenu({ x: Math.max(0, box.right - 200), y: box.bottom, items });
  };

  const added = files.reduce((sum, one) => sum + (one.added ?? 0), 0);
  const removed = files.reduce((sum, one) => sum + (one.removed ?? 0), 0);

  return (
    <div className="web-explorer web-changes">
      <div className="web-explorer__title">
        <span className="web-explorer__name" title={summary?.title}>{summary === undefined ? t('changes/title') : t('changes/titleOf', { title: summary.title || t('changes/untitled') })}</span>
        {scope === undefined ? null : (
          <span className="web-explorer__actions">
            {whole.map((operation) => headButton(iconOf(operation), operation.label, () => void changes.run(operation), {
              busy: busy(operation),
              disabled: busy(operation),
              tone: toneOf(operation),
            }))}
            {whole.length === 0 ? null : <span className="web-explorer__sep" aria-hidden="true" />}
            {headButton(EMOJIcon.reload, t('common/reload'), () => void hostBridge(at).refresh(scope.uri))}
            {headButton(EMOJIcon.more, t('changes/viewOptions'), openOptions)}
          </span>
        )}
      </div>
      {scope === undefined ? null : (
        <div className="web-changes__bar">
          {scopes.length > 1 ? (
            <button type="button" className="web-changes__scope" title={scope.description ?? scope.label} aria-haspopup="menu" onClick={openScopes}>
              {scope.label} <span aria-hidden="true">{EMOJIcon.caretDown}</span>
            </button>
          ) : (
            <span className="web-changes__scope web-changes__scope--only" title={scope.description ?? scope.label}>{scope.label}</span>
          )}
          {files.length === 0 ? null : (
            // A narrow pane has room for the file icon and the count; the words are its tip.
            <span className="web-changes__totals" title={plural('changes/files', files.length)}>
              <span aria-label={plural('changes/files', files.length)}><span aria-hidden="true">{EMOJIcon.file}</span> {files.length}</span>
              {' '}<span className="web-diff--add">+{added}</span> <span className="web-diff--remove">{'\u{2212}'}{removed}</span>
            </span>
          )}
          <span className="web-segments" role="group" aria-label={t('changes/view/showAs')}>
            {(['list', 'tree'] as const).map((one) => (
              <button key={one} type="button" className="web-segments__item web-segments__item--icon" aria-pressed={view === one} title={t(`changes/view/${one}`)} aria-label={t(`changes/view/${one}`)} onClick={() => showAs(one)}>
                {one === 'list' ? EMOJIcon.log : EMOJIcon.tree}
              </button>
            ))}
          </span>
        </div>
      )}
      {files.length === 0 ? null : (
        <input className="web-explorer__filter" type="search" value={filter} placeholder={t('changes/filter')} aria-label={t('changes/filter')} onChange={(event) => setFilter(event.target.value)} />
      )}
      <div className="web-explorer__scroll" onContextMenu={openMenu}>
        <div className="web-explorer__notice">{notice}</div>
        <Tree<Change>
          nodes={nodes}
          selectedKey={selected}
          expanded={expanded}
          onExpandedChange={(next) => setCollapsed(new Set(branches.filter((key) => !next.has(key))))}
          onSelect={(node) => {
            if (node.data === undefined) {
              setCollapsed((held) => {
                const next = new Set(held);
                if (!next.delete(node.key)) next.add(node.key);
                return next;
              });
              return;
            }
            setSelected(node.key);
            openChange(scena, at, node.data, scope?.uri, review);
          }}
        />
        {needle !== '' && shown.length === 0 ? <p className="web-note web-explorer__empty">{t('changes/noMatch')}</p> : null}
      </div>
      <ChangesetForms form={changes.form} files={files} onCommit={changes.commit} onPullRequest={changes.pullRequest} onClose={changes.closeForm} />
      {menu === null ? null : <ContextMenu spec={{ items: menu.items }} x={menu.x} y={menu.y} onClose={() => setMenu(null)} />}
    </div>
  );
}
