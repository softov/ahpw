import { useEffect, useMemo, useRef, useState, type ReactElement } from 'react';
import { useScena, useStore } from '@softov/scena/react';
import { Alert, Button, Text } from '@softov/scena/ui';
import type { AgentInfo, Message, SessionConfigPropertySchema, SessionState, StateAction } from '@microsoft/agent-host-protocol';
import { AHP_AGENTS, AHP_DEFAULT_DIRECTORY, ROOT, dispatch, readOnce, request } from '../connection/data.js';
import { folderLabel, folderUri, newId } from '../connection/words.js';
import { fitToText } from './Composer.js';
import { ChoicePill, Pill, TextPill, TogglePill } from './pills.js';
import { EMOJIcon } from '../emojis.js';

/** How long the inputs rest before the host is asked for the settings again. */
const RESOLVE_DELAY = 300;

/** The settings the host offers for a session not yet created, and their values. */
interface Resolved {
  schema: Record<string, SessionConfigPropertySchema>;
  values: Record<string, unknown>;
}

/** One setting as a pill: a choice, a switch, or a box to type in. */
function SettingPill({ name, schema, value, choices, set }: {
  name: string;
  schema: SessionConfigPropertySchema;
  value: unknown;
  choices: { value: string; label: string }[] | undefined;
  set: (next: unknown) => void;
}): ReactElement {
  const title = schema.title || name;
  const current = value ?? schema.default;
  if (schema.type === 'boolean') return <TogglePill label={title} {...(schema.description === undefined ? {} : { title: schema.description })} value={current === true} onChange={set} />;
  const options = choices ?? (schema.enum ?? []).map((one, index) => ({ value: String(one), label: schema.enumLabels?.[index] ?? String(one) }));
  if (options.length > 0) {
    const listed = options.some((one) => one.value === String(current ?? '')) ? options : [{ value: String(current ?? ''), label: current === undefined ? 'default' : String(current) }, ...options];
    return <ChoicePill label={title} {...(schema.description === undefined ? {} : { title: schema.description })} value={String(current ?? '')} options={listed} onChange={(next) => set(schema.type === 'number' ? Number(next) : next)} />;
  }
  return (
    <TextPill
      label={title}
      {...(schema.description === undefined ? {} : { title: schema.description })}
      value={current === undefined || current === null ? '' : String(current)}
      onChange={(next) => set(schema.type === 'number' ? (next === '' ? undefined : Number(next)) : next)}
    />
  );
}

