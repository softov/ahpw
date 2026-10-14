import type { BindingPath, Command, CommandContext, Disposable, PickerAction, Scena } from '@softov/scena/types';
import { combineDisposables } from '@softov/scena';
import { getActiveToken } from '@softov/scena/ui';
import type { MessageAttachment, SessionConfigPropertySchema, SessionSummary } from '@microsoft/agent-host-protocol';
import { AHP_SESSIONS } from '../connection/data.js';
import { chatAttachment, clipboardImage, fromFiles } from './attachments.js';
import { EMOJIcon } from '../emojis.js';

/** The slot the composer's `/` commands are offered in. */
export const COMPOSER_SLOT = 'ahp:input/';

/** The slot the new session box's `/` commands are offered in: the chosen agent's skills and commands, its agent, model and settings, and Add context. */
export const NEW_SLOT = 'ahp:new/';

/** A model the agent offers. */
export interface ModelChoice {
  id: string;
  name: string;
}

/** A session setting the host lets change while the session runs. */
export interface Option {
  key: string;
  schema: SessionConfigPropertySchema;
  value: unknown;
}

/** What a composer lets its commands read and do. */
export interface ComposerApi {
  models(): ModelChoice[];
  model(): string | undefined;
  setModel(id: string | undefined): void;
  options(): Option[];
  setOption(key: string, value: unknown): void;
  running(): boolean;
  stop(): void;
  /** The session this composer writes to. */
  session(): string;
  attach(attachment: MessageAttachment): void;
  /** Write a picker's prefix at the caret, which opens that picker. */
  type(prefix: '@' | '/'): void;
  /** Ask the browser for files to send with the message. */
  upload(): void;
  /** The session's changed files, to attach from Add context; none before a session exists. */
  changed(): ChangedFile[];
}

/** A file the session changed, as Add context lists it. */
export interface ChangedFile {
  title: string;
  description: string;
  attachment: MessageAttachment;
}

/** The data context a composer's picker runs its commands under. */
export const composerPath = (chatUri: string): BindingPath => `$/ahp/composers/${encodeURIComponent(chatUri)}` as BindingPath;

const composers = new Map<string, ComposerApi>();

/** Make a composer reachable by its commands until the returned function is called. */
export function attachComposer(path: BindingPath, api: ComposerApi): () => void {
  composers.set(path, api);
  return () => {
    if (composers.get(path) === api) composers.delete(path);
  };
}

const apiOf = (ctx: CommandContext): ComposerApi | undefined => (ctx.dataContext === undefined ? undefined : composers.get(ctx.dataContext));

/** The composer at `path`, for a control of the composer that is not a command, as its `+`. */
export const composerAt = (path: BindingPath): ComposerApi | undefined => composers.get(path);

/**
 * The text after Add context types `@` or `/` at the caret. An `@` or `/` word
 * already at the caret is replaced, as a pill's command replaces it, so
 * choosing twice leaves one trigger; `/` goes at the start of an empty box.
 */
export function typeTrigger(text: string, caret: number, prefix: '@' | '/'): { text: string; caret: number } {
  const open = getActiveToken(text, ['/', '@'], caret);
  if (open !== null) return { text: `${text.slice(0, open.start)}${prefix}${text.slice(open.end)}`, caret: open.start + 1 };
  const before = text.slice(0, caret);
  if (prefix === '/' && before.trim() === '') return { text: `/${text.slice(caret)}`, caret: 1 };
  const lead = before === '' || /\s$/.test(before) ? '' : ' ';
  return { text: `${before}${lead}${prefix}${text.slice(caret)}`, caret: before.length + lead.length + 1 };
}

/**
 * Add context's items, for the `+` and `/attach` alike: the host's files, an
 * upload, the clipboard's image, another session, the commands, then the files
 * this session changed. `image` is the clipboard's image, or why there is none.
 */
