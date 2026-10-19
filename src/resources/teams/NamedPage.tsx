import { useState, type ReactElement } from 'react';
import { useI18n, useScena, useStore } from '@softov/scena/react';
import { Alert, Button, Spinner, Text } from '@softov/scena/ui';
import { ahpPaths } from '../../bridges/data.js';
import { useChannel } from '../../bridges/channel.js';
import { NO_OFFERS, type Offers } from '../../bridges/offers.js';
import {
  membersOf, membershipOf, PEOPLE, peopleReducer, putPerson, servesPeople, userBody, userFields, writesPeople,
  type ListedUser, type Named, type PeopleState,
} from '../../bridges/people.js';
import { failed } from '../../shell/notify/index.js';
import { Field } from '../../shell/view/Field.js';
import { PageAlert } from '../../shell/view/PageAlert.js';
import { isRecordId } from '../users/form.js';
import { teamTab } from './state.js';

type Kind = 'teams' | 'projects';
const reducers = { teams: peopleReducer('teams'), projects: peopleReducer('projects') };
const usersReducer = peopleReducer('users');
const teamsReducer = peopleReducer('teams');

/**
 * A team or a project: its title, and who belongs to it, worked out from the
 * users' memberships. Adding or taking off a member writes that user. A new
 * one when there is no `person`.
 */
