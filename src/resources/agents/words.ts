import type {
  AgentInfo,
  ChildCustomization,
  Customization,
  CustomizationDegradedState,
  CustomizationErrorState,
  CustomizationLoadState,
  DirectoryCustomization,
  McpServerAuthRequiredState,
  McpServerCustomization,
  McpServerErrorState,
  McpServerStartingState,
  RuleCustomization,
  SessionModelInfo,
} from '@microsoft/agent-host-protocol';
import { translate } from '@softov/scena';
import { folderLabel } from '../../bridges/words.js';
import { tokens } from '../sessions/turn.js';
import { EMOJIcon } from '../emojis.js';
import { plural } from '../../i18n/locales.js';

/** How many models an agent offers, in words. */
export function modelsLine(agent: AgentInfo): string {
  const count = agent.models.length;
  return count === 0 ? translate('agents/models/none') : plural('agents/models/count', count);
}

/** What an agent can do beyond one chat in one folder, in words. */
export function capabilitiesOf(agent: AgentInfo): string[] {
  const out: string[] = [];
  const chats = agent.capabilities?.multipleChats;
  if (chats !== undefined) out.push(translate(chats.fork === true ? 'agents/capabilities/chatsAndForks' : 'agents/capabilities/chats'));
  const folders = agent.capabilities?.multipleWorkingDirectories;
  if (folders !== undefined) out.push(translate(folders.immutablePrimary === true ? 'agents/capabilities/foldersFirstFixed' : 'agents/capabilities/folders'));
  return out;
}

/** One of a model's limits: its icon, its short text and its full words. */
export interface Limit {
  icon: string;
  /** The size, or empty for a limit the icon says alone. */
  text: string;
  title: string;
}

/** A model's limits: context, output, vision. */
export function limitsOf(model: SessionModelInfo): Limit[] {
  const out: Limit[] = [];
  if (model.maxContextWindow !== undefined) {
    const size = tokens(model.maxContextWindow);
    out.push({ icon: EMOJIcon.download, text: size, title: translate('agents/limits/context', { size }) });
  }
  if (model.maxOutputTokens !== undefined) {
    const size = tokens(model.maxOutputTokens);
    out.push({ icon: EMOJIcon.upload, text: size, title: translate('agents/limits/output', { size }) });
  }
  if (model.supportsVision === true) out.push({ icon: EMOJIcon.image, text: '', title: translate('agents/limits/images') });
  return out;
}

/** The customization kinds a person has a name for, under `agents/kinds/<kind>`. */
const KINDS = new Set(['plugin', 'directory', 'mcpServer']);

/** The child types counted by name, under `agents/counts/<type>`; any other is counted as items. */
const NOUNS = new Set(['agent', 'skill', 'prompt', 'rule', 'hook', 'mcpServer']);

/** The reasons an MCP server waits on sign-in that a person has words for, under `agents/auth/<reason>`. */
const AUTH = new Set(['required', 'expired', 'insufficientScope']);

/** What a row's dot says: its tone and its words. `busy` draws a spinner instead of a dot. */
export interface StateWord {
  tone: 'success' | 'info' | 'warning' | 'danger' | 'default' | 'busy';
  text: string;
}

/** One child of a plugin or folder, as its row reads it. */
export interface ChildRow {
  id: string;
  name: string;
  /** The name as the row shows it: `/name` for a skill or command, which a message calls that way. */
  label: string;
  line: string;
  /** The whole description, which the row's `line` is the start of. */
  description: string;
  flags: string[];
  enabled: boolean;
  state?: StateWord;
  /** The file the customization is; absent when it is not a file. */
  open?: FileSpot;
  /** Whether its file may be edited: an agent or skill in a folder the host lets clients write into. */
  editable: boolean;
}

/** A file, and the line its declaration starts at when it is one part of the file. */
export interface FileSpot {
  uri: string;
  line: number | null;
}

/** One customization, as its row reads it, with its children. */
export interface CustomizationRow {
  id: string;
  type: string;
  name: string;
  kind: string;
  path: string;
  meta: string[];
  enabled: boolean;
  state?: StateWord;
  /** The file the customization is, or is declared in; absent for a plugin, a folder and what is not a file. */
  open?: FileSpot;
  /** The customization's own URI: a folder's is where a new file goes. */
  uri: string;
  /** What a new file in this folder is: set only on a folder the host lets clients write agents or skills into. */
  newKind?: NewKind;
  children: ChildRow[];
}

/** The kinds of file a client makes in a writable folder. */
export type NewKind = 'agent' | 'skill';

/** The child kinds a client makes and edits. */
const NEW_KINDS: ReadonlySet<string> = new Set<NewKind>(['agent', 'skill']);