/** A new session, started the way a chat is: say something, with the agent, model, folder and settings above the box. */
export default function NewSessionPage({ provider: offered }: { provider?: string }): ReactElement {
  const scena = useScena();
  const agents = useStore<AgentInfo[]>(AHP_AGENTS) ?? [];
  const home = useStore<string | null>(AHP_DEFAULT_DIRECTORY);
  const [provider, setProvider] = useState(offered ?? '');
  const [folder, setFolder] = useState('');
  const [model, setModel] = useState('');
  const [text, setText] = useState('');
  const [chosen, setChosen] = useState<Record<string, unknown>>({});
  const [resolved, setResolved] = useState<Resolved | null>(null);
  const [dynamic, setDynamic] = useState<Record<string, { value: string; label: string }[]>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const area = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (provider === '' && agents[0] !== undefined) setProvider(agents[0].provider);
  }, [agents, provider]);
  useEffect(() => {
    if (folder === '' && home !== undefined && home !== null) setFolder(folderLabel(home));
  }, [home, folder]);
  useEffect(() => fitToText(area.current), [text]);

  // The host says which settings a session would have, given what is chosen so far.
  const where = folder.trim() === '' ? undefined : folderUri(folder);
  const asked = JSON.stringify([provider, where, chosen]);
  useEffect(() => {
    if (provider === '') return;
    let alive = true;
    const timer = window.setTimeout(() => {
      request('resolveSessionConfig', { channel: ROOT, provider, ...(where === undefined ? {} : { workingDirectory: where }), config: chosen } as never)
        .then((answer) => {
          if (!alive) return;
          const result = answer as unknown as { schema: { properties: Record<string, SessionConfigPropertySchema> }; values: Record<string, unknown> };
          setResolved({ schema: result.schema.properties, values: result.values });
        })
        .catch(() => { if (alive) setResolved(null); });
    }, RESOLVE_DELAY);
    return () => { alive = false; window.clearTimeout(timer); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [asked]);

  // Settings whose choices the host lists on demand.
  const dynamicKeys = Object.entries(resolved?.schema ?? {}).filter(([, schema]) => schema.enumDynamic === true).map(([key]) => key).join('\n');
  useEffect(() => {
    if (dynamicKeys === '') return;
    let alive = true;
    for (const property of dynamicKeys.split('\n')) {
      request('sessionConfigCompletions', { channel: ROOT, provider, ...(where === undefined ? {} : { workingDirectory: where }), config: chosen, property } as never)
        .then((answer) => {
          const items = (answer as unknown as { items: { value: string; label: string }[] }).items;
          if (alive) setDynamic((held) => ({ ...held, [property]: items.map((one) => ({ value: one.value, label: one.label })) }));
        })
        .catch(() => undefined);
    }
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dynamicKeys, provider, where]);

  const agent = agents.find((one) => one.provider === provider);
  // A host that puts the model in the session's settings shows it there; otherwise the agent's list is the model pill.
  const settings = useMemo(
    () => Object.entries(resolved?.schema ?? {}).filter(([key, schema]) => schema.readOnly !== true && key !== 'model'),
    [resolved],
  );
  const modelSchema = resolved?.schema['model'];
  const modelOptions = modelSchema !== undefined
    ? (dynamic['model'] ?? (modelSchema.enum ?? []).map((one, index) => ({ value: String(one), label: modelSchema.enumLabels?.[index] ?? String(one) })))
    : (agent?.models ?? []).map((one) => ({ value: one.id, label: one.name }));

  const start = async (): Promise<void> => {
    if (provider === '') return;
    setBusy(true);
    setError(null);
    const resource = `${provider}:/${newId()}`;
    const said = text.trim();
    const { model: _model, ...config } = chosen;
    try {
      await request('createSession', {
        channel: resource,
        provider,
        ...(where === undefined ? {} : { workingDirectories: [where] }),
        ...(Object.keys(config).length === 0 ? {} : { config }),
      } as never);
      await scena.commands.execute('ahp.openSession', { resource });
      scena.surfaces.close('session:new');
      if (said !== '') {
        const state = await readOnce<SessionState>(resource);
        const chat = state?.defaultChat;
        if (chat !== undefined) {
          const message = { text: said, origin: { kind: 'user' }, ...(model === '' ? {} : { model: { id: model } }) } as Message;
          dispatch(chat, { type: 'chat/turnStarted', turnId: newId(), startedAt: new Date().toISOString(), message } as StateAction);
        }
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught));
    } finally {
      setBusy(false);
    }
  };

  if (agents.length === 0) return <Alert tone="warning" message="This server offers no agent." />;

  return (
    <div className="web-new">
      <Text variant="h2" text="New session" />
      {agent?.description === undefined || agent.description === '' ? null : <p className="web-note">{agent.description}</p>}
      <div className="web-composer web-new__composer">
        <div className="web-composer__chips">
          <ChoicePill
            label="Agent"
            value={provider}
            options={agents.map((one) => ({ value: one.provider, label: one.displayName }))}
            onChange={(next) => { setProvider(next); setModel(''); setChosen({}); setDynamic({}); }}
          />
          {modelOptions.length === 0 ? null : (
            <ChoicePill label="Model" value={model} options={[{ value: '', label: 'default' }, ...modelOptions]} onChange={setModel} />
          )}
          <TextPill label={EMOJIcon.folder} title="A folder on the server's machine" value={folder} placeholder="/path/to/project" width={220} onChange={setFolder} />
          {settings.map(([key, schema]) => (
            <SettingPill
              key={key}
              name={key}
              schema={schema}
              value={chosen[key] ?? resolved?.values[key]}
              choices={dynamic[key]}
              set={(next) => setChosen((held) => ({ ...held, [key]: next }))}
            />
          ))}
          {resolved === null && provider !== '' ? <Pill label="Reading settings" /> : null}
        </div>
        <div className="web-composer__bar">
          <textarea
            ref={area}
            className="web-composer__text"
            rows={3}
            value={text}
            aria-label="First message"
            placeholder="What should it do? Enter starts the session; leave it empty to start without a message."
            onChange={(event) => setText(event.currentTarget.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
                event.preventDefault();
                void start();
              }
            }}
          />
        </div>
        <div className="web-composer__actions">
          <span className="web-composer__hint">Enter starts, Shift+Enter breaks the line</span>
          <Button label={busy ? 'Starting' : text.trim() === '' ? 'Create' : 'Start'} variant="primary" size="sm" disabled={busy || provider === ''} onClick={() => void start()} />
        </div>
      </div>
      {error === null ? null : <Alert tone="danger" title="Not created" message={error} />}
    </div>
  );
}
