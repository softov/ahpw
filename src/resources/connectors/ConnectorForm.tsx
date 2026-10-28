import { useEffect, useMemo, useState, type ReactElement } from 'react';
import { useI18n, useScena, useStore } from '@softov/scena/react';
import { Alert, Button, SchemaForm, Spinner, type JsonSchemaObject } from '@softov/scena/ui';
import { JsonCodeEditor } from '../editor/JsonCodeEditor.js';
import { SETTINGS_VIEWS } from '../editor/yamlView.js';
import { useChannel } from '../../bridges/channel.js';
import { ADAPTERS, adaptersReducer, CONNECTORS, connectorsReducer, putConnector, type AdapterRow, type ConnectorOwner, type ConnectorRow, type ConnectorWanted } from '../../bridges/connectors.js';
import { ahpPaths } from '../../bridges/data.js';
import { NO_OFFERS, type Offers } from '../../bridges/offers.js';
import { PEOPLE, peopleReducer, readOwnUser, servesPeople, type ListedUser, type PeopleState } from '../../bridges/people.js';
import { PLUGINS, pluginsReducer, type PluginRow } from '../../bridges/plugins.js';
import { hostSaid } from '../../bridges/said.js';
import { HostIcon } from '../../shell/HostIcon.js';
import { PageAlert } from '../../shell/view/PageAlert.js';
import { meOn } from './actions.js';
import { AdapterPicker } from './AdapterPicker.js';
import { adapterSchema, configForForm, configForPut, configForSignIn, ID_PATTERN, idFor, ownerChoices, topSchema, type TopValues } from './form.js';
import { SignInStep } from './SignInStep.js';
import { newConnectorTab } from './state.js';

type Bag = Record<string, unknown>;

const usersReducer = peopleReducer('users');
const teamsReducer = peopleReducer('teams');

/**
 * One form for a new connector and for a made one's Settings: the adapter
 * picked on top, then the title, id and owner, and the adapter's own fields
 * below. A new connector's change of adapter clears those fields, and its id
 * follows its title until a person types one; a made one's adapter and id are
 * fixed.
 */