export function contextItems(api: ComposerApi, sessions: readonly SessionSummary[], image: File | string): PickerAction[] {
  const close = (then: () => void) => (host: { closeMenu(): void }) => {
    host.closeMenu();
    then();
  };
  const others = sessions.filter((one) => one.resource !== api.session() && one.defaultChat !== undefined);
  return [
    { title: `${EMOJIcon.file} Files and folders`, description: 'On the server\'s machine', onSelect: close(() => api.type('@')) },
    { title: `${EMOJIcon.attach} Upload`, description: 'From this computer, up to 5 MB each', onSelect: close(() => api.upload()) },
    typeof image === 'string'
      ? { title: `${EMOJIcon.image} Image from clipboard`, description: image, disabled: true, onSelect: () => undefined }
      : {
        title: `${EMOJIcon.image} Image from clipboard`,
        description: 'The image you copied',
        onSelect: close(() => void fromFiles([image]).then((got) => got.attached.forEach((one) => api.attach(one)))),
      },
    {
      title: `${EMOJIcon.sessions} Sessions`,
      description: others.length === 0 ? 'No other session' : 'Another session\'s chat',
      disabled: others.length === 0,
      onSelect: (host) => host.pushList({
        title: 'Sessions',
        items: others.map((one) => ({
          title: one.title === '' ? 'Untitled' : one.title,
          onSelect: close(() => api.attach(chatAttachment(one))),
        })),
      }),
    },
    { title: `${EMOJIcon.terminal} Commands`, description: 'What the agent and this page can do', onSelect: close(() => api.type('/')) },
    ...api.changed().map((one) => ({ title: one.title, description: one.description, group: 'changed', onSelect: close(() => api.attach(one.attachment)) })),
  ];
}

/** Commands every open composer shares, counted so the last one to go takes them away. */
const shared = new Map<string, { count: number; registration: Disposable }>();

function share(scena: Scena, command: Command): Disposable {
  const held = shared.get(command.id);
  if (held !== undefined) held.count += 1;
  else shared.set(command.id, { count: 1, registration: scena.commands.register(command) });
  let done = false;
  return {
    dispose() {
      if (done) return;
      done = true;
      const entry = shared.get(command.id);
      if (entry === undefined) return;
      entry.count -= 1;
      if (entry.count > 0) return;
      shared.delete(command.id);
      entry.registration.dispose();
    },
  };
}

/** `Approval Mode` as `/approval-mode`. */
export const slashOf = (title: string): string => `/${title.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`;

/** A value as a short phrase: a list by its items or its count, an object by what it holds. */
export function valueWords(value: unknown): string {
  if (value === undefined || value === null) return 'default';
  if (Array.isArray(value)) {
    if (value.length === 0) return 'none';
    return value.length <= 2 && value.every((one) => typeof one === 'string') ? value.join(', ') : `${value.length} items`;
  }
  if (typeof value === 'object') {
    const held = Object.entries(value as Record<string, unknown>).filter(([, one]) => one !== undefined && !(Array.isArray(one) && one.length === 0));
    return held.length === 0 ? 'none' : held.map(([key, one]) => `${key} ${valueWords(one)}`).join(', ');
  }
  return String(value);
}

/** A setting's value as a person reads it: its enum label, or the value. */
export function optionLabel(option: Option): string {
  const { schema, value } = option;
  const current = value ?? schema.default;
  if (schema.type === 'boolean') return current === true ? 'on' : 'off';
  const index = schema.enum?.findIndex((one) => one === current) ?? -1;
  if (index >= 0) return schema.enumLabels?.[index] ?? String(current);
  return valueWords(current);
}

/** Whether a setting can be changed from the picker: a choice or a switch. */
export const pickable = (schema: SessionConfigPropertySchema): boolean => schema.type === 'boolean' || (schema.enum?.length ?? 0) > 0;

/** Whether a setting gets a pill: one that holds nothing and cannot be changed has nothing to show. */
export const showsPill = (option: Option): boolean => pickable(option.schema) || optionLabel(option) !== 'none';

/** The command id behind a setting's pill and its `/` shortcut. */
export const optionCommandId = (key: string): string => `ahp.composer.option.${key}`;

