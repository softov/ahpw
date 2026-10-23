import type { PickerAction } from '@softov/scena/types';
import { refKey } from '../../bridges/hosts.js';
import { CONNECTOR_STATES, type AdapterRow, type ConnectorOwner, type ConnectorRow, type ConnectorState } from '../../bridges/connectors.js';
import type { Dot, Row } from '../../shell/explorer/ExplorerList.js';
import { arrange } from '../sessions/grouping.js';

/** How the list groups its connectors. */
export type ConnectorGrouping = 'adapter' | 'owner' | 'state';
export const CONNECTOR_GROUPINGS: readonly ConnectorGrouping[] = ['adapter', 'owner', 'state'];

const DOT: Record<ConnectorState, Dot> = {
  unavailable: 'failed',
  invalid: 'attention',
  open: 'ok',
};

/** One connector of one host, as the list is given it, with the adapters that host lists. */
export interface ConnectorEntry {
  host: string;
  hostName: string;
  row: ConnectorRow;
  adapters: readonly AdapterRow[];
  /** The reader's own owner on that host, `user:<id>`, when they have one. */
  me?: ConnectorOwner;
}

/** The words and callbacks the rows are made with. */
export interface RowWords {
  multi: boolean;
  state: (state: ConnectorState) => string;
  /** An owner in the reader's words: *Me*, *Team ...*, *The host*, or the person's id. */
  owner: (owner: ConnectorOwner, me: ConnectorOwner | undefined) => string;
  /** What a connector whose record names no adapter is under. */
  noAdapter: string;
  menu: (entry: ConnectorEntry) => PickerAction[];
}

/** A connector's adapter, as its host titles it, or its name when no plugin registers it. */
export const adapterTitle = (adapters: readonly AdapterRow[], name: string): string =>
  adapters.find((one) => one.name === name)?.title ?? name;

/** An owner's place in the owner grouping: me, then teams, then the host, then other people. */
function ownerRank(owner: ConnectorOwner, me: ConnectorOwner | undefined): number {
  if (owner === me) return 0;
  if (owner.startsWith('team:')) return 1;
  if (owner === 'host') return 2;
  return 3;
}

/**
 * The list's rows. By adapter, groups follow the adapters' titles, and a
 * record that names none closes the list. By owner, the reader's own lead. By
 * state, problems lead and open ones close it.
 */
export function connectorRows(entries: readonly ConnectorEntry[], by: ConnectorGrouping, words: RowWords): Row[] {
  const titleOf = (row: ConnectorRow): string => row.title || row.id;
  const adapterOf = (entry: ConnectorEntry): string =>
    (entry.row.adapter === undefined ? words.noAdapter : adapterTitle(entry.adapters, entry.row.adapter));
  const sorted = [...entries].sort((a, b) => titleOf(a.row).localeCompare(titleOf(b.row)) || a.host.localeCompare(b.host));
  const groupOf = (entry: ConnectorEntry): { key: string; label: string; rank: number } => {
    const { row } = entry;
    if (by === 'state') return { key: `state:${row.state}`, label: words.state(row.state), rank: CONNECTOR_STATES.indexOf(row.state) };
    if (by === 'owner') return { key: `owner:${row.owner}`, label: words.owner(row.owner, entry.me), rank: ownerRank(row.owner, entry.me) };
    return { key: `adapter:${row.adapter ?? ''}`, label: adapterOf(entry), rank: row.adapter === undefined ? 1 : 0 };
  };
  // Groups of one rank are kept in the order given, so give them by label.
  const placed = sorted
    .map((entry) => ({ entry, group: groupOf(entry) }))
    .sort((a, b) => a.group.rank - b.group.rank || a.group.label.localeCompare(b.group.label));

  return arrange(placed, (one) => one.group).map(({ entry, group }) => {
    const { row } = entry;
    const title = titleOf(row);
    return {
      key: refKey(entry.host, row.id),
      dot: DOT[row.state],
      dotLabel: words.state(row.state),
      title,
      lines: [
        [
          words.multi ? entry.hostName : undefined,
          title === row.id ? undefined : row.id,
          by === 'adapter' ? undefined : adapterOf(entry),
          by === 'owner' ? undefined : words.owner(row.owner, entry.me),
        ].filter((bit) => bit !== undefined).join(' \u{00B7} '),
      ].filter((line) => line !== ''),
      menu: words.menu(entry),
      group: { key: group.key, label: group.label },
    };
  });
}
