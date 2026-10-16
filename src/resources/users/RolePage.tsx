import { useState, type ReactElement } from 'react';
import { useI18n, useScena, useStore } from '@softov/scena/react';
import { Button, Spinner, Text } from '@softov/scena/ui';
import { ahpPaths } from '../../bridges/data.js';
import { useChannel } from '../../bridges/channel.js';
import { NO_OFFERS, type Offers } from '../../bridges/offers.js';
import { BUILT_IN_ROLES, PEOPLE, peopleReducer, putPerson, writesPeople, type PeopleState, type Role } from '../../bridges/people.js';
import { Field } from '../../shell/view/Field.js';
import { PageAlert } from '../../shell/view/PageAlert.js';
import { isRecordId, parseGrants } from './form.js';
import { personTab } from './state.js';

const rolesReducer = peopleReducer('roles');

/** A role: what it lets the people who hold it do, one grant a line. A new role when there is no `id`. */
export default function RolePage({ host, person: id }: { host: string; person?: string }): ReactElement {
  const scena = useScena();
  const { t } = useI18n();
  const fresh = id === undefined;
  const offers = useStore<Offers>(ahpPaths(host).offers) ?? NO_OFFERS;
  const roles = useChannel<PeopleState<Role>>(host, PEOPLE.roles.channel, rolesReducer);
  const [draft, setDraft] = useState<{ id: string; grants: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);

  if (roles.error !== null) return <PageAlert tone="danger" title={t('users/notices/none')} message={roles.error} />;
  if (roles.state === undefined) return <Spinner label={t('users/notices/reading')} />;
  const written = fresh ? undefined : roles.state.records.find((one) => one.id === id)?.record;
  // A built-in the file does not replace; saving it writes a role of its name, which then replaces it.
  const builtIn = !fresh && written === undefined && Object.hasOwn(BUILT_IN_ROLES, id) ? BUILT_IN_ROLES[id] : undefined;
  if (!fresh && written === undefined && builtIn === undefined) return <PageAlert tone="warning" message={t('users/role/gone')} />;
  const replaces = written !== undefined && id !== undefined && Object.hasOwn(BUILT_IN_ROLES, id);

  const start = { id: id ?? '', grants: (written?.grants ?? builtIn ?? []).join('\n') };
  const shown = draft ?? start;
  const set = (change: Partial<typeof start>): void => setDraft((held) => ({ ...(held ?? start), ...change }));
  const writes = writesPeople(offers, 'roles');
  const parsed = parseGrants(shown.grants);
  const dirty = draft !== null && JSON.stringify(draft) !== JSON.stringify(start);
  const ready = writes && !busy && parsed.problems.length === 0 && (fresh ? isRecordId(shown.id) : dirty);
  const tab = personTab('roles', host, id);

  const save = async (): Promise<void> => {
    setBusy(true);
    setFailure(null);
    const target = shown.id.trim();
    try {
      await putPerson(host, offers, 'roles', target, { grants: parsed.grants }, fresh);
      setDraft(null);
      if (fresh) {
        scena.surfaces.close(tab);
        void scena.commands.execute('ahp.openRole', { host, id: target });
      }
    } catch (caught) {
      setFailure(caught instanceof Error ? caught.message : String(caught));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="web-page web-form">
      <Text variant="h2" text={fresh ? t('users/commands/newRole') : id} />
      {writes ? null : <p className="web-note">{t('users/notices/readOnly')}</p>}
      {builtIn === undefined ? null : <p className="web-note">{t('users/role/builtInNote')}</p>}
      {replaces ? <p className="web-note">{t('users/role/replacesNote')}</p> : null}

      {fresh ? (
        <Field label={t('users/role/id')} hint={t('users/role/idHint')}>
          <input className="web-field" value={shown.id} autoFocus onChange={(event) => set({ id: event.target.value })} />
        </Field>
      ) : null}

      <Field label={t('users/role/grants')} hint={t('users/role/grantsHint')}>
        <textarea
          className="web-field web-people__grants"
          rows={Math.max(6, shown.grants.split('\n').length + 1)}
          spellCheck={false}
          value={shown.grants}
          readOnly={!writes}
          onChange={(event) => set({ grants: event.target.value })}
        />
      </Field>
      {parsed.problems.map((problem) => (
        <p key={problem.line} className="web-people__problem">{t('users/role/badGrant', { line: problem.line, text: problem.text })}</p>
      ))}

      {failure === null ? null : <PageAlert tone="danger" message={failure} />}
      {writes ? (
        <div className="web-page__actions">
          <Button label={t(fresh ? 'users/role/create' : 'users/role/save')} variant="primary" disabled={!ready} onClick={() => void save()} />
          {fresh ? <Button label={t('users/actions/cancel')} onClick={() => scena.surfaces.close(tab)} /> : (
            <>
              {dirty ? <Button label={t('users/actions/discard')} onClick={() => setDraft(null)} /> : null}
              {builtIn === undefined ? <Button label={t('users/actions/delete')} variant="danger" onClick={() => void scena.commands.execute('ahp.deleteRole', { host, id })} /> : null}
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}
