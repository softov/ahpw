import { useCallback, useEffect, useMemo, useRef, useState, type ReactElement } from 'react';
import { useCloseGuard, useScena, useStore } from '@softov/scena/react';
import { Alert, Button, Text, useChatPicker } from '@softov/scena/ui';
import type { PickerAction } from '@softov/scena/types';
import type { AgentInfo, MessageAttachment, SessionConfigPropertySchema, SessionState, StateAction } from '@microsoft/agent-host-protocol';
import { AHP_AGENTS, AHP_DEFAULT_DIRECTORY, ROOT, dispatch, readOnce, request } from '../connection/data.js';
import { folderLabel, folderUri, newId } from '../connection/words.js';
import { fitToText, messageOf } from './Composer.js';
import { AddButton, Attached } from './Attached.js';
import { fromFiles, sameAttachment } from './attachments.js';
import {
  attachComposer,
  composerPath,
  NEW_SLOT,
  optionCommandId,
  optionLabel,
  pickable,
  registerOptionCommands,
  showsPill,
  type ModelChoice,
  type Option,
} from './composer-commands.js';
import { useComposerDrop } from './composer-drop.js';
import { folderMentions, mentionQuery } from './folder-mentions.js';
import { FolderPill } from './FolderPill.js';
import { Pill, TextPill } from './pills.js';
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

/** The command behind the Agent pill and `/agent`: the new session box is the only place an agent is chosen. */
const AGENT_COMMAND = 'ahp.new.agent';

/** The settings the host offers for a session not yet created, and their values. */
interface Resolved {
  schema: Record<string, SessionConfigPropertySchema>;
  values: Record<string, unknown>;
}

/**
 * One setting as a pill, as the session's composer shows it: a choice or a
 * switch opens its command in the box's list; a value to type is a box.
 */
