import { memo, useCallback, useEffect, useMemo, useRef, useState, type ReactElement } from 'react';
import { useScena, useStore } from '@softov/scena/react';
import { Button, useChatPicker } from '@softov/scena/ui';
import type { HostCtx, PickerAction } from '@softov/scena/types';
import type {
  AgentInfo,
  Message,
  MessageAttachment,
  PendingMessage,
  SessionConfigState,
  SessionSummary,
  StateAction,
} from '@microsoft/agent-host-protocol';
import { AHP_AGENTS, dispatch, request } from '../connection/data.js';
import { folderLabel, newId } from '../connection/words.js';
import type { Send } from './Parts.js';
import { Pill } from './pills.js';
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
import { EMOJIcon } from '../emojis.js';
import { attachmentIcon, attachmentLabel, attachmentPath, fromFiles, sameAttachment, withRanges, withToken } from './attachments.js';
import { warn } from '../notify/index.js';
import { COMPOSER_FOCUS, hostCommands, registerHostCommands, type HostCommand } from './host-commands.js';

/** Tells one composer from another in the store's focus path. */
let composers = 0;

/** Where the box stops growing and starts scrolling, in pixels. */
const COMPOSER_MAX = 260;
/** The prefixes the picker answers to. Module level: an inline array re-renders forever. */
const PREFIXES = ['/', '@'];
/** How long typing rests before the draft is saved on the host. */
const DRAFT_DELAY = 800;

/** Grow the box to its text, up to the ceiling. The height is cleared first, or it only ever grows. */
export function fitToText(area: HTMLTextAreaElement | null): void {
  if (area === null) return;
  area.style.height = 'auto';
  area.style.height = `${Math.min(area.scrollHeight, COMPOSER_MAX)}px`;
}

/** A user message, with the model and attachments when there are any. */
function messageOf(text: string, model: string | undefined, attachments: MessageAttachment[]): Message {
  return {
    text,
    origin: { kind: 'user' },
    ...(model === undefined ? {} : { model: { id: model } }),
    ...(attachments.length === 0 ? {} : { attachments: withRanges(text, attachments) }),
  } as Message;
}

