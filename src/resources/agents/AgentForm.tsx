import { useEffect, useMemo, useState, type ReactElement } from 'react';
import { useI18n, useScena, useStore } from '@softov/scena/react';
import { Alert, Button, SchemaForm, Spinner, type EnumOption, type JsonSchemaObject } from '@softov/scena/ui';
import { JsonCodeEditor } from '../editor/JsonCodeEditor.js';
import { SETTINGS_VIEWS } from '../editor/yamlView.js';
import type { AgentInfo } from '@microsoft/agent-host-protocol';
import { ENGINES, AGENTS, enginesReducer, agentsReducer, putAgent, type EngineRow, type AgentRow } from '../../bridges/agents.js';
import { useChannel } from '../../bridges/channel.js';
import { ahpPaths } from '../../bridges/data.js';
import type { Icon } from '../../bridges/icons.js';
import { NO_OFFERS, type Offers } from '../../bridges/offers.js';
import { PEOPLE, peopleReducer, readOwnUser, servesPeople, type ListedUser, type PeopleState } from '../../bridges/people.js';
import { PLUGINS, pluginsReducer, type PluginRow } from '../../bridges/plugins.js';
import { hostSaid } from '../../bridges/said.js';
import { HostIcon } from '../../shell/HostIcon.js';
import { PageAlert } from '../../shell/view/PageAlert.js';
import { meOn } from '../connectors/actions.js';
import { ID_PATTERN, idFor, ownerChoices } from '../connectors/form.js';
import { agentConfigForForm, agentTopSchema, agentWanted, engineSchema, startOf, topOf, type AgentTop } from './form.js';
import { EnginePicker } from './EnginePicker.js';
import { newAgentTab } from './state.js';

type Bag = Record<string, unknown>;

const usersReducer = peopleReducer('users');
const teamsReducer = peopleReducer('teams');

/**
 * One form for a new agent and for a made one's Settings: the engine picked on
 * top, with the template it starts from, then the name, id, owner,
 * description and model, and the engine's own fields below. A new agent's id
 * follows its name until a person types one; a made one's engine and id are
 * fixed.
 */
