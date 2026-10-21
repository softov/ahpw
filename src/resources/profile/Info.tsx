import { useEffect, useState, type ReactElement } from 'react';
import { useI18n, useStore } from '@softov/scena/react';
import { Chip, DetailList, Spinner, Text } from '@softov/scena/ui';
import { useChannel } from '../../bridges/channel.js';
import { ahpPaths } from '../../bridges/data.js';
import { NO_OFFERS, type Offers } from '../../bridges/offers.js';
import { PEOPLE, peopleReducer, readOwnUser, selfId, servesPeople, type ListedUser, type Named, type PeopleState } from '../../bridges/people.js';
import { ownLimits, type PolicyLimits } from '../../bridges/policies.js';
import { servesUsage, usagePeriods, type UsagePeriods } from '../../bridges/usage.js';
import { PageAlert } from '../../shell/view/PageAlert.js';
import { RemovableChip } from '../../shell/view/RemovableChip.js';
import { LimitLine } from '../usage/Limits.js';
import { totalLine } from '../usage/words.js';
import { membershipParts, titled } from '../users/memberships.js';
import { scopeTitle } from '../users/MembershipList.js';
import { EMOJIcon } from '../emojis.js';

const teamsReducer = peopleReducer('teams');
const projectsReducer = peopleReducer('projects');

/** A read the page shows: still asking, its answer, or why it failed. */
type Read<T> = { state: 'reading' } | { state: 'held'; value: T } | { state: 'failed'; error: string };

const said = (caught: unknown): string => (caught instanceof Error ? caught.message : String(caught));

/** What `ask` answers, as a `Read`, asked again when `deps` change; undefined when there is nothing to ask. */
function useRead<T>(ask: (() => Promise<T>) | undefined, deps: readonly unknown[]): Read<T> | undefined {
  const [read, setRead] = useState<Read<T> | undefined>(undefined);
  useEffect(() => {
    if (ask === undefined) {
      setRead(undefined);
      return undefined;
    }
    let live = true;
    setRead({ state: 'reading' });
    ask().then((value) => { if (live) setRead({ state: 'held', value }); }, (caught: unknown) => { if (live) setRead({ state: 'failed', error: said(caught) }); });
    return () => { live = false; };
    // The asker is rebuilt every render; what it reads is in `deps`.
  }, deps);
  return read;
}

/**
 * Who the person is on this host, read-only: their roles, teams and projects,
 * sign-in, what they used today, this week and this month, and the limits
 * that hold them. Each part reads on its own, so one the host refuses does
 * not hide the rest.
 */
export function Info({ host }: { host: string }): ReactElement {
  const { t } = useI18n();
  const offers = useStore<Offers>(ahpPaths(host).offers) ?? NO_OFFERS;
  const id = selfId(offers);
  // Their titles where the person may list them; ids where not.
  const teams = useChannel<PeopleState<Named>>(host, servesPeople(offers, 'teams') ? PEOPLE.teams.channel : undefined, teamsReducer);
  const projects = useChannel<PeopleState<Named>>(host, servesPeople(offers, 'projects') ? PEOPLE.projects.channel : undefined, projectsReducer);
  const record = useRead<ListedUser>(() => readOwnUser(host, offers), [host, offers]);
  const usage = useRead<UsagePeriods>(id !== undefined && servesUsage(offers) ? () => usagePeriods(host, offers, `user:${id}`) : undefined, [host, offers, id]);
  const limits = useRead<PolicyLimits[] | undefined>(() => ownLimits(host, offers), [host, offers]);

  if (record === undefined || record.state === 'reading') return <Spinner label={t('profile/notices/reading')} />;
  if (record.state === 'failed') return <PageAlert tone="danger" title={t('profile/notices/none')} message={record.error} />;
  const user = record.value;
  const teamList = teams.state?.records.map((one) => one.record) ?? [];
  const projectList = projects.state?.records.map((one) => one.record) ?? [];
  const memberships = user.memberships ?? [];

  /** A section: its icon and title over its body, a line above it, as the user page's. */
  const section = (icon: string, title: string, body: ReactElement): ReactElement => (
    <section className="web-user__section" aria-label={title}>
      <Text variant="h3" text={`${icon} ${title}`} />
      {body}
    </section>
  );

  return (
    <div className="web-profile__info">
      {section(EMOJIcon.roles, t('profile/info/roles'), user.roles.length === 0 ? <p className="web-note">{t('profile/info/noRoles')}</p> : (
        <div className="web-role-pills">
          {user.roles.map((role) => <RemovableChip key={role} label={role} removeLabel={role} />)}
        </div>
      ))}

      {section(EMOJIcon.teams, t('profile/info/memberships'), memberships.length === 0 ? <p className="web-note">{t('profile/info/noMemberships')}</p> : (
        <ul className="web-memberships__list">
          {memberships.map((membership) => {
            const { team, project } = membershipParts(membership);
            return (
              <li key={membership} className="web-memberships__row">
                <span className="web-memberships__name">
                  {titled(teamList, team)}
                  <span className="web-memberships__scope">{` \u{00B7} ${scopeTitle(t, projectList, project)}`}</span>
                </span>
                {user.primary === membership ? <Chip label={t('users/user/primaryMark')} state="on" disabled /> : null}
              </li>
            );
          })}
        </ul>
      ))}

      {section(EMOJIcon.signIn, t('profile/info/signIn'), (
        <DetailList
          items={[
            { label: t('profile/info/issuer'), value: user.issuer ?? t('profile/info/issuerDefault') },
            ...(user.rolesFrom === undefined ? [] : [{ label: t('profile/info/rolesFrom'), value: user.rolesFrom }]),
          ]}
        />
      ))}

      {usage === undefined ? null : section(EMOJIcon.usage, t('profile/info/usage'), usage.state === 'reading' ? <Spinner label={t('profile/notices/reading')} />
        : usage.state === 'failed' ? <p className="web-note">{t('profile/info/usageFailed', { error: usage.error })}</p> : (
          <DetailList items={(['day', 'week', 'month'] as const).map((period) => ({ label: t(`usage/period/${period}`), value: totalLine(usage.value[period]) || t('usage/explorer/nothing') }))} />
        ))}

      {limits === undefined ? null : section(EMOJIcon.policies, t('profile/info/limits'), limits.state === 'reading' ? <Spinner label={t('profile/notices/reading')} />
        : limits.state === 'failed' ? <p className="web-note">{t('profile/info/limitsFailed', { error: limits.error })}</p>
          : (limits.value ?? []).flatMap((policy) => policy.limits).length === 0 ? <p className="web-note">{t('profile/info/noLimits')}</p> : (
            <ul className="web-profile__limits">
              {(limits.value ?? []).flatMap((policy) => policy.limits.map((figure, at) => (
                <li key={`${policy.id}\u{0000}${String(at)}`} className="web-profile__limit">
                  <span className="web-profile__limit-name">{policy.id}</span>
                  <LimitLine figure={figure} />
                </li>
              )))}
            </ul>
          ))}
    </div>
  );
}
