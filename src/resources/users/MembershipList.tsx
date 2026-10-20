import type { ReactElement } from 'react';
import { useI18n } from '@softov/scena/react';
import { Button, Chip } from '@softov/scena/ui';
import type { Named } from '../../bridges/people.js';
import { membershipOf, membershipParts, projectChoices, titled } from './memberships.js';
import { PickTwo } from './PickTwo.js';

interface MembershipListProps {
  memberships: readonly string[];
  primary: string;
  teams: readonly Named[];
  projects: readonly Named[];
  writes: boolean;
  onChange: (change: { memberships?: string[]; primary?: string }) => void;
}

/**
 * A person's teams and projects: one row a membership, its team then which of
 * the team's projects, marked primary or not; and *Add to a team*, then
 * *Which projects*, to add one (decision: a user's page lists memberships by
 * team, as ahpapp does).
 */
export function MembershipList({ memberships, primary, teams, projects, writes, onChange }: MembershipListProps): ReactElement {
  const { t } = useI18n();
  const scopeWord = (project: string | null): string => scopeTitle(t, projects, project);
  const drop = (membership: string): void => onChange({
    memberships: memberships.filter((one) => one !== membership),
    // A primary that names nothing they belong to goes with it.
    ...(primary === membership ? { primary: '' } : {}),
  });

  return (
    <div className="web-memberships">
      {memberships.length === 0 ? <p className="web-note">{t('users/user/noMemberships')}</p> : (
        <ul className="web-memberships__list">
          {memberships.map((membership) => {
            const { team, project } = membershipParts(membership);
            const isPrimary = primary === membership;
            return (
              <li key={membership} className="web-memberships__row">
                <span className="web-memberships__name">
                  {titled(teams, team)}
                  <span className="web-memberships__scope">{` \u{00B7} ${scopeWord(project)}`}</span>
                </span>
                {isPrimary || writes ? (
                  <Chip
                    label={t('users/user/primaryMark')}
                    state={isPrimary ? 'on' : 'off'}
                    disabled={!writes}
                    title={t(isPrimary ? 'users/user/unmakePrimary' : 'users/user/makePrimary')}
                    onClick={() => onChange({ primary: isPrimary ? '' : membership })}
                  />
                ) : null}
                {writes ? (
                  <Button variant="ghost" size="xs" title={t('users/user/dropMembership', { name: titled(teams, team) })} onClick={() => drop(membership)}>
                    <span role="img" aria-label={t('users/user/dropMembership', { name: titled(teams, team) })}>{'\u{2715}'}</span>
                  </Button>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
      {writes && teams.length > 0 ? (
        <PickTwo<string | null>
          firstLabel={t('users/user/addTeam')}
          firstHeader={t('teams/explorer/teams')}
          firsts={teams.map((one) => ({ value: one.id, title: one.title || one.id }))}
          secondLabel={t('users/user/whichProjects')}
          secondHeader={t('teams/explorer/projects')}
          seconds={(team) => projectChoices(team, projects.map((one) => one.id), memberships).map((project) => ({ value: project, title: scopeWord(project) }))}
          onPick={(team, project) => onChange({ memberships: [...memberships, membershipOf({ team, project })] })}
        />
      ) : null}
      <span className="web-input__hint">{t('users/user/primaryNote')}</span>
    </div>
  );
}

/** How a membership's project reads: every project, the team alone, or the project's title. */
export const scopeTitle = (t: (key: string) => string, projects: readonly Named[], project: string | null): string =>
  (project === null ? t('users/user/noProject') : project === '*' ? t('users/user/everyProject') : titled(projects, project));