/** The composer of one chat: the box, its `/` and `@` picker, the settings row, and send, queue, steer and stop. */
export const Composer = memo(function Composer({ chatUri, activeId, activeStart, queued: held, steering, draft, lastModel, config, summary, send }: {
  chatUri: string;
  activeId: string | undefined;
  activeStart: string | undefined;
  queued: PendingMessage[] | undefined;
  steering: PendingMessage | undefined;
  draft: Message | undefined;
  lastModel: string | undefined;
  config: SessionConfigState | undefined;
  summary: SessionSummary;
  send: Send;
}): ReactElement {
  const scena = useScena();
  const agents = useStore<AgentInfo[]>(AHP_AGENTS) ?? [];
  const agent = agents.find((one) => one.provider === summary.provider);
  const path = useMemo(() => composerPath(chatUri), [chatUri]);
  const [focus] = useState(() => `composer-${++composers}`);
  const folder = summary.workingDirectories?.[0];

  const [text, setText] = useState(() => draft?.text ?? '');
  const [caret, setCaret] = useState<number | null>(null);
  const [model, setModel] = useState<string | undefined>(() => draft?.model?.id ?? lastModel);
  const [attachments, setAttachments] = useState<MessageAttachment[]>(() => draft?.attachments ?? []);
  const area = useRef<HTMLTextAreaElement>(null);

  const active = activeId === undefined ? undefined : { id: activeId, startedAt: activeStart ?? '' };
  const queued = held ?? [];

  useEffect(() => fitToText(area.current), [text]);

  // The draft goes to the host once typing rests, so a reload or another client finds it.
  const typed = useRef(false);
  useEffect(() => {
    if (!typed.current) return;
    const timer = window.setTimeout(() => {
      const next = text.trim() === '' && attachments.length === 0 ? undefined : messageOf(text, model, attachments);
      dispatch(chatUri, { type: 'chat/draftChanged', draft: next } as StateAction);
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

  const attach = useCallback((picked: MessageAttachment): void => {
    typed.current = true;
    setAttachments((held) => (held.some((one) => sameAttachment(one, picked)) ? held : [...held, picked]));
  }, []);

  // Files from this computer go inside the message.
  const files = useRef<HTMLInputElement>(null);
  const upload = useCallback(async (list: FileList | null): Promise<void> => {
    const got = await fromFiles(Array.from(list ?? []));
    for (const one of got.attached) attach(one);
    if (got.refused.length > 0) warn('Not attached', { description: `Over 5 MB or unreadable: ${got.refused.join(', ')}` });
  }, [attach]);

  // `@` asks the host what the text so far can refer to.
  const textRef = useRef(text);
  textRef.current = text;
  const caretRef = useRef(caret);
  caretRef.current = caret;
  const mentions = useCallback(async (): Promise<PickerAction[]> => {
    const said = textRef.current;
    try {
      const found = await request('completions', { kind: 'userMessage', channel: chatUri, text: said, offset: caretRef.current ?? said.length } as never);
      return (found as { items: { insertText: string; attachment: MessageAttachment }[] }).items.map((item) => {
        const where = attachmentPath(item.attachment, folder);
        return {
          title: item.insertText.replace(/^@/, ''),
          ...(where === undefined ? {} : { description: where }),
          onSelect: (ctx: HostCtx) => {
            ctx.replaceActiveToken(`${item.insertText} `);
            attach(withToken(item.attachment, item.insertText));
          },
        };
      });
    } catch {
      // A host that cannot answer leaves the path to be typed by hand.
      return [];
    }
  }, [chatUri, folder, attach]);

  // The host's own `/` commands for this chat, asked once.
  const [commands, setCommands] = useState<HostCommand[]>([]);
  useEffect(() => {
    let alive = true;
    void request('completions', { kind: 'userMessage', channel: chatUri, text: '/', offset: 1 } as never)
      .then((found) => { if (alive) setCommands(hostCommands(found)); })
      .catch(() => { if (alive) setCommands([]); });
    return () => { alive = false; };
  }, [chatUri]);
  useEffect(() => {
    const registration = registerHostCommands(scena, focus, commands);
    return () => registration.dispose();
  }, [scena, focus, commands]);

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
  const options: Option[] = useMemo(() => Object.entries(config?.schema.properties ?? {})
    .filter(([, schema]) => schema.sessionMutable === true && schema.readOnly !== true)
    .map(([key, schema]) => ({ key, schema, value: config?.values[key] })), [config]);

  const stop = useCallback((): void => {
    if (activeId === undefined) return;
    const started = Date.parse(activeStart ?? '');
    send({ type: 'chat/turnCancelled', turnId: activeId, duration: Number.isNaN(started) ? 0 : Math.max(0, Date.now() - started) } as StateAction);
  }, [activeId, activeStart, send]);

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
      dispatch(summary.resource, { type: 'session/configChanged', config: { [key]: value } } as StateAction);
    },
    running: () => active !== undefined,
    stop,
    session: () => summary.resource,
    attach,
    type: (prefix) => {
      const at = caretRef.current ?? textRef.current.length;
      const before = textRef.current.slice(0, at);
      const lead = prefix === '/' ? '' : before === '' || /\s$/.test(before) ? '' : ' ';
      const next = prefix === '/' && before.trim() === '' ? `/${textRef.current.slice(at)}` : `${before}${lead}${prefix}${textRef.current.slice(at)}`;
      const caretAt = prefix === '/' && before.trim() === '' ? 1 : before.length + lead.length + 1;
      typed.current = true;
      setText(next);
      focusCaret(caretAt);
    },
    upload: () => files.current?.click(),
  };
  useEffect(() => attachComposer(path, {
    models: () => api.current?.models() ?? [],
    model: () => api.current?.model(),
    setModel: (id) => api.current?.setModel(id),
    options: () => api.current?.options() ?? [],
    setOption: (key, value) => api.current?.setOption(key, value),
    running: () => api.current?.running() ?? false,
    stop: () => api.current?.stop(),
    session: () => api.current?.session() ?? '',
    attach: (attachment) => api.current?.attach(attachment),
    type: (prefix) => api.current?.type(prefix),
    upload: () => api.current?.upload(),
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

      <div className="web-composer__box">
        {attachments.length === 0 ? null : (
          <div className="web-composer__attached">
            {attachments.map((one, index) => (
              <span key={`${attachmentLabel(one)}-${index}`} className="web-attachment" title={attachmentPath(one, folder) ?? attachmentLabel(one)}>
                <span className="web-attachment__icon" aria-hidden="true">{attachmentIcon(one)}</span>
                <span className="web-attachment__label">{attachmentLabel(one)}</span>
                <button
                  type="button"
                  className="web-attachment__remove"
                  aria-label={`Remove ${attachmentLabel(one)}`}
                  onClick={() => { typed.current = true; setAttachments((held) => held.filter((_, at) => at !== index)); }}
                >
                  {EMOJIcon.close}
                </button>
              </span>
            ))}
          </div>
        )}

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
            onFocus={() => scena.store.set(COMPOSER_FOCUS, focus)}
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

        <div className="web-composer__foot">
          <button type="button" className="web-composer__add" aria-label="Add context" title="Add context" onClick={() => openCommand('ahp.composer.attach')}>+</button>
          <input ref={files} type="file" multiple hidden onChange={(event) => { void upload(event.currentTarget.files); event.currentTarget.value = ''; }} />
          <div className="web-composer__chips">
            {folder === undefined ? null : <Pill label={`${EMOJIcon.folder} ${folderLabel(folder)}`} title="The folder this session works in" />}
            <Pill label={`${EMOJIcon.agents} ${agent?.displayName ?? summary.provider}`} title={agent?.description ?? 'The agent running this session'} />
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
          </div>
          {active === undefined ? null : <Button label="Stop" size="sm" onClick={stop} />}
          {active === undefined ? null : <Button label="Steer" size="sm" disabled={text.trim() === ''} onClick={() => submit('steer')} />}
          <span title={active === undefined ? 'Enter sends, Shift+Enter breaks the line' : 'Enter queues, Alt+Enter steers, Esc stops'}>
            <Button label={active === undefined ? 'Send' : 'Queue'} variant="primary" size="sm" disabled={text.trim() === ''} onClick={() => submit('send')} />
          </span>
        </div>
      </div>
    </div>
  );
});