/** Whether a customization is on: a folder's own flag, or the most specific enablement decision. */
export function enabledOf(item: Customization | ChildCustomization): boolean {
  if ('enablement' in item && item.enablement !== undefined) return item.enablement[0]?.enabled ?? true;
  return (item as { enabled?: boolean }).enabled ?? true;
}

/** `count` things of one child type, in words: "1 agent", "12 skills". */
function counted(count: number, type: string): string {
  return plural(`agents/counts/${NOUNS.has(type) ? type : 'item'}`, count);
}

/** What a container holds, in words: by its `contents` for a folder, by its children's types for a plugin. Nothing when the host has not parsed it yet. */
export function countOf(item: Customization): string | undefined {
  if (String(item.type) === 'mcpServer') return undefined;
  const children = (item as { children?: ChildCustomization[] }).children;
  if (children === undefined) return undefined;
  if (item.type === ('directory' as DirectoryCustomization['type'])) return counted(children.length, String((item as DirectoryCustomization).contents));
  if (children.length === 0) return translate('agents/counts/empty');
  const types = new Map<string, number>();
  for (const child of children) types.set(String(child.type), (types.get(String(child.type)) ?? 0) + 1);
  return [...types].map(([type, count]) => counted(count, type)).join(', ');
}

/** A URI as a short path: a `file://` URI becomes its path, with a home folder as `~`. */
export function shortPath(uri: string): string {
  return folderLabel(uri).replace(/^(\/home\/[^/]+|\/Users\/[^/]+|\/root)(?=\/|$)/, '~');
}

/** The first line of a text. */
export function brief(text: string | undefined): string {
  return (text ?? '').trim().split('\n')[0]?.trim() ?? '';
}

/** What a customization's dot says: an MCP server's lifecycle, or a container's load when it is not plainly loaded. */
export function stateOf(item: Customization | ChildCustomization): StateWord | undefined {
  if (String(item.type) === 'mcpServer') {
    const state = (item as McpServerCustomization).state;
    switch (String(state.kind)) {
      case 'ready': return { tone: 'success', text: translate('agents/states/ready') };
      case 'starting': return { tone: 'info', text: translate((state as McpServerStartingState).blocking === true ? 'agents/states/startingBlocking' : 'agents/states/starting') };
      case 'authRequired': {
        const reason = String((state as McpServerAuthRequiredState).reason);
        return { tone: 'warning', text: AUTH.has(reason) ? translate(`agents/auth/${reason}`) : reason };
      }
      case 'error': return { tone: 'danger', text: (state as McpServerErrorState).error.message };
      case 'stopped': return { tone: 'default', text: translate('agents/states/stopped') };
      default: return { tone: 'default', text: String(state.kind) };
    }
  }
  const load = (item as { load?: CustomizationLoadState }).load;
  switch (load === undefined ? undefined : String(load.kind)) {
    case 'loading': return { tone: 'busy', text: translate('agents/states/loading') };
    case 'degraded': return { tone: 'warning', text: (load as CustomizationDegradedState).message };
    case 'error': return { tone: 'danger', text: (load as CustomizationErrorState).message };
    default: return undefined;
  }
}

/** A child's flags, only those that say something: who may call it, the model it is pinned to, when a rule applies. */
export function childFlags(child: ChildCustomization): string[] {
  const flags: string[] = [];
  const bag = child as { disableModelInvocation?: boolean; disableUserInvocation?: boolean; model?: string };
  if (bag.disableModelInvocation === true) flags.push(translate('agents/flags/userOnly'));
  if (bag.disableUserInvocation === true) flags.push(translate('agents/flags/modelOnly'));
  if (bag.model !== undefined && bag.model !== '') flags.push(translate('agents/flags/pinned', { model: bag.model }));
  if (child.type === ('rule' as RuleCustomization['type'])) {
    const rule = child as RuleCustomization;
    if (rule.globs !== undefined && rule.globs.length > 0) flags.push(rule.globs.join(', '));
    else if (rule.alwaysApply === true) flags.push(translate('agents/flags/always'));
  }
  return flags;
}

/** A child's description on one line; the row cuts it where it runs out of room. */
export function childLine(child: ChildCustomization): string {
  return brief((child as { description?: string }).description);
}

/** A Markdown file's text without the frontmatter at its top, which the row already shows. */
export function withoutFrontmatter(text: string): string {
  return text.replace(/^---\r?\n[\s\S]*?\r?\n---[ \t]*(\r?\n|$)/, '').trimStart();
}

/** The child kinds a message calls with `/name`: skills and commands. */
const SLASH_KINDS = new Set(['skill', 'prompt']);

/** The customization kinds that are folders holding others. */
const CONTAINERS = new Set(['plugin', 'directory']);

