import { useState, type ReactElement } from 'react';
import { useI18n, useScena, useStore } from '@softov/scena/react';
import { Button, Spinner, Text } from '@softov/scena/ui';
import { ahpPaths } from '../../bridges/data.js';
import { useChannel } from '../../bridges/channel.js';
import { NO_OFFERS, type Offers } from '../../bridges/offers.js';
import {
  BUILT_IN_ROLES, membershipOptions, PEOPLE, peopleReducer, putPerson, servesPeople, userBody, userFields, writesPeople,
  type ListedUser, type Named, type PeopleState, type Role, type UserFields,
} from '../../bridges/people.js';
import { confirm } from '../../shell/notify/index.js';
import { Field } from '../../shell/view/Field.js';
import { PageAlert } from '../../shell/view/PageAlert.js';
import { isRecordId } from './form.js';
import { personTab } from './state.js';

const usersReducer = peopleReducer('users');
const rolesReducer = peopleReducer('roles');
const teamsReducer = peopleReducer('teams');
const projectsReducer = peopleReducer('projects');

/** The role that grants everything; taking it off oneself asks first. */
const ADMIN = 'admin';

/** A user: their roles, what their work is charged to, and how they sign in. A new user when there is no `id`. */
export default function UserPage({ host, person: id }: { host: string; person?: string }): ReactElement {
  const scena = useScena();
  const { t } = useI18n();
  const fresh = id === undefined;
  const offers = useStore<Offers>(ahpPaths(host).offers) ?? NO_OFFERS;
  const users = useChannel<PeopleState<ListedUser>>(host, PEOPLE.users.channel, usersReducer);
  const roles = useChannel<PeopleState<Role>>(host, servesPeople(offers, 'roles') ? PEOPLE.roles.channel : undefined, rolesReducer);
  const teams = useChannel<PeopleState<Named>>(host, servesPeople(offers, 'teams') ? PEOPLE.teams.channel : undefined, teamsReducer);
  const projects = useChannel<PeopleState<Named>>(host, servesPeople(offers, 'projects') ? PEOPLE.projects.channel : undefined, projectsReducer);
  const [draft, setDraft] = useState<(UserFields & { id: string }) | null>(null);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);

  if (users.error !== null) return <PageAlert tone="danger" title={t('users/notices/none')} message={users.error} />;
  if (users.state === undefined) return <Spinner label={t('users/notices/reading')} />;
  const record = fresh ? undefined : users.state.records.find((one) => one.id === id)?.record;
  if (!fresh && record === undefined) return <PageAlert tone="warning" message={t('users/user/gone')} />;

  const start = { id: id ?? '', ...userFields(record) };
  const shown = draft ?? start;
  const set = (change: Partial<UserFields & { id: string }>): void => setDraft((held) => ({ ...(held ?? start), ...change }));
  const writes = writesPeople(offers, 'users');
  const dirty = draft !== null && JSON.stringify(draft) !== JSON.stringify(start);
  const roleIds = [...new Set([...(roles.state?.records.map((one) => one.id) ?? []), ...Object.keys(BUILT_IN_ROLES), ...shown.roles])].sort();
  const options = membershipOptions(teams.state?.records.map((one) => one.id) ?? [], projects.state?.records.map((one) => one.id) ?? [])
    .filter((one) => !shown.memberships.includes(one));
  const ready = writes && !busy && (fresh ? isRecordId(shown.id) : dirty);
  const tab = personTab('users', host, id);
  // The signed-in person, as `user:<id>`, whose own admin role is not taken away by a slip.
  const self = offers.principal === `user:${id ?? ''}`;

  const toggleRole = (role: string, on: boolean): void => set({ roles: on ? [...shown.roles, role] : shown.roles.filter((one) => one !== role) });
  const dropMembership = (membership: string): void => set({
    memberships: shown.memberships.filter((one) => one !== membership),
    ...(shown.primary === membership ? { primary: '' } : {}),
  });

  const save = async (): Promise<void> => {
    if (self && start.roles.includes(ADMIN) && !shown.roles.includes(ADMIN) && !(await confirm({
      title: t('users/user/dropAdminTitle'),
      body: t('users/user/dropAdminBody'),
      confirmLabel: t('users/user/save'),
      tone: 'danger',
    }))) return;
    setBusy(true);
    setFailure(null);
    const target = shown.id.trim();
    try {
      await putPerson(host, offers, 'users', target, userBody(shown), fresh);
      setDraft(null);
      if (fresh) {
        scena.surfaces.close(tab);
        void scena.commands.execute('ahp.openUser', { host, id: target });
      }
    } catch (caught) {
      setFailure(caught instanceof Error ? caught.message : String(caught));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="web-page web-form">
      <Text variant="h2" text={fresh ? t('users/commands/newUser') : id} />
      {writes ? null : <p className="web-note">{t('users/notices/readOnly')}</p>}

      {fresh ? (
        <Field label={t('users/user/id')} hint={t('users/user/idHint')}>
          <input className="web-field" value={shown.id} autoFocus onChange={(event) => set({ id: event.target.value })} />
        </Field>
      ) : null}

      <div className="web-form__field" role="group" aria-label={t('users/user/roles')}>
        <span className="web-input__label">{t('users/user/roles')}</span>
        {roleIds.length === 0 ? <span className="web-input__hint">{t('users/user/noRoles')}</span> : roleIds.map((role) => (
          <label key={role} className="web-input__row">
            <input type="checkbox" checked={shown.roles.includes(role)} disabled={!writes} onChange={(event) => toggleRole(role, event.target.checked)} />
            <span>{role}</span>
          </label>
        ))}
      </div>

      <div className="web-form__field" role="group" aria-label={t('users/user/memberships')}>
        <span className="web-input__label">{t('users/user/memberships')}</span>
        <div className="web-people__chips">
          {shown.memberships.length === 0 ? <span className="web-input__hint">{t('users/user/noMemberships')}</span> : shown.memberships.map((membership) => (
            <span key={membership} className="web-chip">
              {membership}
              {writes ? (
                <button type="button" className="web-people__chip-drop" aria-label={t('users/user/dropMembership', { membership })} title={t('users/user/dropMembership', { membership })} onClick={() => dropMembership(membership)}>{'\u{00D7}'}</button>
              ) : null}
            </span>
          ))}
        </div>
        {writes && options.length > 0 ? (
          <select className="web-field" value="" aria-label={t('users/user/addMembership')} onChange={(event) => { if (event.target.value !== '') set({ memberships: [...shown.memberships, event.target.value] }); }}>
            <option value="">{t('users/user/addMembership')}</option>
            {options.map((one) => <option key={one} value={one}>{one}</option>)}
          </select>
        ) : null}
        <span className="web-input__hint">{t('users/user/membershipsHint')}</span>
      </div>

      <Field label={t('users/user/primary')} hint={t('users/user/primaryHint')}>
        <select className="web-field" value={shown.primary} disabled={!writes} onChange={(event) => set({ primary: event.target.value })}>
          <option value="">{t('users/user/noPrimary')}</option>
          {shown.memberships.map((one) => <option key={one} value={one}>{one}</option>)}
        </select>
      </Field>

      <Field label={t('users/user/issuer')} hint={t('users/user/issuerHint')}>
        <input className="web-field" value={shown.issuer} readOnly={!writes} onChange={(event) => set({ issuer: event.target.value })} />
      </Field>

      <Field label={t('users/user/rolesFrom')} hint={t('users/user/rolesFromHint')}>
        <input className="web-field" value={shown.rolesFrom} readOnly={!writes} onChange={(event) => set({ rolesFrom: event.target.value })} />
      </Field>

      <p className="web-note">{t('users/user/token', { id: shown.id.trim() === '' ? '<id>' : shown.id.trim() })}</p>

      {failure === null ? null : <PageAlert tone="danger" message={failure} />}
      {writes ? (
        <div className="web-page__actions">
          <Button label={t(fresh ? 'users/user/create' : 'users/user/save')} variant="primary" disabled={!ready} onClick={() => void save()} />
          {fresh ? <Button label={t('users/actions/cancel')} onClick={() => scena.surfaces.close(tab)} /> : (
            <>
              {dirty ? <Button label={t('users/actions/discard')} onClick={() => setDraft(null)} /> : null}
              <Button label={t('users/actions/delete')} variant="danger" onClick={() => void scena.commands.execute('ahp.deleteUser', { host, id })} />
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}