export default function NamedPage({ host, domain, person: id }: { host: string; domain: Kind; person?: string }): ReactElement {
  const scena = useScena();
  const { t } = useI18n();
  const fresh = id === undefined;
  const word = domain === 'teams' ? 'team' : 'project';
  const offers = useStore<Offers>(ahpPaths(host).offers) ?? NO_OFFERS;
  const named = useChannel<PeopleState<Named>>(host, PEOPLE[domain].channel, reducers[domain]);
  const users = useChannel<PeopleState<ListedUser>>(host, !fresh && servesPeople(offers, 'users') ? PEOPLE.users.channel : undefined, usersReducer);
  // A project's member works on it through a team, so adding one picks the team.
  const teams = useChannel<PeopleState<Named>>(host, !fresh && domain === 'projects' ? PEOPLE.teams.channel : undefined, teamsReducer);
  const [draft, setDraft] = useState<{ id: string; title: string } | null>(null);
  const [adding, setAdding] = useState<{ user: string; team: string }>({ user: '', team: '' });
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);

  if (named.error !== null) return <PageAlert tone="danger" title={t('teams/notices/none')} message={named.error} />;
  if (named.state === undefined) return <Spinner label={t('teams/notices/reading')} />;
  const record = fresh ? undefined : named.state.records.find((one) => one.id === id)?.record;
  if (!fresh && record === undefined) return <PageAlert tone="warning" message={t(`teams/${word}/gone`)} />;

  const start = { id: id ?? '', title: record?.title ?? '' };
  const shown = draft ?? start;
  const set = (change: Partial<typeof start>): void => setDraft((held) => ({ ...(held ?? start), ...change }));
  const writes = writesPeople(offers, domain);
  const writesUsers = writesPeople(offers, 'users');
  const dirty = draft !== null && JSON.stringify(draft) !== JSON.stringify(start);
  const ready = writes && !busy && (fresh ? isRecordId(shown.id) : dirty);
  const tab = teamTab(domain, host, id);
  const everyone = users.state?.records.map((one) => one.record) ?? [];
  const members = fresh ? [] : membersOf(domain, id, everyone);
  const outside = everyone.filter((user) => !members.some((member) => member.user === user.id));
  const teamIds = teams.state?.records.map((one) => one.id) ?? [];

  const save = async (): Promise<void> => {
    setBusy(true);
    setFailure(null);
    const target = shown.id.trim();
    try {
      await putPerson(host, offers, domain, target, { title: shown.title.trim() }, fresh);
      setDraft(null);
      if (fresh) {
        scena.surfaces.close(tab);
        void scena.commands.execute(domain === 'teams' ? 'ahp.openTeam' : 'ahp.openProject', { host, id: target });
      }
    } catch (caught) {
      setFailure(caught instanceof Error ? caught.message : String(caught));
    } finally {
      setBusy(false);
    }
  };

  /** Writes one user's memberships, keeping the rest of what a person edits on them. */
  const writeMemberships = (user: ListedUser, memberships: string[]): void => {
    const fields = userFields(user);
    const primary = memberships.includes(fields.primary) ? fields.primary : '';
    void putPerson(host, offers, 'users', user.id, userBody({ ...fields, memberships, primary }), false)
      .catch((error: unknown) => failed(t('teams/actions/failed'), error));
  };
  const addMember = (): void => {
    const user = everyone.find((one) => one.id === adding.user);
    if (user === undefined || id === undefined) return;
    const membership = domain === 'teams' ? membershipOf(id) : membershipOf(adding.team, id);
    writeMemberships(user, [...(user.memberships ?? []), membership]);
    setAdding({ user: '', team: '' });
  };
  const canAdd = adding.user !== '' && (domain === 'teams' || adding.team !== '');

  return (
    <div className="web-page web-form">
      <Text variant="h2" text={fresh ? t(domain === 'teams' ? 'teams/commands/newTeam' : 'teams/commands/newProject') : (record?.title || id)} />
      {writes ? null : <p className="web-note">{t('teams/notices/readOnly')}</p>}

      {fresh ? (
        <Field label={t('teams/named/id')} hint={t(`teams/${word}/idHint`)}>
          <input className="web-field" value={shown.id} autoFocus onChange={(event) => set({ id: event.target.value })} />
        </Field>
      ) : null}

      <Field label={t('teams/named/title')} hint={t('teams/named/titleHint')}>
        <input className="web-field" value={shown.title} readOnly={!writes} onChange={(event) => set({ title: event.target.value })} />
      </Field>

      {failure === null ? null : <Alert tone="danger" message={failure} />}
      {writes ? (
        <div className="web-page__actions">
          <Button label={t(fresh ? `teams/${word}/create` : 'teams/named/save')} variant="primary" disabled={!ready} onClick={() => void save()} />
          {fresh ? <Button label={t('teams/actions/cancel')} onClick={() => scena.surfaces.close(tab)} /> : (
            <>
              {dirty ? <Button label={t('teams/actions/discard')} onClick={() => setDraft(null)} /> : null}
              <Button label={t('teams/actions/delete')} variant="danger" onClick={() => void scena.commands.execute(domain === 'teams' ? 'ahp.deleteTeam' : 'ahp.deleteProject', { host, id })} />
            </>
          )}
        </div>
      ) : null}

      {fresh || !servesPeople(offers, 'users') ? null : (
        <section className="web-people__members" aria-label={t('teams/named/members')}>
          <Text variant="h3" text={t('teams/named/members')} />
          <p className="web-note">{t(`teams/${word}/membersHint`)}</p>
          {users.state === undefined ? <Spinner label={t('users/notices/reading')} /> : members.length === 0 ? <p className="web-note">{t('teams/named/noMembers')}</p> : (
            <ul className="web-people__member-list">
              {members.map((member) => {
                const user = everyone.find((one) => one.id === member.user)!;
                return (
                  <li key={member.user} className="web-people__member">
                    <button type="button" className="web-people__member-name" onClick={() => void scena.commands.execute('ahp.openUser', { host, id: member.user })}>{member.user}</button>
                    <span className="web-people__chips">
                      {member.through.map((membership) => (
                        <span key={membership} className="web-chip" data-on={user.primary === membership ? 'true' : undefined} title={user.primary === membership ? t('teams/named/primary') : undefined}>
                          {membership}
                          {writesUsers ? (
                            <button type="button" className="web-people__chip-drop" aria-label={t('users/user/dropMembership', { membership })} title={t('users/user/dropMembership', { membership })} onClick={() => writeMemberships(user, (user.memberships ?? []).filter((one) => one !== membership))}>{'\u{00D7}'}</button>
                          ) : null}
                        </span>
                      ))}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
          {writesUsers && outside.length > 0 ? (
            <div className="web-people__add">
              <select className="web-field" value={adding.user} aria-label={t('teams/named/addWho')} onChange={(event) => setAdding({ ...adding, user: event.target.value })}>
                <option value="">{t('teams/named/addWho')}</option>
                {outside.map((user) => <option key={user.id} value={user.id}>{user.id}</option>)}
              </select>
              {domain === 'projects' ? (
                <select className="web-field" value={adding.team} aria-label={t('teams/named/through')} onChange={(event) => setAdding({ ...adding, team: event.target.value })}>
                  <option value="">{t('teams/named/through')}</option>
                  {teamIds.map((team) => <option key={team} value={team}>{team}</option>)}
                </select>
              ) : null}
              <Button label={t('teams/named/add')} disabled={!canAdd} onClick={addMember} />
            </div>
          ) : null}
        </section>
      )}
    </div>
  );
}
