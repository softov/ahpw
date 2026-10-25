import type { PickerAction } from '@softov/scena/types';
import { refKey } from '../../bridges/hosts.js';
import { PLUGIN_STATES, type PluginRow, type PluginState } from '../../bridges/plugins.js';
import type { Dot, Row } from '../../shell/explorer/ExplorerList.js';
import { EMOJIcon } from '../emojis.js';
import { arrange } from '../sessions/grouping.js';

/** How the list groups its plugins. */
export type PluginGrouping = 'state' | 'category';
export const PLUGIN_GROUPINGS: readonly PluginGrouping[] = ['state', 'category'];

/** The categories ahpd names, in the order the list shows them; any other follows, then *Other*. */
export const KNOWN_CATEGORIES = ['agent', 'channel', 'connector', 'storage', 'tool'] as const;

/** The group a plugin with no category is under. */
export const NO_CATEGORY = '';

const DOT: Record<PluginState, Dot> = {
  error: 'failed',
  missing: 'failed',
  incompatible: 'attention',
  unconfigured: 'attention',
  ready: 'ok',
  disabled: 'off',
};

/** One plugin of one host, as the list is given it. */
export interface PluginEntry {
  host: string;
  hostName: string;
  id: string;
  row: PluginRow;
}

/** The words and callbacks the rows are made with. */
export interface RowWords {
  multi: boolean;
  state: (state: PluginState) => string;
  /** What a plugin the host tried and failed to load is said to be, over its configured state. */
  loadFailed: string;
  category: (category: string) => string;
  menu: (entry: PluginEntry) => PickerAction[];
}

/** A plugin's categories, or the one *Other* stands for. */
const categoriesOf = (row: PluginRow): string[] => {
  const named = row.manifest?.categories ?? [];
  return named.length === 0 ? [NO_CATEGORY] : named;
};

/** A category's place: ahpd's own first in their order, then the rest by name, then *Other*. */
function categoryRank(category: string): number {
  if (category === NO_CATEGORY) return 1_000_000;
  const known = (KNOWN_CATEGORIES as readonly string[]).indexOf(category);
  return known >= 0 ? known : 100;
}

/**
 * The list's rows. By state, problems lead and disabled plugins close it. By
 * category, a plugin is under each category it names, so its row key carries
 * the category to stay one of a kind.
 */
export function pluginRows(entries: readonly PluginEntry[], by: PluginGrouping, words: RowWords): Row[] {
  const sorted = [...entries].sort((a, b) => (a.row.title ?? a.id).localeCompare(b.row.title ?? b.id) || a.host.localeCompare(b.host));
  const placed = by === 'state'
    ? sorted.map((entry) => ({ entry, group: { key: entry.row.state, label: words.state(entry.row.state), rank: PLUGIN_STATES.indexOf(entry.row.state) } }))
    : sorted.flatMap((entry) => categoriesOf(entry.row).map((category) => ({
      entry,
      group: { key: `category:${category}`, label: words.category(category), rank: categoryRank(category) },
    })));
  // Two unknown categories share a rank; arrange keeps them in the order given, so give it them by name.
  const ordered = by === 'category' ? [...placed].sort((a, b) => a.group.rank - b.group.rank || a.group.label.localeCompare(b.group.label)) : placed;

  return arrange(ordered, (one) => one.group).map(({ entry, group }) => {
    const { row } = entry;
    const title = row.title ?? entry.id;
    const categories = (row.manifest?.categories ?? []).map(words.category).join(', ');
    return {
      key: by === 'state' ? refKey(entry.host, entry.id) : `${group.key}|${refKey(entry.host, entry.id)}`,
      // A load that failed is louder than what the configuration says.
      dot: row.loadProblem === undefined ? DOT[row.state] : 'failed',
      dotLabel: row.loadProblem === undefined ? words.state(row.state) : words.loadFailed,
      title,
      ...(row.manifest?.icons === undefined ? {} : { icons: row.manifest.icons }),
      emoji: EMOJIcon.hostPlugins,
      lines: [
        [words.multi ? entry.hostName : undefined, title === entry.id ? undefined : entry.id, row.version, categories === '' ? undefined : categories]
          .filter((bit) => bit !== undefined).join(' \u{00B7} '),
        ...(row.problem === undefined ? [] : [row.problem]),
        // ahpd repeats a configured problem as the load's; one line says it.
        ...(row.loadProblem === undefined || row.loadProblem === row.problem ? [] : [row.loadProblem]),
      ].filter((line) => line !== ''),
      menu: words.menu(entry),
      group: { key: group.key, label: group.label },
    };
  });
}

/** The plugin a row key names, by either grouping. */
export const entryKeyOf = (key: string): string => (key.startsWith('category:') ? key.slice(key.indexOf('|') + 1) : key);