/** The file a customization is, or is declared in, and a skill folder's `SKILL.md`; undefined for a plugin or folder, which are folders, and for a URI that is not a file. */
export function fileSpotOf(item: Customization | ChildCustomization): FileSpot | undefined {
  if (CONTAINERS.has(String(item.type)) || !item.uri.startsWith('file:')) return undefined;
  if (String(item.type) === 'skill' && !/\.md$/i.test(item.uri)) return { uri: `${item.uri.replace(/\/+$/, '')}/SKILL.md`, line: null };
  return { uri: item.uri, line: item.range === undefined ? null : item.range.start.line + 1 };
}

/** Whether a customization is a folder the host lets clients write into. */
const writableFolder = (item: Customization): boolean => String(item.type) === 'directory' && (item as { writable?: boolean }).writable === true;

/** One child as its row reads it; `writable` is whether its folder takes writes. */
export function childRow(child: ChildCustomization, writable = false): ChildRow {
  const state = String(child.type) === 'mcpServer' ? stateOf(child) : undefined;
  const open = fileSpotOf(child);
  return {
    id: child.id,
    name: child.name,
    label: SLASH_KINDS.has(String(child.type)) ? `/${child.name}` : child.name,
    line: childLine(child),
    description: ((child as { description?: string }).description ?? '').trim(),
    flags: childFlags(child),
    enabled: enabledOf(child),
    ...(state === undefined ? {} : { state }),
    ...(open === undefined ? {} : { open }),
    editable: writable && open !== undefined && NEW_KINDS.has(String(child.type)),
  };
}

/** The words beside a customization's name: what it holds, read-only, its version, off. */
function metaOf(item: Customization, enabled: boolean): string[] {
  const meta: string[] = [];
  const count = countOf(item);
  if (count !== undefined) meta.push(count);
  if ((item as { writable?: boolean }).writable === false) meta.push(translate('agents/meta/readOnly'));
  const version = (item as { version?: string }).version;
  if (version !== undefined && version !== '') meta.push(`v${version}`);
  meta.push(translate(enabled ? 'agents/meta/on' : 'agents/meta/off'));
  return meta;
}

/** An agent's customizations as rows: plugins and folders first, then bare MCP servers, each group in host order. */
export function customizationRows(items: readonly Customization[] | undefined): CustomizationRow[] {
  const list = items ?? [];
  const ordered = [...list.filter((one) => String(one.type) !== 'mcpServer'), ...list.filter((one) => String(one.type) === 'mcpServer')];
  return ordered.map((item) => {
    const enabled = enabledOf(item);
    const state = stateOf(item);
    const type = String(item.type);
    const open = fileSpotOf(item);
    const writable = writableFolder(item);
    const contents = String((item as { contents?: string }).contents);
    return {
      id: item.id,
      type,
      name: item.name,
      kind: KINDS.has(type) ? translate(`agents/kinds/${type}`) : type,
      path: shortPath(item.uri),
      meta: metaOf(item, enabled),
      enabled,
      ...(state === undefined ? {} : { state }),
      ...(open === undefined ? {} : { open }),
      uri: item.uri,
      ...(writable && NEW_KINDS.has(contents) ? { newKind: contents as NewKind } : {}),
      children: ((item as { children?: ChildCustomization[] }).children ?? []).map((child) => childRow(child, writable)),
    };
  });
}

/** One `/` command an agent offers before a session exists: a skill or command a person may call. */
export interface SlashCommand {
  name: string;
  description: string;
}

/** The skills and commands a person may call with `/name`, from an agent's customizations: on, and not kept for the model alone. The first of a name wins. */
export function slashCommandsOf(items: readonly Customization[] | undefined): SlashCommand[] {
  const seen = new Set<string>();
  const found: SlashCommand[] = [];
  for (const item of items ?? []) {
    if (!enabledOf(item)) continue;
    for (const child of (item as { children?: ChildCustomization[] }).children ?? []) {
      if (!SLASH_KINDS.has(String(child.type)) || !enabledOf(child)) continue;
      if ((child as { disableUserInvocation?: boolean }).disableUserInvocation === true || seen.has(child.name)) continue;
      seen.add(child.name);
      found.push({ name: child.name, description: childLine(child) });
    }
  }
  return found;
}

/** What signing in to an agent involves: each resource it protects, and the scopes it asks for. */
export function signInOf(agent: AgentInfo): { name: string; scopes: string; required: boolean }[] {
  return (agent.protectedResources ?? []).map((one) => ({
    name: one.resource_name ?? one.resource,
    scopes: (one.scopes_supported ?? []).join(', '),
    required: one.required === true,
  }));
}
