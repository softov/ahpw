import { memo, useCallback, useEffect, useMemo, useRef, useState, type ReactElement } from 'react';
import { useI18n, useScena, useStore } from '@softov/scena/react';
import { Button, useChatPicker } from '@softov/scena/ui';
import type { HostCtx, PickerAction } from '@softov/scena/types';
import type {
  AgentInfo,
  Changeset,
  Message,
  MessageAttachment,
  PendingMessage,
  SessionConfigState,
  SessionSummary,
  StateAction,
  UsageInfo,
} from '@microsoft/agent-host-protocol';
import { ahpPaths, hostBridge } from '../../bridges/data.js';
import { folderLabel, newId } from '../../bridges/words.js';
import type { Send } from './Parts.js';
import { Pill } from './pills.js';
import {
  attachComposer,
  COMPOSER_SLOT,
  composerPath,
  optionCommandId,
  pickable,
  registerOptionCommands,
  showsPill,
  type ChangedFile,
  typeTrigger,
  type ComposerApi,
  type Option,
} from './composer-commands.js';
import { useChangeset } from '../changes/changeset.js';
import { modelLabels, settingLabels } from './pill-labels.js';
import { contextReadout, footerSide } from './footer.js';
import { firstScope, scopesOf } from '../changes/words.js';
import { EMOJIcon } from '../emojis.js';
import { attachmentPath, fromFiles, resourceAttachment, sameAttachment, withRanges, withToken } from './attachments.js';
import { AddButton, Attached } from './Attached.js';
import { useComposerDrop } from './composer-drop.js';
import { warn } from '../../shell/notify/index.js';
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
export function messageOf(text: string, model: string | undefined, attachments: MessageAttachment[]): Message {
  return {
    text,
    origin: { kind: 'user' },
    ...(model === undefined ? {} : { model: { id: model } }),
    ...(attachments.length === 0 ? {} : { attachments: withRanges(text, attachments) }),
  } as Message;
}

