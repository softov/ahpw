import { useMemo, type ReactElement } from 'react';
import { useI18n, useScena, useStore } from '@softov/scena/react';
import { Alert, Spinner } from '@softov/scena/ui';
import type { PickerAction } from '@softov/scena/types';
import { useChannelOnEach } from '../../bridges/channel.js';
import { refKey, refOf, useHostNames, useShownHosts } from '../../bridges/hosts.js';
import { channelScheme, everyRole, PEOPLE, peopleReducer, type ListedUser, type PeopleState, type Role } from '../../bridges/people.js';
import { useServingHosts } from '../../bridges/served.js';
import { embedMode } from '../../shell/embed/index.js';
import { ExplorerList, type Row } from '../../shell/explorer/ExplorerList.js';
import { ACTIVE_PERSON } from './state.js';

type Kind = 'users' | 'roles';

/** A row's key: the kind first, since a user and a role may share an id. */
const rowKey = (kind: Kind, host: string, id: string): string => `${kind}|${refKey(host, id)}`;
const usersReducer = peopleReducer('users');
const rolesReducer = peopleReducer('roles');

/** The sidebar: the users of the shown hosts that list them, then their roles. */
export default function UsersExplorer(): ReactElement {
  const scena = useScena();
  const { t } = useI18n();
  const shown = useShownHosts();
  const userHosts = useServingHosts(shown, channelScheme('users'));
  const roleHosts = useServingHosts(shown, channelScheme('roles'));
  const hostName = useHostNames();
  const multi = embedMode() === 'multi';
  const users = useChannelOnEach<PeopleState<ListedUser>>(userHosts, PEOPLE.users.channel, usersReducer);
  const roles = useChannelOnEach<PeopleState<Role>>(roleHosts, PEOPLE.roles.channel, rolesReducer);
  const active = useStore<{ host: string; domain: Kind; id: string }>(ACTIVE_PERSON);

  const rows = useMemo<Row[]>(() => {
    const row = (kind: Kind, host: string, id: string, lines: string[]): Row => {
      const key = rowKey(kind, host, id);
      const run = (command: string): void => { void scena.commands.execute(command, { host, id }); };
      const item = (title: string, command: string, extra: Partial<PickerAction> = {}): PickerAction => ({ title, onSelect: (menu) => { menu.closeMenu(); run(command); }, ...extra });
      const open = kind === 'users' ? 'ahp.openUser' : 'ahp.openRole';
      return {
        key,
        dot: 'quiet',
        dotLabel: id,
        title: id,
        group: { key: kind, label: t(kind === 'users' ? 'users/explorer/users' : 'users/explorer/roles') },
        lines: [[multi ? hostName(host) : undefined, ...lines].filter((bit) => bit !== undefined && bit !== '').join(' \u{00B7} ')].filter((line) => line !== ''),
        menu: [
          item(t('users/actions/open'), open),
          item(t('users/actions/delete'), kind === 'users' ? 'ahp.deleteUser' : 'ahp.deleteRole', { group: 'more', color: 'red' }),
        ],
      };
    };
    const byId = <T extends { id: string }>(list: T[]): T[] => list.sort((a, b) => a.id.localeCompare(b.id));
    const userRows = byId(userHosts.flatMap((host, at) => (users.states[at]?.records ?? []).map((one) => ({ host, ...one }))))
      .map(({ host, id, record }) => row('users', host, id, [record.roles.join(', ')]));
    // A host's built-in roles are listed once its roles channel has answered, beside the ones its file writes.
    const roleRows = byId(roleHosts.flatMap((host, at) => (roles.states[at] === undefined ? [] : everyRole(roles.states[at]!.records)).map((one) => ({ host, ...one }))))
      .map(({ host, id, record, builtIn }) => row('roles', host, id, [builtIn ? t('users/role/builtIn') : undefined, t('users/role/grantCount', { count: record.grants.length })].filter((bit): bit is string => bit !== undefined)));
    return [...userRows, ...roleRows];
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userHosts, roleHosts, users.states, roles.states, hostName, t]);

  const error = multi ? null : users.errors[0] ?? null;
  const read = multi ? users.states.some((one) => one !== undefined) : users.states[0] !== undefined;
  const notice = userHosts.length === 0
    ? <p className="web-note web-explorer__empty">{t('users/explorer/notServed')}</p>
    : error !== null
      ? <Alert tone="danger" title={t('users/notices/none')} message={error} />
      : !read
        ? <Spinner label={t('users/notices/reading')} />
        : rows.length === 0 ? <p className="web-note web-explorer__empty">{t('users/explorer/empty')}</p> : null;

  return (
    <ExplorerList
      label={t('users/explorer/title')}
      rows={rows}
      selected={active === undefined ? null : rowKey(active.domain, active.host, active.id)}
      onOpen={(key) => {
        const cut = key.indexOf('|');
        const kind = key.slice(0, cut) as Kind;
        void scena.commands.execute(kind === 'users' ? 'ahp.openUser' : 'ahp.openRole', refOf(key.slice(cut + 1)));
      }}
      notice={notice}
      filterLabel={t('users/explorer/filter')}
      hostLines={multi}
    />
  );
}
