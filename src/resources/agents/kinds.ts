import type { Customization } from '@microsoft/agent-host-protocol';
import { translate } from '@softov/scena';
import { counted, customizationRows, shortPath, type FileSpot, type NewKind, type StateWord } from './words.js';

/** The kinds in the order their tabs show; a kind the host sends that is not here comes after them. */
export const KIND_ORDER = ['agent', 'skill', 'prompt', 'rule', 'hook', 'mcpServer', 'plugin'] as const;

/** One customization in a kind's list: a child of a plugin or folder, a bare MCP server, or a plugin. */
export interface KindItem {
  /** Unique in its kind: its group's key and its id. */
  key: string;
  name: string;
  /** The name as the list shows it: `/name` for a skill or command. */
  label: string;
  /** The first line of its description. */
  line: string;
  description: string;
  flags: string[];
  enabled: boolean;
  state?: StateWord;
  /** Where it comes from, as a short path: its file, or its plugin or folder. */
  path: string;
  /** The plugin it comes from, which the list shows as a tag. */
  plugin?: string;
  open?: FileSpot;
  editable: boolean;
}

/** Items of one kind from one source: a folder, the plugins, or the host's own MCP servers. */
export interface KindGroup {
  key: string;
  /** The group's heading; empty for the host's own MCP servers and the plugins in the Plugins tab. */
  title: string;
  items: KindItem[];
}

/** One kind's tab: its groups, how many items they hold, and the folder a new file of the kind goes in. */
export interface KindTab {
  kind: string;
  count: number;
  groups: KindGroup[];
  /** A folder the host lets clients write this kind into; set for agents and skills only. */
  newFolder?: string;
  newKind?: NewKind;
}

/** A kind's name for its tab: "Skills", "MCP servers"; the kind itself for one ahpw has no word for. */
export function kindTitle(kind: string): string {
  return (KIND_ORDER as readonly string[]).includes(kind) ? translate(`agents/customizations/kinds/${kind}`) : kind;
}

/** An agent's customizations as one tab per kind, in `KIND_ORDER`; a writable folder of agents or skills makes its kind's tab even when it is empty. */
export function customizationKinds(items: readonly Customization[] | undefined): KindTab[] {
  const tabs = new Map<string, KindTab>();
  const tabOf = (kind: string): KindTab => {
    let tab = tabs.get(kind);
    if (tab === undefined) {
      tab = { kind, count: 0, groups: [] };
      tabs.set(kind, tab);
    }
    return tab;
  };
  const groupOf = (kind: string, key: string, title: string): KindGroup => {
    const tab = tabOf(kind);
    let group = tab.groups.find((one) => one.key === key);
    if (group === undefined) {
      group = { key, title, items: [] };
      tab.groups.push(group);
    }
    return group;
  };
  const add = (kind: string, group: KindGroup, item: Omit<KindItem, 'key'> & { id: string }): void => {
    const { id, ...rest } = item;
    group.items.push({ key: `${group.key}/${id}`, ...rest });
    tabOf(kind).count += 1;
  };
  for (const row of customizationRows(items)) {
    if (row.type === 'mcpServer') {
      add('mcpServer', groupOf('mcpServer', 'host', ''), {
        id: row.id, name: row.name, label: row.name, line: '', description: '', flags: row.meta, enabled: row.enabled,
        ...(row.state === undefined ? {} : { state: row.state }), path: row.path, ...(row.open === undefined ? {} : { open: row.open }), editable: false,
      });
      continue;
    }
    const plugin = row.type === 'plugin';
    if (plugin) {
      add('plugin', groupOf('plugin', 'plugins', ''), {
        id: row.id, name: row.name, label: row.name, line: row.meta.join(' · '), description: '', flags: [], enabled: row.enabled,
        ...(row.state === undefined ? {} : { state: row.state }), path: row.path, editable: false,
      });
    }
    if (row.newKind !== undefined) {
      const tab = tabOf(row.newKind);
      groupOf(row.newKind, row.id, row.path);
      if (tab.newFolder === undefined) {
        tab.newFolder = row.uri;
        tab.newKind = row.newKind;
      }
    }
    for (const child of row.children) {
      const group = plugin ? groupOf(child.type, 'plugins', translate('agents/customizations/kinds/plugin')) : groupOf(child.type, row.id, row.path);
      add(child.type, group, {
        id: child.id, name: child.name, label: child.label, line: child.line, description: child.description, flags: child.flags,
        enabled: child.enabled && row.enabled, ...(child.state === undefined ? {} : { state: child.state }),
        path: child.open === undefined ? row.path : shortPath(child.open.uri), ...(plugin ? { plugin: row.name } : {}),
        ...(child.open === undefined ? {} : { open: child.open }), editable: child.editable,
      });
    }
  }
  const rank = (kind: string): number => {
    const at = (KIND_ORDER as readonly string[]).indexOf(kind);
    return at < 0 ? KIND_ORDER.length : at;
  };
  return [...tabs.values()].sort((a, b) => rank(a.kind) - rank(b.kind));
}

/** The kinds in `KIND_ORDER` that have no tab, by their names: "Prompts, Rules, Hooks". */
export function emptyKinds(tabs: readonly KindTab[]): string[] {
  return KIND_ORDER.filter((kind) => !tabs.some((tab) => tab.kind === kind)).map(kindTitle);
}

/** A kind's tab key on the agent page: `kind:skill`. */
export const kindTabKey = (kind: string): string => `kind:${kind}`;

/** A kind's tab title: its name and its count, "Skills 29". */
export const kindTabTitle = (tab: KindTab): string => `${kindTitle(tab.kind)} ${tab.count}`;

/** A kind's count in words for the Overview: "29 skills". */
export const kindCount = (tab: KindTab): string => counted(tab.count, tab.kind);

/** The items of a tab whose name or description holds `query`, ignoring case; groups left empty go, except while nothing is searched. */
export function searchKind(tab: KindTab, query: string): KindGroup[] {
  const needle = query.trim().toLowerCase();
  if (needle === '') return tab.groups;
  return tab.groups
    .map((group) => ({ ...group, items: group.items.filter((item) => `${item.label}\n${item.description}\n${item.line}`.toLowerCase().includes(needle)) }))
    .filter((group) => group.items.length > 0);
}