/** The composer of one chat: the box, its `/` and `@` picker, the settings row, and send, queue, steer and stop. */
export const Composer = memo(function Composer({ host, chatUri, activeId, activeStart, queued: held, steering, draft, lastModel, lastUsage, config, changesets, summary, send, placeholder, steers = false }: {
  /** The session's host. */
  host: string;
  chatUri: string;
  activeId: string | undefined;
  activeStart: string | undefined;
  queued: PendingMessage[] | undefined;
  steering: PendingMessage | undefined;
  draft: Message | undefined;
  lastModel: string | undefined;
  /** The last turn's usage, for the context readout beside the model. */
  lastUsage: UsageInfo | undefined;
  config: SessionConfigState | undefined;
  /** The session's changesets: Add context lists the files of the first, the one the Changes pane opens on. */
  changesets: readonly Changeset[] | undefined;
  summary: SessionSummary;
  send: Send;
  /** The box's prompt, in place of the agent's; a chat with a bot names the bot. */
  placeholder?: string;
  /** Whether a message sent while a turn runs always steers it, as a bot's chat does, rather than waiting its turn. */
  steers?: boolean;
}): ReactElement {
  const scena = useScena();
  const { t } = useI18n();
  const agents = useStore<AgentInfo[]>(ahpPaths(host).agents) ?? [];
  const agent = agents.find((one) => one.provider === summary.provider);
  const path = useMemo(() => composerPath(host, chatUri), [host, chatUri]);
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
      hostBridge(host).dispatch(chatUri, { type: 'chat/draftChanged', draft: next } as StateAction);
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
    if (got.refused.length > 0) warn(t('sessions/upload/notAttached'), { description: t('sessions/upload/refused', { names: got.refused.join(', ') }) });
  }, [attach, t]);

  // A drop: a host file attaches, or with Shift goes in as `@path` text; this computer's files attach as content.
  const insert = useCallback((words: string): void => {
    const at = caretRef.current ?? textRef.current.length;
    const before = textRef.current.slice(0, at);
    const lead = before === '' || /\s$/.test(before) ? '' : ' ';
    typed.current = true;
    setText(`${before}${lead}${words}${textRef.current.slice(at)}`);
    focusCaret(before.length + lead.length + words.length);
  }, [focusCaret]);
  const drop = useComposerDrop({ host, attach, insert, upload: (list) => void upload(list) });

  // `@` asks the host what the text so far can refer to.
  const textRef = useRef(text);
  textRef.current = text;
  const caretRef = useRef(caret);
  caretRef.current = caret;
  const mentions = useCallback(async (): Promise<PickerAction[]> => {
    const said = textRef.current;
    try {
      const found = await hostBridge(host).request('completions', { kind: 'userMessage', channel: chatUri, text: said, offset: caretRef.current ?? said.length } as never);
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
    void hostBridge(host).request('completions', { kind: 'userMessage', channel: chatUri, text: '/', offset: 1 } as never)
      .then((found) => { if (alive) setCommands(hostCommands(found)); })
      .catch(() => { if (alive) setCommands([]); });
    return () => { alive = false; };
  }, [chatUri]);
  useEffect(() => {
    const registration = registerHostCommands(scena, focus, commands);
    return () => registration.dispose();
  }, [scena, focus, commands]);

  // While the + menu is open, the @ or / list under the box waits, so the two never overlap.
  const [adding, setAdding] = useState(false);
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

  const changes = useChangeset(host, useMemo(() => firstScope(scopesOf(changesets))?.uri, [changesets]));
  // A deleted file has nothing left to read.
  const changed: ChangedFile[] = useMemo(() => changes.files
    .filter((one) => one.status !== 'deleted')
    .map((one) => ({ title: one.name, description: one.dir, attachment: resourceAttachment(one.file, false) })), [changes.files]);
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
      hostBridge(host).dispatch(summary.resource, { type: 'session/configChanged', config: { [key]: value } } as StateAction);
    },
    running: () => active !== undefined,
    stop,
    session: () => summary.resource,
    host: () => host,
    attach,
    type: (prefix) => {
      const next = typeTrigger(textRef.current, caretRef.current ?? textRef.current.length, prefix);
      typed.current = true;
      setText(next.text);
      focusCaret(next.caret);
    },
    upload: () => files.current?.click(),
    changed: () => changed,
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
    host: () => api.current?.host() ?? host,
    attach: (attachment) => api.current?.attach(attachment),
    type: (prefix) => api.current?.type(prefix),
    upload: () => api.current?.upload(),
    changed: () => api.current?.changed() ?? [],
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
    hostBridge(host).dispatch(chatUri, { type: 'chat/draftChanged', draft: undefined } as unknown as StateAction);
  }

  function submit(kind: 'send' | 'steer'): void {
    const said = text.trim();
    if (said === '') return;
    const message = messageOf(said, model, attachments);
    if (active === undefined) {
      send({ type: 'chat/turnStarted', turnId: newId(), startedAt: new Date().toISOString(), message } as StateAction);
    } else if (kind === 'steer' || steers) {
      send({ type: 'chat/pendingMessageSet', kind: 'steering', id: newId(), message } as StateAction);
    } else {
      send({ type: 'chat/pendingMessageSet', kind: 'queued', id: newId(), message } as StateAction);
    }
    clear();
  }

  const modelName = models.find((one) => one.id === model)?.name ?? model;
  const readout = contextReadout(agent?.models.find((one) => one.id === model), lastUsage);
  const pills = options.filter(showsPill);
  const settingPill = (option: Option): ReactElement => (
    <Pill
      key={option.key}
      {...settingLabels(option)}
      title={option.schema.description ?? option.schema.title}
      {...(option.schema.type === 'boolean' ? { on: (option.value ?? option.schema.default) === true } : {})}
      {...(pickable(option.schema) ? { onOpen: () => openCommand(optionCommandId(option.key)) } : {})}
    />
  );

  return (
    <div className="web-composer">
      {picker.pickerNode === null || adding ? null : <div className="web-composer__picker">{picker.pickerNode}</div>}

      {steering === undefined && queued.length === 0 ? null : (
        <ul className="web-composer__queue">
          {steering === undefined ? null : (
            <li>
              <span className="web-chip" data-on="true">{t('sessions/composer/steering')}</span>
              <span className="web-composer__queued">{steering.message.text}</span>
              <Button label={t('sessions/composer/remove')} size="sm" onClick={() => send({ type: 'chat/pendingMessageRemoved', kind: 'steering', id: steering.id } as StateAction)} />
            </li>
          )}
          {queued.map((one, index) => (
            <li key={one.id}>
              <span className="web-chip">{t('sessions/composer/next', { number: index + 1 })}</span>
              <span className="web-composer__queued">{one.message.text}</span>
              <Button label={t('sessions/composer/remove')} size="sm" onClick={() => send({ type: 'chat/pendingMessageRemoved', kind: 'queued', id: one.id } as StateAction)} />
            </li>
          ))}
        </ul>
      )}

      <div className="web-composer__where">
        {folder === undefined ? null : <Pill label={`${EMOJIcon.folder} ${folderLabel(folder)}`} title={t('sessions/composer/folderHint')} />}
        <Pill label={`${EMOJIcon.agents} ${agent?.displayName ?? summary.provider}`} title={agent?.description ?? t('sessions/composer/agentHint')} />
      </div>

      <div
        className="web-composer__box"
        data-drop={drop.dropping ?? undefined}
        onDragOver={drop.onDragOver}
        onDragLeave={drop.onDragLeave}
        onDrop={drop.onDrop}
        onPaste={drop.onPaste}
      >
        <Attached
          attachments={attachments}
          folder={folder}
          onRemove={(index) => { typed.current = true; setAttachments((held) => held.filter((_, at) => at !== index)); }}
        />

        <div className="web-composer__bar">
          <textarea
            ref={area}
            className="web-composer__text"
            rows={1}
            value={text}
            aria-label={t('sessions/composer/message')}
            placeholder={placeholder ?? (active === undefined ? t('sessions/composer/placeholder') : t('sessions/composer/placeholderRunning'))}
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
          <AddButton host={host} path={path} onOpenChange={setAdding} />
          <input ref={files} type="file" multiple hidden onChange={(event) => { void upload(event.currentTarget.files); event.currentTarget.value = ''; }} />
          <div className="web-composer__chips web-composer__chips--left">
            {pills.filter((option) => footerSide(option) === 'left').map(settingPill)}
          </div>
          <div className="web-composer__chips web-composer__chips--right">
            {models.length === 0 ? null : (
              <Pill {...modelLabels(modelName ?? t('sessions/values/default'))} title={t('sessions/composer/modelHint')} onOpen={() => openCommand('ahp.composer.model')} />
            )}
            {pills.filter((option) => footerSide(option) === 'right').map(settingPill)}
            {readout === null ? null : <span className="web-composer__context" title={readout.title}>{readout.text}</span>}
          </div>
          {steers || active === undefined || text.trim() === '' ? null : <Button label={t('sessions/composer/steer')} size="sm" title={t('sessions/composer/steerHint')} onClick={() => submit('steer')} />}
          {steers || active === undefined || text.trim() === '' ? null : <Button label={t('sessions/composer/queue')} variant="primary" size="sm" title={t('sessions/composer/queueHint')} onClick={() => submit('send')} />}
          {active === undefined || (steers && text.trim() !== '') ? (
            <button type="button" className="web-composer__round" aria-label={t('sessions/composer/send')} title={t('sessions/composer/sendHint')} disabled={text.trim() === ''} onClick={() => submit('send')}>{EMOJIcon.send}</button>
          ) : (
            <button type="button" className="web-composer__round" aria-label={t('sessions/commands/stop')} title={t('sessions/composer/stopHint')} onClick={stop}>{EMOJIcon.stop}</button>
          )}
        </div>
      </div>
    </div>
  );
});
