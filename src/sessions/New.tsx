import { useCallback, useEffect, useMemo, useRef, useState, type ReactElement } from 'react';
import { useScena, useStore } from '@softov/scena/react';
import { Alert, Button, Text, useChatPicker } from '@softov/scena/ui';
import type { PickerAction } from '@softov/scena/types';
import type { AgentInfo, MessageAttachment, SessionConfigPropertySchema, SessionState, StateAction } from '@microsoft/agent-host-protocol';
import { AHP_AGENTS, AHP_DEFAULT_DIRECTORY, ROOT, dispatch, readOnce, request } from '../connection/data.js';
import { folderLabel, folderUri, newId } from '../connection/words.js';
import { fitToText, messageOf } from './Composer.js';
import { AddButton, Attached } from './Attached.js';
import { fromFiles, sameAttachment } from './attachments.js';
import { attachComposer, composerPath, NEW_SLOT } from './composer-commands.js';
import { folderMentions, mentionQuery } from './folder-mentions.js';
import { ChoicePill, Pill, TextPill, TogglePill } from './pills.js';
import { EMOJIcon } from '../emojis.js';
import { slashCommandsOf } from '../agents/words.js';
import { warn } from '../notify/index.js';
import { agentCommands, COMPOSER_FOCUS, registerHostCommands } from './host-commands.js';

/** The prefixes the new session box's picker answers to. Module level: an inline array re-renders forever. */
const NEW_PREFIXES = ['/', '@'];

/** Where Add context finds the new session box. */
const NEW_PATH = composerPath('session:new');

