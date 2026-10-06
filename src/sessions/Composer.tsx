import { useCallback, useEffect, useMemo, useRef, useState, type ReactElement } from 'react';
import { useScena, useStore } from '@softov/scena/react';
import { Button, useChatPicker } from '@softov/scena/ui';
import type { HostCtx, PickerAction } from '@softov/scena/types';
import type {
  AgentInfo,
  ChatState,
  Message,
  MessageAttachment,
  SessionState,
  SessionSummary,
  StateAction,
} from '@microsoft/agent-host-protocol';
import { AHP_AGENTS, dispatch, request } from '../connection/data.js';
import { folderLabel, newId } from '../connection/words.js';
import type { Send } from './Parts.js';
import {
  attachComposer,
  COMPOSER_SLOT,
  composerPath,
  optionCommandId,
  optionLabel,
  pickable,
  registerOptionCommands,
  type ComposerApi,
  type Option,
} from './composer-commands.js';

/** Where the box stops growing and starts scrolling, in pixels. */
const COMPOSER_MAX = 260;
/** The prefixes the picker answers to. Module level: an inline array re-renders forever. */
const PREFIXES = ['/', '@'];
/** How long typing rests before the draft is saved on the host. */
const DRAFT_DELAY = 800;

/** Grow the box to its text, up to the ceiling. The height is cleared first, or it only ever grows. */
function fitToText(area: HTMLTextAreaElement | null): void {
  if (area === null) return;
  area.style.height = 'auto';
  area.style.height = `${Math.min(area.scrollHeight, COMPOSER_MAX)}px`;
}

/** A small rounded control in the row above the box. */
function Pill({ label, title, onOpen, on }: { label: string; title?: string; onOpen?: () => void; on?: boolean }): ReactElement {
  return (
    <button
      type="button"
      className="web-chip"
      data-on={on === true ? 'true' : 'false'}
      title={title}
      disabled={onOpen === undefined}
      onClick={onOpen}
      {...(onOpen === undefined ? {} : { 'aria-haspopup': 'menu' as const })}
    >
      {label}
      {onOpen === undefined ? null : <span aria-hidden="true">{'\u{25BE}'}</span>}
    </button>
  );
}

/** A user message, with the model and attachments when there are any. */
function messageOf(text: string, model: string | undefined, attachments: MessageAttachment[]): Message {
  return {
    text,
    origin: { kind: 'user' },
    ...(model === undefined ? {} : { model: { id: model } }),
    ...(attachments.length === 0 ? {} : { attachments }),
  } as Message;
}

