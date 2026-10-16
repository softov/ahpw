import { useEffect, useMemo, type ReactElement } from 'react';
import { translate } from '@softov/scena';
import { useI18n, useScena, useStore } from '@softov/scena/react';
import { Alert, Spinner } from '@softov/scena/ui';
import type { PickerAction } from '@softov/scena/types';
import type { AgentInfo, SessionSummary, StateAction } from '@microsoft/agent-host-protocol';
import { AHP_AGENTS, AHP_CONNECTION, AHP_SESSIONS, dispatch, request, type Connection } from '../../bridges/data.js';
import { folderLabel } from '../../bridges/words.js';
import { ExplorerList, type Dot, type Row } from '../../shell/explorer/ExplorerList.js';
import { ACTIVE_SESSION, SESSIONS_ARCHIVED, SESSIONS_GROUPING } from './state.js';
import { plural, dateFormat } from '../../i18n/locales.js';
import { activityLabel, activityOf, isArchived, isRead, type Activity } from './status.js';
import { arrange, groupOf, type Grouping } from './grouping.js';
import { confirm, failed } from '../../shell/notify/index.js';
import { EMOJIcon } from '../emojis.js';

const sameDay = dateFormat({ hour: '2-digit', minute: '2-digit' });
const otherDay = dateFormat({ month: 'short', day: 'numeric' });

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
    { title: translate('sessions/explorer/open'), onSelect: (host) => { host.closeMenu(); open(); } },
    {
      title: translate('sessions/explorer/rename'),
      onSelect: (host) => {
        host.closeMenu();
        const title = window.prompt(translate('sessions/explorer/renamePrompt'), session.title)?.trim();
        if (title !== undefined && title !== '' && title !== session.title) say({ type: 'session/titleChanged', title } as StateAction);
      },
    },
    { title: translate(read ? 'sessions/explorer/markUnread' : 'sessions/explorer/markRead'), onSelect: (host) => { host.closeMenu(); say({ type: 'session/isReadChanged', isRead: !read } as StateAction); } },
    { title: translate(archived ? 'sessions/explorer/unarchive' : 'sessions/explorer/archive'), onSelect: (host) => { host.closeMenu(); say({ type: 'session/isArchivedChanged', isArchived: !archived } as StateAction); } },
    { title: translate('sessions/explorer/copyLink'), group: 'more', onSelect: (host) => { host.closeMenu(); void navigator.clipboard?.writeText(session.resource).catch(() => undefined); } },
    {
      title: translate('sessions/explorer/delete'),
      group: 'more',
      color: 'red',
      onSelect: (host) => {
        host.closeMenu();
        const title = session.title || translate('sessions/untitled');
        void confirm({ title: translate('sessions/explorer/deleteTitle', { title }), body: translate('sessions/explorer/deleteBody'), confirmLabel: translate('sessions/explorer/delete'), tone: 'danger' }).then((yes) => {
          if (yes) void request('disposeSession', { channel: session.resource }).catch((error: unknown) => failed(translate('sessions/explorer/deleteFailed'), error));
        });
      },
    },
  ];
}

/** The sidebar: the server's sessions, newest change first. */
export default function SessionExplorer(): ReactElement {
  const scena = useScena();
  const { t } = useI18n();
  const connection = useStore<Connection>(AHP_CONNECTION);
  const sessions = useStore<SessionSummary[]>(AHP_SESSIONS);
  const agents = useStore<AgentInfo[]>(AHP_AGENTS) ?? [];
  const active = useStore<string>(ACTIVE_SESSION);
  const archived = useStore<boolean>(SESSIONS_ARCHIVED) === true;
  const grouping = useStore<Grouping | null>(SESSIONS_GROUPING) ?? 'none';

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
        // The counts on every row that has any, and a running row's activity under them, as ahpapp shows both.
        const counts = changes !== undefined && (changes.additions ?? 0) + (changes.deletions ?? 0) > 0
          ? <><span className="web-diff--add">+{changes.additions ?? 0}</span> <span className="web-diff--remove">-{changes.deletions ?? 0}</span>{changes.files === undefined ? '' : ` \u{00B7} ${plural('sessions/explorer/files', changes.files)}`}</>
          : undefined;
        const doing = activity !== 'idle'
          ? `${activityLabel(activity)}${one.activity === undefined || one.activity === '' ? '' : ` \u{00B7} ${one.activity}`}`
          : undefined;
        return {
          key: one.resource,
          dot: isArchived(one.status) ? 'off' : unread ? 'fresh' : DOT[activity],
          dotLabel: isArchived(one.status) ? t('sessions/status/archived') : unread ? t('sessions/status/unread') : activityLabel(activity),
          title: one.title === '' ? t('sessions/untitled') : one.title,
          time: changedAt(one.modifiedAt),
          lines: [second, counts, doing].filter((line) => line !== undefined),
          menu: menuOf(one, () => open(one.resource)),
          strong: unread,
          ...(inGroup === undefined ? {} : { group: inGroup }),
        };
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sessions, agents, archived, grouping, t],
  );

  const notice = connection?.status === 'failed'
    ? <Alert tone="danger" title={t('sessions/explorer/notConnected')} message={connection.error ?? t('sessions/explorer/refused')} />
    : connection?.status !== 'connected' && sessions === undefined
      ? <Spinner label={t('sessions/explorer/connecting')} />
      : rows.length === 0 ? <p className="web-note">{archived ? t('sessions/explorer/none') : t('sessions/explorer/noneYet')}</p> : null;

  return (
    <ExplorerList
      label={t('sessions/explorer/title')}
      rows={rows}
      selected={active ?? null}
      onOpen={open}
      notice={notice}
      filterLabel={t('sessions/explorer/filter')}
    />
  );
}