export function AgentForm({ host, record }: { host: string; record?: AgentRow }): ReactElement {
  const scena = useScena();
  const { t } = useI18n();
  const offers = useStore<Offers>(ahpPaths(host).offers) ?? NO_OFFERS;
  const infos = useStore<AgentInfo[]>(ahpPaths(host).agents) ?? [];
  const enginesRead = useChannel<PeopleState<EngineRow>>(host, ENGINES.channel, enginesReducer);
  const recordsRead = useChannel<PeopleState<AgentRow>>(host, AGENTS.channel, agentsReducer);
  const engines = useMemo(() => (enginesRead.state?.records ?? []).map((one) => one.record), [enginesRead.state]);
  // A new id is suggested past the agents this reader sees; the host refuses one it already serves.
  const taken = useMemo(
    () => [...(recordsRead.state?.records ?? []).map((one) => one.id), ...infos.map((one) => one.provider)],
    [recordsRead.state, infos],
  );
  const me = meOn(offers);
  const editing = record !== undefined;
  const plugins = useChannel<PeopleState<PluginRow>>(host, PLUGINS.channel, pluginsReducer);
  const labelOf = (plugin: string): string => plugins.state?.records.find((one) => one.id === plugin)?.record.title ?? plugin;
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

  const [engineName, setEngineName] = useState(record?.engine ?? '');
  const engine = engines.find((one) => one.name === engineName);
  const heldConfig = useMemo<Bag>(() => record?.config ?? {}, [record]);
  const heldTop = useMemo<AgentTop>(() => topOf(record, me ?? 'host'), [record, me]);
  const heldForm = useMemo<Bag>(() => agentConfigForForm(heldConfig), [heldConfig]);
  const [top, setTop] = useState<AgentTop>(heldTop);
  const [config, setConfig] = useState<Bag>(heldForm);
  const [template, setTemplate] = useState(0);
  const [icon, setIcon] = useState<Icon | undefined>(record?.icon);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [jsonValid, setJsonValid] = useState(true);

  // What the host holds now, whenever it changes.
  useEffect(() => {
    if (!editing) return;
    setTop(heldTop);
    setConfig(heldForm);
    setIcon(record.icon);
  }, [editing, heldTop, heldForm, record]);

  const named = (wanted: AgentTop): AgentTop =>
    // The id follows the name, or the engine while there is none, until a person types one of their own.
    (!editing && wanted.id === top.id && (top.id === '' || top.id === idFor(top.name, engineName, taken)) ? { ...wanted, id: idFor(wanted.name, engineName, taken) } : wanted);

  const start = (next: EngineRow, at: number): void => {
    const from = startOf(next, at);
    const wanted = { ...top, ...from.top };
    setTop(top.id === '' || top.id === idFor(top.name, engineName, taken) ? { ...wanted, id: idFor(wanted.name, next.name, taken) } : wanted);
    setConfig(from.config);
    setIcon(from.icon);
    setSaved(false);
  };
  const pickEngine = (name: string): void => {
    const next = engines.find((one) => one.name === name);
    setEngineName(name);
    const at = (next?.templates ?? []).length === 0 ? -1 : 0;
    setTemplate(at);
    if (next !== undefined) start(next, at);
  };
  const pickTemplate = (at: number): void => {
    setTemplate(at);
    if (engine !== undefined) start(engine, at);
  };
  const changeTop = (next: Bag): void => {
    setTop(named(next as unknown as AgentTop));
    setSaved(false);
  };

  const owners = ownerChoices(me, user, {
    me: t('connectors/owners/me'),
    team: (team) => t('connectors/owners/team', { team }),
    user: (one) => t('connectors/owners/user', { user: one }),
    host: t('connectors/owners/host'),
  }, record?.owner, {
    users: (users.state?.records ?? []).map((one) => one.id),
    teams: (teams.state?.records ?? []).map((one) => one.id),
  }, 'agent');
  // A new agent's owner is the first one this reader may name.
  useEffect(() => {
    if (!editing && owners[0] !== undefined && !owners.some((one) => one.value === top.owner)) setTop((held) => ({ ...held, owner: owners[0]!.value }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing, owners.map((one) => one.value).join('\n'), top.owner]);

  // The models the agent lists, when the host serves it, as the choices of its default model.
  const info = infos.find((one) => one.provider === record?.id);
  const models: EnumOption[] = (info?.models ?? []).map((one) => ({ value: one.id, label: one.name }));
  const head = agentTopSchema(owners, editing, {
    name: t('agents/form/name'),
    id: t('agents/form/id'),
    idHint: t('agents/form/idHint'),
    owner: t('agents/form/owner'),
    description: t('agents/form/description'),
    model: t('agents/form/model'),
    modelHint: t('agents/form/modelHint'),
    modelDefault: t('agents/form/modelDefault'),
  }, models);
  const fields: JsonSchemaObject | undefined = engine === undefined ? undefined : engineSchema(engine, heldConfig, top.owner, t('connectors/form/secretKept'));

  // Without agent:list the host lists no engines, so a new agent has nothing to be made from.
  if (enginesRead.error !== null && !editing) return <PageAlert tone="warning" title={t('agents/form/noEngines')} message={enginesRead.error} />;
  if (enginesRead.state === undefined && enginesRead.error === null) return <Spinner label={t('agents/form/reading')} />;
  if (!userRead) return <Spinner label={t('agents/form/reading')} />;
  if (!editing && engines.length === 0) return <p className="web-note">{t('agents/form/noEngines')}</p>;
  if (!editing && owners.length === 0) return <p className="web-note">{t('agents/form/noPut')}</p>;

  const dirty = JSON.stringify(top) !== JSON.stringify(heldTop) || JSON.stringify(config) !== JSON.stringify(heldForm);
  const ready = engine !== undefined && ID_PATTERN.test(top.id) && top.name.trim() !== '' && top.owner !== '';
  const save = (): void => {
    if (engine === undefined) return;
    setBusy(true);
    setFailure(null);
    putAgent(host, agentWanted(engine, top, config, heldConfig, icon)).then(
      (row) => {
        setBusy(false);
        if (editing) { setSaved(true); return; }
        scena.surfaces.close(newAgentTab(host));
        void scena.commands.execute('ahp.openAgent', { host, provider: row.id, title: row.name });
      },
      (caught: unknown) => { setBusy(false); setFailure(hostSaid(caught)); },
    );
  };

  return (
    <div className="web-connector-form">
      {editing && engine === undefined ? <p className="web-note">{t('agents/form/unknownEngine', { engine: record.engine })}</p> : null}
      {editing && engine === undefined ? null : (
        <div className="web-connector-form__pick">
          <span className="web-connector-form__label">{t('agents/form/engine')}{editing ? null : <span className="web-connector-form__required" aria-hidden="true">*</span>}</span>
          <EnginePicker engines={engines} value={engineName} template={template} labelOf={labelOf} fixed={editing} onPick={pickEngine} onTemplate={pickTemplate} />
        </div>
      )}
      {engine === undefined ? null : <SchemaForm schema={head} value={top as unknown as Bag} baseline={(editing ? heldTop : top) as unknown as Bag} onChange={changeTop} jsonTextRoot={false} />}
      {fields === undefined ? null : (
        <section className="web-connector-form__adapter" aria-label={t('agents/form/settingsOf', { engine: engine!.title })}>
          <h3 className="web-connector-form__heading web-host-label"><HostIcon icons={engine!.icons} size={16} />{t('agents/form/settingsOf', { engine: engine!.title })}</h3>
          {engine!.description === '' || typeof engine!.schema.description === 'string' ? null : <p className="web-note">{engine!.description}</p>}
          <SchemaForm key={`${engineName}:${template}`} schema={fields} views={SETTINGS_VIEWS} value={config} baseline={editing ? heldForm : config} onChange={(next) => { setConfig(next); setSaved(false); }} jsonEditor={JsonCodeEditor} onJsonValidChange={setJsonValid} fieldActions />
        </section>
      )}
      {failure === null ? null : <Alert tone="danger" title={t('agents/form/failed')} message={failure} />}
      <div className="web-page__actions">
        <Button label={t(editing ? 'connectors/form/save' : 'agents/form/create')} variant="primary" disabled={!ready || busy || !jsonValid || (editing && !dirty)} {...(jsonValid ? {} : { title: t('host/settings/fixJson') })} onClick={save} />
        {editing ? <Button label={t('connectors/form/reset')} disabled={!dirty || busy} onClick={() => { setTop(heldTop); setConfig(heldForm); setFailure(null); }} /> : null}
        {saved && !dirty ? <span className="web-note">{t('connectors/form/saved')}</span> : null}
      </div>
    </div>
  );
}