/** The composer of one chat: the box, its `/` and `@` picker, the settings row, and send, queue, steer and stop. */
export function Composer({ chat, chatUri, session, summary, send }: {
  chat: ChatState;
  chatUri: string;
  session: SessionState | undefined;
  summary: SessionSummary;
  send: Send;
}): ReactElement {
  const scena = useScena();
  const agents = useStore<AgentInfo[]>(AHP_AGENTS) ?? [];
  const agent = agents.find((one) => one.provider === summary.provider);
  const path = useMemo(() => composerPath(chatUri), [chatUri]);

  const [text, setText] = useState(() => chat.draft?.text ?? '');
  const [caret, setCaret] = useState<number | null>(null);
  const [model, setModel] = useState<string | undefined>(() => chat.draft?.model?.id ?? chat.turns.at(-1)?.message.model?.id);
  const [attachments, setAttachments] = useState<MessageAttachment[]>(() => chat.draft?.attachments ?? []);
  const area = useRef<HTMLTextAreaElement>(null);

  const active = chat.activeTurn;
  const queued = chat.queuedMessages ?? [];
  const steering = chat.steeringMessage;

  useEffect(() => fitToText(area.current), [text]);

  // The draft goes to the host once typing rests, so a reload or another client finds it.
  const typed = useRef(false);
  useEffect(() => {
    if (!typed.current) return;
    const timer = window.setTimeout(() => {
      const draft = text.trim() === '' && attachments.length === 0 ? undefined : messageOf(text, model, attachments);
      dispatch(chatUri, { type: 'chat/draftChanged', draft } as StateAction);
    }, DRAFT_DELAY);
    return () => window.clearTimeout(timer);
  }, [text, model, attachments, chatUri]);

  const focusCaret = useCallback((position: number) => {
    setCaret(position);
    requestAnimationFrame(() => {
      const element = area.current;
      if (element === null) return;
      element.focus();
      element.setSelectionRange(position, position);
    });
  }, []);

  // `@` asks the host what the text so far can refer to.
  const textRef = useRef(text);
  textRef.current = text;
  const caretRef = useRef(caret);
  caretRef.current = caret;
  const mentions = useCallback(async (): Promise<PickerAction[]> => {
    const said = textRef.current;
    try {
      const found = await request('completions', { kind: 'userMessage', channel: chatUri, text: said, offset: caretRef.current ?? said.length } as never);
      return (found as { items: { insertText: string; attachment: MessageAttachment }[] }).items.map((item) => ({
        title: item.insertText.replace(/^@/, ''),
        onSelect: (ctx: HostCtx) => {
          ctx.replaceActiveToken(`${item.insertText} `);
          setAttachments((held) => [...held, item.attachment]);
        },
      }));
    } catch {
      // A host that cannot answer leaves the path to be typed by hand.
      return [];
    }
  }, [chatUri]);

  const picker = useChatPicker({
    input: text,
    setInput: setText,
    caretIndex: caret,
    panelDataContext: path,
    slashSlot: COMPOSER_SLOT,
    prefixes: PREFIXES,
    mentionProvider: mentions,
    onCaretChange: focusCaret,
  });

  // The settings the host lets change mid-session, read fresh whenever a command asks.
  const config = session?.config;
  const options: Option[] = useMemo(() => Object.entries(config?.schema.properties ?? {})
    .filter(([, schema]) => schema.sessionMutable === true && schema.readOnly !== true)
    .map(([key, schema]) => ({ key, schema, value: config?.values[key] })), [config]);

  const stop = useCallback((): void => {
    if (active === undefined) return;
    const started = Date.parse(active.startedAt);
    send({ type: 'chat/turnCancelled', turnId: active.id, duration: Number.isNaN(started) ? 0 : Math.max(0, Date.now() - started) } as StateAction);
  }, [active, send]);

  const models = useMemo(() => (agent?.models ?? []).map((one) => ({ id: one.id, name: one.name })), [agent]);
  const api = useRef<ComposerApi | null>(null);
  api.current = {
    models: () => models,
    model: () => model,
    setModel: (id) => {
      typed.current = true;
      setModel(id);
    },
    options: () => options,
    setOption: (key, value) => {
      if (session !== undefined) dispatch(summary.resource, { type: 'session/configChanged', config: { [key]: value } } as StateAction);
    },
    running: () => active !== undefined,
    stop,
  };
  useEffect(() => attachComposer(path, {
    models: () => api.current?.models() ?? [],
    model: () => api.current?.model(),
    setModel: (id) => api.current?.setModel(id),
    options: () => api.current?.options() ?? [],
    setOption: (key, value) => api.current?.setOption(key, value),
    running: () => api.current?.running() ?? false,
    stop: () => api.current?.stop(),
  }), [path]);

  // Keyed on which settings exist, not their values, so a value changing does not tear down an open list.
  const shape = options.map((one) => one.key).join('\n');
  useEffect(() => {
    const registration = registerOptionCommands(scena, options);
    return () => registration.dispose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scena, shape]);

  function openCommand(id: string): void {
    const position = picker.openCommand(id);
    focusCaret(position ?? area.current?.value.length ?? text.length);
  }

  function clear(): void {
    setText('');
    setAttachments([]);
    typed.current = false;
    dispatch(chatUri, { type: 'chat/draftChanged', draft: undefined } as unknown as StateAction);
  }

  function submit(kind: 'send' | 'steer'): void {
    const said = text.trim();
    if (said === '') return;
    const message = messageOf(said, model, attachments);
    if (active === undefined) {
      send({ type: 'chat/turnStarted', turnId: newId(), startedAt: new Date().toISOString(), message } as StateAction);
    } else if (kind === 'steer') {
      send({ type: 'chat/pendingMessageSet', kind: 'steering', id: newId(), message } as StateAction);
    } else {
      send({ type: 'chat/pendingMessageSet', kind: 'queued', id: newId(), message } as StateAction);
    }
    clear();
  }

  const folder = summary.workingDirectories?.[0];
  const modelName = models.find((one) => one.id === model)?.name ?? model;

  return (
    <div className="web-composer">
      {picker.pickerNode === null ? null : <div className="web-composer__picker">{picker.pickerNode}</div>}

      {steering === undefined && queued.length === 0 ? null : (
        <ul className="web-composer__queue">
          {steering === undefined ? null : (
            <li>
              <span className="web-chip" data-on="true">Steering</span>
              <span className="web-composer__queued">{steering.message.text}</span>
              <Button label="Remove" size="sm" onClick={() => send({ type: 'chat/pendingMessageRemoved', kind: 'steering', id: steering.id } as StateAction)} />
            </li>
          )}
          {queued.map((one, index) => (
            <li key={one.id}>
              <span className="web-chip">Next {index + 1}</span>
              <span className="web-composer__queued">{one.message.text}</span>
              <Button label="Remove" size="sm" onClick={() => send({ type: 'chat/pendingMessageRemoved', kind: 'queued', id: one.id } as StateAction)} />
            </li>
          ))}
        </ul>
      )}

      <div className="web-composer__chips">
        {folder === undefined ? null : <Pill label={`\u{1F4C1}\u{FE0E} ${folderLabel(folder)}`} title="The folder this session works in" />}
        <Pill label={`\u{1F916}\u{FE0E} ${agent?.displayName ?? summary.provider}`} title={agent?.description ?? 'The agent running this session'} />
        {models.length === 0 ? null : (
          <Pill label={`Model: ${modelName ?? 'default'}`} title="The model the next message goes to" onOpen={() => openCommand('ahp.composer.model')} />
        )}
        {options.map((option) => (
          <Pill
            key={option.key}
            label={`${option.schema.title || option.key}: ${optionLabel(option)}`}
            title={option.schema.description ?? option.schema.title}
            {...(option.schema.type === 'boolean' ? { on: (option.value ?? option.schema.default) === true } : {})}
            {...(pickable(option.schema) ? { onOpen: () => openCommand(optionCommandId(option.key)) } : {})}
          />
        ))}
        {attachments.length === 0 ? null : (
          <Pill label={`\u{1F4CE}\u{FE0E} ${attachments.length} attached`} title="Clear the attachments" onOpen={() => setAttachments([])} />
        )}
      </div>

      <div className="web-composer__bar">
        <textarea
          ref={area}
          className="web-composer__text"
          rows={1}
          value={text}
          aria-label="Message"
          placeholder={active === undefined ? 'Message the agent, / for commands, @ to refer to a file' : 'Queue a message for after this turn, or steer it'}
          onChange={(event) => {
            typed.current = true;
            setText(event.currentTarget.value);
            setCaret(event.currentTarget.selectionStart);
          }}
          onKeyUp={(event) => setCaret(event.currentTarget.selectionStart)}
          onClick={(event) => setCaret(event.currentTarget.selectionStart)}
          onKeyDown={(event) => {
            if (picker.handleMenuKeyDown(event)) return;
            if (event.key === 'Escape' && active !== undefined) {
              event.preventDefault();
              stop();
              return;
            }
            if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
              event.preventDefault();
              submit(event.altKey ? 'steer' : 'send');
            }
          }}
        />
      </div>

      <div className="web-composer__actions">
        <span className="web-composer__hint">
          {active === undefined ? 'Enter sends, Shift+Enter breaks the line' : 'Enter queues, Alt+Enter steers, Esc stops'}
        </span>
        {active === undefined ? null : <Button label="Stop" size="sm" onClick={stop} />}
        {active === undefined ? null : <Button label="Steer" size="sm" disabled={text.trim() === ''} onClick={() => submit('steer')} />}
        <Button label={active === undefined ? 'Send' : 'Queue'} variant="primary" size="sm" disabled={text.trim() === ''} onClick={() => submit('send')} />
      </div>
    </div>
  );
}