function SettingPill({ option, set, open }: { option: Option; set: (next: unknown) => void; open: (id: string) => void }): ReactElement | null {
  const { key, schema, value } = option;
  const title = schema.title || key;
  const described = schema.description === undefined ? {} : { title: schema.description };
  if (pickable(schema)) {
    return (
      <Pill
        label={`${title}: ${optionLabel(option)}`}
        {...described}
        {...(schema.type === 'boolean' ? { on: (value ?? schema.default) === true } : {})}
        onOpen={() => open(optionCommandId(key))}
      />
    );
  }
  if (schema.type === 'string' || schema.type === 'number') {
    const current = value ?? schema.default;
    return (
      <TextPill
        label={title}
        {...described}
        value={current === undefined || current === null ? '' : String(current)}
        onChange={(next) => set(schema.type === 'string' ? next : next === '' ? undefined : Number(next))}
      />
    );
  }
  // An object or a list the agent keeps, as `permissions`: shown when it holds something, as the composer does.
  return showsPill(option) ? <Pill label={`${title}: ${optionLabel(option)}`} {...described} /> : null;
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
  useCloseGuard(() => (text.trim() !== '' || attachments.length > 0 ? 'The message is not sent.' : null));

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

  // A drop: a host file attaches, or with Shift goes in as `@path` text; this computer's files attach as content.
  const insert = useCallback((words: string): void => {
    const at = caretRef.current ?? textRef.current.length;
    const before = textRef.current.slice(0, at);
    const lead = before === '' || /\s$/.test(before) ? '' : ' ';
    setText(`${before}${lead}${words}${textRef.current.slice(at)}`);
    focusCaret(before.length + lead.length + words.length);
  }, [focusCaret]);
  const drop = useComposerDrop({ attach, insert, upload: (list) => void upload(list) });
  const mentions = useCallback(async (): Promise<PickerAction[]> => {
    const query = mentionQuery(textRef.current, caretRef.current ?? textRef.current.length);
    if (query === null || where === undefined) return [];
    try {
      return (await folderMentions(where, query)).map((one) => ({
        title: one.title,
        onSelect: (ctx) => {
          // A folder is walked into: its path stays the `@` word, so the list follows it.
          if (one.folder) {
            ctx.replaceActiveToken(one.insert);
            return;
          }
          ctx.replaceActiveToken(`${one.insert} `);
          if (one.attachment !== undefined) attach(one.attachment);
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
  const models: ModelChoice[] = useMemo(() => (modelSchema !== undefined
    ? (dynamic['model'] ?? (modelSchema.enum ?? []).map((one, index) => ({ value: String(one), label: modelSchema.enumLabels?.[index] ?? String(one) }))).map((one) => ({ id: one.value, name: one.label }))
    : (agent?.models ?? []).map((one) => ({ id: one.id, name: one.name }))), [modelSchema, dynamic, agent]);
  const modelName = models.find((one) => one.id === model)?.name ?? model;

  // The settings as the composer's commands read them; a list the host gives on demand stands in for the schema's own.
  const options: Option[] = useMemo(() => settings.map(([key, schema]) => {
    const listed = dynamic[key];
    const offered = listed === undefined ? schema : { ...schema, enum: listed.map((one) => one.value), enumLabels: listed.map((one) => one.label) };
    return { key, schema: offered, value: chosen[key] ?? resolved?.values[key] };
  }), [settings, dynamic, chosen, resolved]);
  // Keyed on which settings exist, not their values, so a value changing does not tear down an open list.
  const shape = options.map((one) => one.key).join('\n');
  useEffect(() => {
    const registration = registerOptionCommands(scena, options);
    return () => registration.dispose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scena, shape]);

  const pickAgent = useCallback((next: string): void => {
    setProvider(next);
    setModel('');
    setChosen({});
    setDynamic({});
  }, []);

  // What the box's commands read and do: the agent, the model, the settings, Add context. A session not yet made has no turn to stop.
  const api = useRef({ attach, upload, focusCaret, models, model, options, pickAgent, agents, provider });
  api.current = { attach, upload, focusCaret, models, model, options, pickAgent, agents, provider };
  useEffect(() => scena.commands.register({
    id: AGENT_COMMAND,
    title: 'Agent',
    description: 'The agent the session runs on',
    category: 'Session',
    shortcut: '/agent',
    slots: [NEW_SLOT],
    run: (ctx) => {
      const now = api.current;
      ctx.host?.pushList({
        title: 'Agent',
        sentinel: '/agent',
        items: now.agents.map((one) => ({
          title: one.displayName,
          active: one.provider === now.provider,
          onSelect: (host) => {
            now.pickAgent(one.provider);
            host.closeMenu();
          },
        })),
      });
    },
  }).dispose, [scena]);
  useEffect(() => attachComposer(NEW_PATH, {
    models: () => api.current.models,
    model: () => (api.current.model === '' ? undefined : api.current.model),
    setModel: (id) => setModel(id ?? ''),
    options: () => api.current.options,
    setOption: (key, value) => setChosen((held) => ({ ...held, [key]: value })),
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
        {/* Under the box, where the page has room, so the list never covers the box's own controls. */}
        {picker.pickerNode === null ? null : <div className="web-composer__picker">{picker.pickerNode}</div>}
        <div className="web-composer__where">
          <Pill label={`Agent: ${agent?.displayName ?? provider}`} title="The agent the session runs on" onOpen={() => openCommand(AGENT_COMMAND)} />
          <FolderPill value={folder} onChange={setFolder} />
        </div>
        <div className="web-composer__box" data-drop={drop.dropping ?? undefined} onDragOver={drop.onDragOver} onDragLeave={drop.onDragLeave} onDrop={drop.onDrop}>
          <Attached attachments={attachments} folder={where} onRemove={(index) => setAttachments((held) => held.filter((_, at) => at !== index))} />
          <div className="web-composer__bar">
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
              {models.length === 0 ? null : (
                <Pill label={`Model: ${modelName === '' ? 'default' : modelName}`} title="The model the first message goes to" onOpen={() => openCommand('ahp.composer.model')} />
              )}
              {options.map((option) => (
                <SettingPill
                  key={option.key}
                  option={option}
                  set={(next) => setChosen((held) => ({ ...held, [option.key]: next }))}
                  open={openCommand}
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
