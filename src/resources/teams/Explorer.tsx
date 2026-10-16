import { useMemo, type ReactElement } from 'react';
import { useI18n, useScena, useStore } from '@softov/scena/react';
import { Alert, Spinner } from '@softov/scena/ui';
import type { PickerAction } from '@softov/scena/types';
import { useChannelOnEach } from '../../bridges/channel.js';
import { refKey, refOf, useHostNames, useShownHosts } from '../../bridges/hosts.js';
import { channelScheme, membersOf, PEOPLE, peopleReducer, type ListedUser, type Named, type PeopleState } from '../../bridges/people.js';
import { useServingHosts } from '../../bridges/served.js';
import { embedMode } from '../../shell/embed/index.js';
import { ExplorerList, type Row } from '../../shell/explorer/ExplorerList.js';
import { ACTIVE_TEAM } from './state.js';

type Kind = 'teams' | 'projects';

/** A row's key: the kind first, since a team and a project may share an id. */
const rowKey = (kind: Kind, host: string, id: string): string => `${kind}|${refKey(host, id)}`;
const teamsReducer = peopleReducer('teams');
const projectsReducer = peopleReducer('projects');
const usersReducer = peopleReducer('users');

/** The sidebar: the teams of the shown hosts that list them, then their projects, each with how many belong. */
export default function TeamsExplorer(): ReactElement {
  const scena = useScena();
  const { t } = useI18n();
  const shown = useShownHosts();
  const teamHosts = useServingHosts(shown, channelScheme('teams'));
  const projectHosts = useServingHosts(shown, channelScheme('projects'));
  const userHosts = useServingHosts(shown, channelScheme('users'));
  const hostName = useHostNames();
  const multi = embedMode() === 'multi';
  const teams = useChannelOnEach<PeopleState<Named>>(teamHosts, PEOPLE.teams.channel, teamsReducer);
  const projects = useChannelOnEach<PeopleState<Named>>(projectHosts, PEOPLE.projects.channel, projectsReducer);
  const users = useChannelOnEach<PeopleState<ListedUser>>(userHosts, PEOPLE.users.channel, usersReducer);
  const active = useStore<{ host: string; domain: Kind; id: string }>(ACTIVE_TEAM);

  const rows = useMemo<Row[]>(() => {
    const usersOf = (host: string): ListedUser[] => users.states[userHosts.indexOf(host)]?.records.map((one) => one.record) ?? [];
    const row = (kind: Kind, host: string, named: Named): Row => {
      const key = rowKey(kind, host, named.id);
      const run = (command: string): void => { void scena.commands.execute(command, { host, id: named.id }); };
      const item = (title: string, command: string, extra: Partial<PickerAction> = {}): PickerAction => ({ title, onSelect: (menu) => { menu.closeMenu(); run(command); }, ...extra });
      const members = membersOf(kind, named.id, usersOf(host)).length;
      const title = named.title !== undefined && named.title !== '' ? named.title : named.id;
      return {
        key,
        dot: 'quiet',
        dotLabel: title,
        title,
        group: { key: kind, label: t(kind === 'teams' ? 'teams/explorer/teams' : 'teams/explorer/projects') },
        lines: [[multi ? hostName(host) : undefined, title === named.id ? undefined : named.id, t('teams/explorer/members', { count: members })]
          .filter((bit) => bit !== undefined).join(' \u{00B7} ')],
        menu: [
          item(t('teams/actions/open'), kind === 'teams' ? 'ahp.openTeam' : 'ahp.openProject'),
          item(t('teams/actions/delete'), kind === 'teams' ? 'ahp.deleteTeam' : 'ahp.deleteProject', { group: 'more', color: 'red' }),
        ],
      };
    };
    const listed = (kind: Kind, hosts: string[], states: (PeopleState<Named> | undefined)[]): Row[] => hosts
      .flatMap((host, at) => (states[at]?.records ?? []).map((one) => ({ host, named: one.record })))
      .sort((a, b) => (a.named.title ?? a.named.id).localeCompare(b.named.title ?? b.named.id))
      .map(({ host, named }) => row(kind, host, named));
    return [...listed('teams', teamHosts, teams.states), ...listed('projects', projectHosts, projects.states)];
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamHosts, projectHosts, userHosts, teams.states, projects.states, users.states, hostName, t]);

  const error = multi ? null : teams.errors[0] ?? null;
  const read = multi ? teams.states.some((one) => one !== undefined) : teams.states[0] !== undefined;
  const notice = teamHosts.length === 0
    ? <p className="web-note web-explorer__empty">{t('teams/explorer/notServed')}</p>
    : error !== null
      ? <Alert tone="danger" title={t('teams/notices/none')} message={error} />
      : !read
        ? <Spinner label={t('teams/notices/reading')} />
        : rows.length === 0 ? <p className="web-note web-explorer__empty">{t('teams/explorer/empty')}</p> : null;

  return (
    <ExplorerList
      label={t('teams/explorer/title')}
      rows={rows}
      selected={active === undefined ? null : rowKey(active.domain, active.host, active.id)}
      onOpen={(key) => {
        const cut = key.indexOf('|');
        const kind = key.slice(0, cut) as Kind;
        void scena.commands.execute(kind === 'teams' ? 'ahp.openTeam' : 'ahp.openProject', refOf(key.slice(cut + 1)));
      }}
      notice={notice}
      filterLabel={t('teams/explorer/filter')}
      hostLines={multi}
    />
  );
}