function optionCommand(key: string, schema: SessionConfigPropertySchema): Command {
  const shortcut = slashOf(schema.title || key);
  return {
    id: optionCommandId(key),
    title: schema.title || key,
    ...(schema.description === undefined ? {} : { description: schema.description }),
    category: 'Settings',
    shortcut,
    slots: [COMPOSER_SLOT, NEW_SLOT],
    // Shared by key: a composer whose agent has no such setting lists it greyed.
    disabled: (ctx) => apiOf(ctx)?.options().some((one) => one.key === key) !== true,
    run: (ctx) => {
      const api = apiOf(ctx);
      const option = api?.options().find((one) => one.key === key);
      if (api === undefined || option === undefined) return;
      if (option.schema.type === 'boolean') {
        api.setOption(key, !(option.value ?? option.schema.default ?? false));
        ctx.host?.closeMenu();
        return;
      }
      const current = option.value ?? option.schema.default;
      const items: PickerAction[] = (option.schema.enum ?? []).map((value, index) => ({
        title: option.schema.enumLabels?.[index] ?? String(value),
        ...(option.schema.enumDescriptions?.[index] === undefined ? {} : { description: option.schema.enumDescriptions[index] }),
        active: value === current,
        onSelect: (host) => {
          api.setOption(key, value);
          host.closeMenu();
        },
      }));
      ctx.host?.pushList({ title: option.schema.title || key, items, sentinel: shortcut });
    },
  };
}

/** One command per setting the composer offers, for as long as the returned registration lives. */
export function registerOptionCommands(scena: Scena, options: readonly Option[]): Disposable {
  return combineDisposables(...options.filter((option) => pickable(option.schema)).map((option) => share(scena, optionCommand(option.key, option.schema))));
}

/** The commands every composer has: the model, stopping a turn, and a new session. */
export function registerComposerCommands(scena: Scena): Disposable {
  return combineDisposables(
    share(scena, {
      id: 'ahp.composer.model',
      title: 'Model',
      description: 'The model the next message is sent to',
      category: 'Settings',
      shortcut: '/model',
      slots: [COMPOSER_SLOT, NEW_SLOT],
      disabled: (ctx) => (apiOf(ctx)?.models().length ?? 0) === 0,
      run: (ctx) => {
        const api = apiOf(ctx);
        if (api === undefined) return;
        const current = api.model();
        const pick = (id: string | undefined) => (host: { closeMenu(): void }) => {
          api.setModel(id);
          host.closeMenu();
        };
        ctx.host?.pushList({
          title: 'Model',
          sentinel: '/model',
          items: [
            { title: 'Agent default', active: current === undefined, onSelect: pick(undefined) },
            ...api.models().map((model) => ({ title: model.name, description: model.id, active: model.id === current, onSelect: pick(model.id) })),
          ],
        });
      },
    }),
    share(scena, {
      id: 'ahp.composer.attach',
      title: 'Add context',
      description: 'Attach a file, a session, or a file from this computer',
      category: 'Session',
      shortcut: '/attach',
      slots: [COMPOSER_SLOT, NEW_SLOT],
      run: async (ctx) => {
        const api = apiOf(ctx);
        if (api === undefined) return;
        const image = await clipboardImage();
        ctx.host?.pushList({ title: 'Add context', sentinel: '/attach', items: contextItems(api, ctx.store.get<SessionSummary[]>(AHP_SESSIONS) ?? [], image) });
      },
    }),
    share(scena, {
      id: 'ahp.composer.stop',
      title: 'Stop',
      description: 'Stop the turn that is running',
      category: 'Session',
      shortcut: '/stop',
      slots: [COMPOSER_SLOT],
      disabled: (ctx) => apiOf(ctx)?.running() !== true,
      run: (ctx) => {
        apiOf(ctx)?.stop();
        ctx.host?.closeMenu();
      },
    }),
    share(scena, {
      id: 'ahp.composer.new',
      title: 'New session',
      description: 'Start another session',
      category: 'Session',
      shortcut: '/new',
      slots: [COMPOSER_SLOT],
      run: (ctx) => {
        ctx.host?.closeMenu();
        void ctx.scena.commands.execute('ahp.newSession');
      },
    }),
  );
}