/** Which composer focus the new session box sets, so only its `/` list offers the agent's commands. */
const NEW_FOCUS = 'session:new';

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
  const [caret, setCaret] = useState<number | null>(null);
  const [attachments, setAttachments] = useState<MessageAttachment[]>([]);
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

  // `/` offers the chosen agent's skills and commands; another agent brings its own.
  const commands = useMemo(() => agentCommands(slashCommandsOf(agent?.customizations)), [agent]);
  useEffect(() => {
    const registration = registerHostCommands(scena, NEW_FOCUS, commands, NEW_SLOT);
    return () => registration.dispose();
  }, [scena, commands]);
  const focusCaret = useCallback((position: number) => {
    setCaret(position);
    requestAnimationFrame(() => {
      const element = area.current;
      if (element === null) return;
      element.focus();
      element.setSelectionRange(position, position);
    });
  }, []);

  const attach = useCallback((picked: MessageAttachment): void => {
    setAttachments((held) => (held.some((one) => sameAttachment(one, picked)) ? held : [...held, picked]));
  }, []);

  // Files from this computer go inside the first message.
  const files = useRef<HTMLInputElement>(null);
  const upload = useCallback(async (list: FileList | null): Promise<void> => {
    const got = await fromFiles(Array.from(list ?? []));
    for (const one of got.attached) attach(one);
    if (got.refused.length > 0) warn('Not attached', { description: `Over 5 MB or unreadable: ${got.refused.join(', ')}` });
  }, [attach]);

  // `@` lists the chosen folder, as there is no chat yet to ask what the text refers to.
  const textRef = useRef(text);
  textRef.current = text;
  const caretRef = useRef(caret);
  caretRef.current = caret;
  const mentions = useCallback(async (): Promise<PickerAction[]> => {
    const query = mentionQuery(textRef.current, caretRef.current ?? textRef.current.length);
    if (query === null || where === undefined) return [];
    try {
      return (await folderMentions(where, query)).map((one) => ({
        title: one.title,
        onSelect: (ctx) => {
          ctx.replaceActiveToken(`${one.insert} `);
          attach(one.attachment);
        },
      }));
    } catch {
      // A folder the host cannot read leaves the path to be typed by hand.
      return [];
    }
  }, [where, attach]);

  const picker = useChatPicker({
    input: text,
    setInput: setText,
    caretIndex: caret,
    panelDataContext: NEW_PATH,
    slashSlot: NEW_SLOT,
    prefixes: NEW_PREFIXES,
    mentionProvider: mentions,
    onCaretChange: focusCaret,
  });
  // A host that puts the model in the session's settings shows it there; otherwise the agent's list is the model pill.
  const settings = useMemo(
    () => Object.entries(resolved?.schema ?? {}).filter(([key, schema]) => schema.readOnly !== true && key !== 'model'),
    [resolved],
  );
  const modelSchema = resolved?.schema['model'];
  const modelOptions = modelSchema !== undefined
    ? (dynamic['model'] ?? (modelSchema.enum ?? []).map((one, index) => ({ value: String(one), label: modelSchema.enumLabels?.[index] ?? String(one) })))
    : (agent?.models ?? []).map((one) => ({ value: one.id, label: one.name }));

  // What Add context reads and does here: attach, type a prefix, upload. A session not yet made has no turn and no settings to change.
  const api = useRef({ attach, upload, focusCaret });
  api.current = { attach, upload, focusCaret };
  useEffect(() => attachComposer(NEW_PATH, {
    models: () => [],
    model: () => undefined,
    setModel: () => undefined,
    options: () => [],
    setOption: () => undefined,
    running: () => false,
    stop: () => undefined,
    session: () => '',
    attach: (attachment) => api.current.attach(attachment),
    type: (prefix) => {
      const at = caretRef.current ?? textRef.current.length;
      const before = textRef.current.slice(0, at);
      const lead = prefix === '/' ? '' : before === '' || /\s$/.test(before) ? '' : ' ';
      const next = prefix === '/' && before.trim() === '' ? `/${textRef.current.slice(at)}` : `${before}${lead}${prefix}${textRef.current.slice(at)}`;
      setText(next);
      api.current.focusCaret(prefix === '/' && before.trim() === '' ? 1 : before.length + lead.length + 1);
    },
    upload: () => files.current?.click(),
  }), []);

  function openCommand(id: string): void {
    const position = picker.openCommand(id);
    focusCaret(position ?? area.current?.value.length ?? text.length);
  }

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
      if (said !== '' || attachments.length > 0) {
        const state = await readOnce<SessionState>(resource);
        const chat = state?.defaultChat;
        if (chat !== undefined) {
          const message = messageOf(said, model === '' ? undefined : model, attachments);
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
        <div className="web-composer__where">
          <ChoicePill
            label="Agent"
            value={provider}
            options={agents.map((one) => ({ value: one.provider, label: one.displayName }))}
            onChange={(next) => { setProvider(next); setModel(''); setChosen({}); setDynamic({}); }}
          />
          <TextPill label={EMOJIcon.folder} title="A folder on the server's machine" value={folder} placeholder="/path/to/project" width={220} onChange={setFolder} />
        </div>
        <div className="web-composer__box">
          <Attached attachments={attachments} folder={where} onRemove={(index) => setAttachments((held) => held.filter((_, at) => at !== index))} />
          <div className="web-composer__bar">
            {picker.pickerNode === null ? null : <div className="web-composer__picker">{picker.pickerNode}</div>}
            <textarea
              ref={area}
              className="web-composer__text"
              rows={3}
              value={text}
              aria-label="First message"
              placeholder={commands.length === 0 ? 'What should it do? @ to refer to a file. Enter starts; leave it empty to start without a message.' : 'What should it do? / for skills and commands, @ to refer to a file. Enter starts; leave it empty to start without a message.'}
              onChange={(event) => {
                setText(event.currentTarget.value);
                setCaret(event.currentTarget.selectionStart);
              }}
              onFocus={() => scena.store.set(COMPOSER_FOCUS, NEW_FOCUS)}
              onKeyUp={(event) => setCaret(event.currentTarget.selectionStart)}
              onClick={(event) => setCaret(event.currentTarget.selectionStart)}
              onKeyDown={(event) => {
                if (picker.handleMenuKeyDown(event)) return;
                if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
                  event.preventDefault();
                  void start();
                }
              }}
            />
          </div>
          <div className="web-composer__foot">
            <AddButton onClick={() => openCommand('ahp.composer.attach')} />
            <input ref={files} type="file" multiple hidden onChange={(event) => { void upload(event.currentTarget.files); event.currentTarget.value = ''; }} />
            <div className="web-composer__chips">
              {modelOptions.length === 0 ? null : (
                <ChoicePill label="Model" value={model} options={[{ value: '', label: 'default' }, ...modelOptions]} onChange={setModel} />
              )}
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
            <Button
              label={busy ? 'Starting' : text.trim() === '' && attachments.length === 0 ? 'Create' : 'Start'}
              variant="primary"
              size="sm"
              title="Enter starts, Shift+Enter breaks the line"
              disabled={busy || provider === ''}
              onClick={() => void start()}
            />
          </div>
        </div>
      </div>
      {error === null ? null : <Alert tone="danger" title="Not created" message={error} />}
    </div>
  );
}
