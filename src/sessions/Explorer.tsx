import { useEffect, useMemo, useState, type ReactElement } from 'react';
import { useScena, useStore } from '@softov/scena/react';
import { Alert, Spinner } from '@softov/scena/ui';
import type { PickerAction } from '@softov/scena/types';
import type { AgentInfo, SessionSummary, StateAction } from '@microsoft/agent-host-protocol';
import { AHP_AGENTS, AHP_CONNECTION, AHP_SESSIONS, dispatch, reloadSessions, request, type Connection } from '../connection/data.js';
import { folderLabel } from '../connection/words.js';
import { ExplorerList, type Dot, type Row } from '../explorer/ExplorerList.js';
import { ACTIVE_SESSION } from './state.js';
import { ACTIVITY_LABEL, activityOf, isArchived, isRead, type Activity } from './status.js';
import { GROUPINGS, arrange, groupOf, type Grouping } from './grouping.js';

/** Where the chosen grouping is kept, per browser. */
const GROUPING_KEY = 'ahpd-web.session-grouping';

function readGrouping(): Grouping {
  try {
    const held = localStorage.getItem(GROUPING_KEY);
    return GROUPINGS.some((one) => one.id === held) ? held as Grouping : 'none';
  } catch {
    return 'none';
  }
}

function writeGrouping(grouping: Grouping): void {
  try {
    localStorage.setItem(GROUPING_KEY, grouping);
  } catch {
    // Not kept, which only means the next visit starts ungrouped.
  }
}

const sameDay = new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' });
const otherDay = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' });

/** When a session last changed: the time today, the date before. */
function changedAt(iso: string, now = new Date()): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return (date.toDateString() === now.toDateString() ? sameDay : otherDay).format(date);
}

const DOT: Record<Activity, Dot> = { input: 'attention', running: 'working', error: 'failed', idle: 'quiet' };

/** A folder's last segment, which is what tells two sessions apart. */
const baseOf = (uri: string): string => folderLabel(uri).replace(/\/+$/, '').split('/').pop() ?? uri;

/** What a session's menu offers. */
function menuOf(session: SessionSummary, open: () => void): PickerAction[] {
  const read = isRead(session.status);
  const archived = isArchived(session.status);
  const say = (action: StateAction): void => dispatch(session.resource, action);
  return [
    { title: 'Open', onSelect: (host) => { host.closeMenu(); open(); } },
    {
      title: 'Rename',
      onSelect: (host) => {
        host.closeMenu();
        const title = window.prompt('Rename the session', session.title)?.trim();
        if (title !== undefined && title !== '' && title !== session.title) say({ type: 'session/titleChanged', title } as StateAction);
      },
    },
    { title: read ? 'Mark as unread' : 'Mark as read', onSelect: (host) => { host.closeMenu(); say({ type: 'session/isReadChanged', isRead: !read } as StateAction); } },
    { title: archived ? 'Unarchive' : 'Archive', onSelect: (host) => { host.closeMenu(); say({ type: 'session/isArchivedChanged', isArchived: !archived } as StateAction); } },
    { title: 'Copy link', group: 'more', onSelect: (host) => { host.closeMenu(); void navigator.clipboard?.writeText(session.resource).catch(() => undefined); } },
    {
      title: 'Delete',
      group: 'more',
      color: 'red',
      onSelect: (host) => {
        host.closeMenu();
        if (window.confirm(`Delete "${session.title || 'Untitled'}"? Its history goes with it.`)) {
          void request('disposeSession', { channel: session.resource }).catch((error: unknown) => window.alert(error instanceof Error ? error.message : String(error)));
        }
      },
    },
  ];
}