export function ConnectorForm({ host, connector }: { host: string; connector?: ConnectorRow }): ReactElement {
  const scena = useScena();
  const { t } = useI18n();
  const offers = useStore<Offers>(ahpPaths(host).offers) ?? NO_OFFERS;
  const adaptersRead = useChannel<PeopleState<AdapterRow>>(host, ADAPTERS.channel, adaptersReducer);
  const connectorsRead = useChannel<PeopleState<ConnectorRow>>(host, CONNECTORS.channel, connectorsReducer);
  const adapters = useMemo(() => (adaptersRead.state?.records ?? []).map((one) => one.record), [adaptersRead.state]);
  // A new id is suggested past the ones this reader sees; the host refuses one it already holds.
  const taken = useMemo(() => (connectorsRead.state?.records ?? []).map((one) => one.id), [connectorsRead.state]);
  const me = meOn(offers);
  const editing = connector !== undefined;
  const plugins = useChannel<PeopleState<PluginRow>>(host, PLUGINS.channel, pluginsReducer);
  const labelOf = (plugin: string): string =>
    plugin === 'host' ? t('connectors/owners/host') : plugins.state?.records.find((one) => one.id === plugin)?.record.title ?? plugin;
  // A root connection may name any user or team as the owner; a person names only their own.
  const users = useChannel<PeopleState<ListedUser>>(host, me === undefined && servesPeople(offers, 'users') ? PEOPLE.users.channel : undefined, usersReducer);
  const teams = useChannel<PeopleState<{ id: string }>>(host, me === undefined && servesPeople(offers, 'teams') ? PEOPLE.teams.channel : undefined, teamsReducer);

  // The person's record names their teams and grants; a root connection has none.
  const [user, setUser] = useState<ListedUser | undefined>(undefined);
  const [userRead, setUserRead] = useState(me === undefined);
  useEffect(() => {
    if (me === undefined) return undefined;
    let live = true;
    readOwnUser(host, offers).then((one) => { if (live) setUser(one); }, () => undefined).finally(() => { if (live) setUserRead(true); });
    return () => { live = false; };
  }, [host, offers, me]);

  const heldTop = useMemo<TopValues>(() => ({
    adapter: connector?.adapter ?? '',
    id: connector?.id ?? '',
    title: connector?.title ?? '',
    owner: connector?.owner ?? me ?? 'host',
  }), [connector, me]);
  const heldConfig = useMemo<Bag>(() => configForForm(connector?.config ?? {}), [connector]);
  const [top, setTop] = useState<TopValues>(heldTop);
  const [config, setConfig] = useState<Bag>(heldConfig);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [jsonValid, setJsonValid] = useState(true);

  // What the host holds now, whenever it changes.
  useEffect(() => { setTop(heldTop); setConfig(heldConfig); }, [heldTop, heldConfig]);

  const changeTop = (next: Bag): void => {
    let wanted = next as unknown as TopValues;
    if (!editing && wanted.adapter !== top.adapter) setConfig({});
    // The id follows the title, or the adapter while there is none, until a person types one of their own.
    if (!editing && wanted.id === top.id && (top.id === '' || top.id === idFor(top.title, top.adapter, taken))) {
      wanted = { ...wanted, id: idFor(wanted.title, wanted.adapter, taken) };
    }
    setTop(wanted);
    setSaved(false);
  };

  const owners = ownerChoices(me, user, {
    me: t('connectors/owners/me'),
    team: (team) => t('connectors/owners/team', { team }),
    user: (user) => t('connectors/owners/user', { user }),
    host: t('connectors/owners/host'),
  }, connector?.owner, {
    users: (users.state?.records ?? []).map((one) => one.id),
    teams: (teams.state?.records ?? []).map((one) => one.id),
  });
  // A new connector's owner is the first one this reader may name.
  useEffect(() => {
    if (!editing && owners[0] !== undefined && !owners.some((one) => one.value === top.owner)) setTop((held) => ({ ...held, owner: owners[0]!.value }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing, owners.map((one) => one.value).join('\n'), top.owner]);

  const adapter = adapters.find((one) => one.name === top.adapter);
  const head = topSchema(owners, editing, {
    id: t('connectors/form/id'),
    idHint: t('connectors/form/idHint'),
    title: t('connectors/form/title'),
    titleHint: t('connectors/form/titleHint'),
    owner: t('connectors/form/owner'),
  });
  const fields: JsonSchemaObject | undefined = adapter === undefined ? undefined : adapterSchema(adapter.schema, connector?.config ?? {}, t('connectors/form/secretKept'));

  // Without connector:list the host lists no adapters, so a new connector has nothing to be made from.
  if (adaptersRead.error !== null && !editing) return <PageAlert tone="warning" title={t('connectors/form/noAdapters')} message={adaptersRead.error} />;
  if (adaptersRead.state === undefined && adaptersRead.error === null) return <Spinner label={t('connectors/notices/reading')} />;
  if (!userRead) return <Spinner label={t('connectors/notices/reading')} />;
  if (!editing && adapters.length === 0) return <p className="web-note">{t('connectors/form/noAdapters')}</p>;
  if (!editing && owners.length === 0) return <p className="web-note">{t('connectors/form/noPut')}</p>;

  const dirty = JSON.stringify(top) !== JSON.stringify(heldTop) || JSON.stringify(config) !== JSON.stringify(heldConfig);
  const ready = adapter !== undefined && ID_PATTERN.test(top.id) && top.owner !== '';
  const wantedWith = (sent: Bag): ConnectorWanted => ({
    id: top.id,
    adapter: top.adapter,
    owner: top.owner as ConnectorOwner,
    ...(top.title.trim() === '' ? {} : { title: top.title.trim() }),
    config: sent,
  });
  // What a put or a new connector's sign-in answered: a new form gives way to the connector, a made one says it is saved.
  const afterPut = (row: ConnectorRow): void => {
    if (editing) { setSaved(true); return; }
    scena.surfaces.close(newConnectorTab(host));
    void scena.commands.execute('ahp.openConnector', { host, id: row.id, title: row.title || row.id });
  };
  const save = (): void => {
    if (adapter === undefined) return;
    setBusy(true);
    setFailure(null);
    putConnector(host, wantedWith(configForPut(config, adapter.schema))).then(
      (row) => { setBusy(false); afterPut(row); },
      (caught: unknown) => { setBusy(false); setFailure(hostSaid(caught)); },
    );
  };

  return (
    <div className="web-connector-form">
      {editing && adapter === undefined ? (
        <p className="web-note">{connector.adapter === undefined ? t('connectors/page/noAdapter') : t('connectors/page/unknownAdapter', { adapter: connector.adapter })}</p>
      ) : null}
      {/* A new form has nothing to go back to; a made one goes back to what the host holds. */}
      <div className="web-connector-form__pick">
        <span className="web-connector-form__label">{t('connectors/form/adapter')}{editing ? null : <span className="web-connector-form__required" aria-hidden="true">*</span>}</span>
        <AdapterPicker adapters={adapters} value={top.adapter} labelOf={labelOf} fixed={editing} onPick={(name) => changeTop({ ...top, adapter: name } as unknown as Bag)} />
      </div>
      {!editing && adapter === undefined ? null : <SchemaForm schema={head} value={top as unknown as Bag} baseline={(editing ? heldTop : top) as unknown as Bag} onChange={changeTop} jsonTextRoot={false} />}
      {fields === undefined ? null : (
        <section className="web-connector-form__adapter" aria-label={t('connectors/form/settingsOf', { adapter: adapter!.title })}>
          <h3 className="web-connector-form__heading web-host-label"><HostIcon icons={adapter!.icons} size={16} />{t('connectors/form/settingsOf', { adapter: adapter!.title })}</h3>
          {/* The schema says what the form is when it can; the adapter says it otherwise. */}
          {adapter!.description === '' || typeof adapter!.schema.description === 'string' ? null : <p className="web-note">{adapter!.description}</p>}
          <SchemaForm key={top.adapter} schema={fields} views={SETTINGS_VIEWS} value={config} baseline={heldConfig} onChange={(next) => { setConfig(next); setSaved(false); }} jsonEditor={JsonCodeEditor} onJsonValidChange={setJsonValid} fieldActions />
          {adapter!.signIn === undefined ? null : (
            <SignInStep
              key={top.adapter}
              host={host}
              signIn={adapter!.signIn}
              provider={adapter!.title}
              wanted={wantedWith(configForSignIn(config, adapter!.schema, adapter!.signIn.field))}
              disabled={!ready || busy}
              // A made connector's step says it is signed in, so the form does not say "Saved." too.
              onDone={(row) => { if (!editing) afterPut(row); }}
            />
          )}
        </section>
      )}
      {failure === null ? null : <Alert tone="danger" title={t('connectors/form/failed')} message={failure} />}
      <div className="web-page__actions">
        <Button label={t(editing ? 'connectors/form/save' : 'connectors/form/create')} variant="primary" disabled={!ready || busy || !jsonValid || (editing && !dirty)} {...(jsonValid ? {} : { title: t('host/settings/fixJson') })} onClick={save} />
        {editing ? <Button label={t('connectors/form/reset')} disabled={!dirty || busy} onClick={() => { setTop(heldTop); setConfig(heldConfig); setFailure(null); }} /> : null}
        {saved && !dirty ? <span className="web-note">{t('connectors/form/saved')}</span> : null}
      </div>
    </div>
  );
}