/** The sidebar: the daemon's sessions, newest change first. */
export default function SessionExplorer(): ReactElement {
  const scena = useScena();
  const connection = useStore<Connection>(AHP_CONNECTION);
  const sessions = useStore<SessionSummary[]>(AHP_SESSIONS);
  const agents = useStore<AgentInfo[]>(AHP_AGENTS) ?? [];
  const active = useStore<string>(ACTIVE_SESSION);
  const [archived, setArchived] = useState(false);
  const [grouping, setGrouping] = useState<Grouping>(readGrouping);
  const group = (next: Grouping): void => { setGrouping(next); writeGrouping(next); };
  const [reloading, setReloading] = useState(false);

  const open = (resource: string): void => void scena.commands.execute('ahp.openSession', { resource });
  const rows = useMemo<Row[]>(
    () => {
      const agentName = (provider: string): string => agents.find((candidate) => candidate.provider === provider)?.displayName ?? provider;
      const kept = (sessions ?? []).filter((one) => archived || !isArchived(one.status));
      return arrange(kept, (one) => groupOf(one, grouping, agentName), grouping).map((one): Row => {
        const activity = activityOf(one.status);
        const unread = activity === 'idle' && !isRead(one.status);
        const agent = agentName(one.provider);
        const inGroup = groupOf(one, grouping, agentName);
        const folder = one.workingDirectories?.[0];
        const second = [agent, folder === undefined ? undefined : baseOf(folder)].filter((bit) => bit !== undefined).join(' \u{00B7} ');
        const changes = one.changes;
        const third = activity !== 'idle'
          ? `${ACTIVITY_LABEL[activity]}${one.activity === undefined || one.activity === '' ? '' : ` \u{00B7} ${one.activity}`}`
          : changes !== undefined && (changes.additions ?? 0) + (changes.deletions ?? 0) > 0
            ? <><span className="web-diff--add">+{changes.additions ?? 0}</span> <span className="web-diff--remove">-{changes.deletions ?? 0}</span>{changes.files === undefined ? '' : ` \u{00B7} ${changes.files} files`}</>
            : undefined;
        return {
          key: one.resource,
          dot: isArchived(one.status) ? 'off' : unread ? 'fresh' : DOT[activity],
          dotLabel: isArchived(one.status) ? 'Archived' : unread ? 'Unread' : ACTIVITY_LABEL[activity],
          title: one.title === '' ? 'Untitled' : one.title,
          time: changedAt(one.modifiedAt),
          lines: third === undefined ? [second] : [second, third],
          menu: menuOf(one, () => open(one.resource)),
          strong: unread,
          ...(inGroup === undefined ? {} : { group: inGroup }),
        };
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sessions, agents, archived, grouping],
  );

  // The first session opens when the list arrives and nothing is open.
  useEffect(() => {
    const first = rows[0];
    if (active === undefined && first !== undefined) open(first.key);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, active]);

  const reload = (): void => {
    setReloading(true);
    void reloadSessions().catch(() => undefined).finally(() => setReloading(false));
  };

  const notice = connection?.status === 'failed'
    ? <Alert tone="danger" title="Not connected" message={connection.error ?? 'The daemon refused the connection.'} />
    : connection?.status !== 'connected' && sessions === undefined
      ? <Spinner label="Connecting to the daemon" />
      : reloading
        ? <Spinner label="Reloading" />
        : rows.length === 0 ? <p className="web-note web-explorer__empty">{archived ? 'No sessions.' : 'No sessions yet.'}</p> : null;

  return (
    <ExplorerList
      title="Sessions"
      actions={[
        { icon: '+', label: 'New session', run: () => void scena.commands.execute('ahp.newSession') },
        { icon: '\u{21BB}', label: 'Reload', run: reload },
        { icon: '\u{25A4}', label: archived ? 'Hide archived' : 'Show archived', run: () => setArchived(!archived), on: archived },
        {
          icon: '\u{2637}',
          label: 'Group sessions',
          on: grouping !== 'none',
          menu: GROUPINGS.map((one) => ({
            title: one.label,
            ...(one.id === grouping ? { description: 'Current' } : {}),
            onSelect: (host) => { host.closeMenu(); group(one.id); },
          })),
        },
      ]}
      rows={rows}
      selected={active ?? null}
      onOpen={open}
      notice={notice}
      filterLabel="Filter sessions"
    />
  );
}
