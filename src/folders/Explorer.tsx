import { useCallback, useEffect, useMemo, useRef, useState, type MouseEvent, type ReactElement } from 'react';
import { useScena, useStore } from '@softov/scena/react';
import { Alert, ContextMenu, Spinner, Tree, type TreeNode } from '@softov/scena/ui';
import type { DirectoryEntry, SessionSummary } from '@microsoft/agent-host-protocol';
import { AHP_CONNECTION, AHP_DEFAULT_DIRECTORY, AHP_SESSIONS, ROOT, request, type Connection } from '../connection/data.js';
import { folderLabel } from '../connection/words.js';
import { EMOJIcon } from '../emojis.js';
import { iconOf } from '../files/icons.js';
import { viewerTitle, viewersOf } from '../files/viewers.js';
import { hideOverlaidSidebar } from '../sessions/index.js';
import type { BindingPath, PickerAction } from '@softov/scena/types';
import type { ModusClass } from '@softov/scena';
import { setHostFile, type DraggedHostFile } from './drag.js';
import { chainTo, childUri, orderEntries, rootsOf } from './roots.js';
import { REVEAL_FOLDER } from './index.js';
import { ADDED_FOLDERS } from './added.js';
import { EXPANDED_FOLDERS, writeExpanded } from './expanded.js';
import { STALE_FOLDERS, addFolder, type StaleFolders } from './actions.js';
import { ENTRY_SLOT, MENU_ENTRY, type MenuEntry } from './menu.js';

/** The display size class the modus backend publishes. */
const MODUS_CLASS = '$/modus/class' as BindingPath;

/** A folder's listing: asked for, refused, or what the host answered. */
type Branch = 'loading' | 'failed' | DirectoryEntry[];

/** A folder's last segment, with its whole path beside it on hover. */
function nameOf(uri: string): ReactElement {
  const path = folderLabel(uri);
  return <span title={path}>{path.replace(/\/+$/, '').split('/').pop() || path}</span>;
}

/** The sidebar: the host's folders as a tree, one level asked for at a time. Files open on click and drag into the composer; a folder a link names opens down to it; rows and the space under them have menus. */
export default function FolderExplorer(): ReactElement {
  const scena = useScena();
  const connection = useStore<Connection>(AHP_CONNECTION);
  const defaultDirectory = useStore<string | null>(AHP_DEFAULT_DIRECTORY);
  const sessions = useStore<SessionSummary[]>(AHP_SESSIONS);
  const reveal = useStore<string | null>(REVEAL_FOLDER);
  const added = useStore<string[]>(ADDED_FOLDERS);
  const stale = useStore<StaleFolders | null>(STALE_FOLDERS);
  const [revealed, setRevealed] = useState<string[]>([]);
  const roots = useMemo(() => rootsOf(defaultDirectory, sessions ?? [], revealed, added ?? []), [defaultDirectory, sessions, revealed, added]);
  const [branches, setBranches] = useState<ReadonlyMap<string, Branch>>(new Map());
  // In the store, so the tree opens as it was left when the explorer is drawn again.
  const held = useStore<string[] | null>(EXPANDED_FOLDERS);
  const expanded = useMemo(() => new Set(held ?? []), [held]);
  const [selected, setSelected] = useState<string | null>(null);
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);

  /** Read a folder; `quiet` keeps what it shows until the answer comes. */
  const load = useCallback((uri: string, quiet = false): void => {
    if (!quiet) setBranches((held) => new Map(held).set(uri, 'loading'));
    request('resourceList', { channel: ROOT, uri } as never)
      .then((found) => setBranches((held) => new Map(held).set(uri, orderEntries((found as { entries: DirectoryEntry[] }).entries))))
      .catch(() => setBranches((held) => new Map(held).set(uri, 'failed')));
  }, []);

  const expand = useCallback((next: Set<string>): void => {
    for (const uri of next) if (!expanded.has(uri) && !branches.has(uri)) load(uri);
    const list = [...next];
    scena.store.set(EXPANDED_FOLDERS, list);
    writeExpanded(list);
  }, [expanded, branches, load]);

  // The folders left open are read again when the tree is drawn.
  useEffect(() => {
    for (const uri of expanded) load(uri);
  }, []);

  // The host's own folder opens by itself, once it is known, until a folder was opened or closed here.
  const first = roots[0]?.uri;
  useEffect(() => {
    if (first !== undefined && (held ?? null) === null) expand(new Set([first]));
  }, [first]);

  // A folder a link named: its root and every folder down to it open, and it is selected.
  const scrollTo = useRef<string | null>(null);
  useEffect(() => {
    if (reveal === null || reveal === undefined) return;
    scena.store.set(REVEAL_FOLDER, null);
    const chain = chainTo(roots.map((root) => root.uri), reveal);
    const [root] = chain;
    if (root !== undefined && !roots.some((one) => one.uri === root)) setRevealed((held) => [...held, root]);
    expand(new Set([...expanded, ...chain]));
    const last = chain[chain.length - 1] ?? null;
    setSelected(last);
    scrollTo.current = last;
  }, [reveal]);

  // The selected folder scrolls into view once its row is drawn, which waits on its parents' listings.
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const key = scrollTo.current;
    if (key === null) return;
    const row = Array.from(box.current?.querySelectorAll<HTMLElement>('[data-key]') ?? []).find((one) => one.dataset.key === key);
    if (row === undefined) return;
    row.scrollIntoView({ block: 'center' });
    scrollTo.current = null;
  }, [branches, selected]);

  // A folder a menu changed is read again, when it has been read at all.
  useEffect(() => {
    for (const uri of stale?.uris ?? []) if (branches.has(uri)) load(uri, true);
  }, [stale]);

  const reload = (): void => {
    setBranches(new Map());
    for (const uri of expanded) load(uri);
  };

  /** The folder a person names, added as a root and opened. */
  const add = async (): Promise<void> => {
    const uri = await addFolder(scena);
    if (uri !== null && !branches.has(uri)) expand(new Set([...expanded, uri]));
  };

  /** What the space under the rows offers, and a row that is no file or folder. */
  const panelItems: PickerAction[] = [
    { title: 'Reload', icon: EMOJIcon.reload, onSelect: (host) => { host.closeMenu(); reload(); } },
    { title: 'Add folder', icon: EMOJIcon.folder, onSelect: (host) => { host.closeMenu(); void add(); } },
  ];

  /** Open a file, in `viewer` or its default one. */
  const open = (uri: string, viewer?: string): void => {
    void scena.commands.execute('ahp.openFile', { uri, ...(viewer === undefined ? {} : { viewer }) });
    hideOverlaidSidebar(scena, scena.store.get<ModusClass>(MODUS_CLASS) ?? 'large');
  };

  /** Open and one Open with per viewer, ahead of a file row's commands. */
  const openItems = (uri: string): PickerAction[] => {
    const viewers = viewersOf(scena, uri);
    return [
      { title: 'Open', icon: EMOJIcon.open, onSelect: (host) => { host.closeMenu(); open(uri); } },
      ...(viewers.length < 2 ? [] : viewers.map((viewer): PickerAction => ({
        title: `Open with ${viewerTitle(viewer)}`,
        ...(viewer.opens?.icon === undefined ? {} : { icon: viewer.opens.icon }),
        onSelect: (host) => { host.closeMenu(); open(uri, viewer.component); },
      }))),
    ];
  };

  /** Set while a right-click is on its way, since the tree selects a row before it opens its menu and that select is not a click. */
  const byMenu = useRef(false);

  const openPanelMenu = (event: MouseEvent<HTMLDivElement>): void => {
    byMenu.current = false;
    event.preventDefault();
    setMenu({ x: event.clientX, y: event.clientY });
  };

  const nodes = useMemo<TreeNode<DraggedHostFile>[]>(() => {
    const folder = (uri: string, label: ReactElement | string, trailing?: string): TreeNode<DraggedHostFile> => {
      const branch = branches.get(uri);
      const children: TreeNode<DraggedHostFile>[] = branch === undefined
        ? []
        : branch === 'loading'
          ? [{ key: `${uri}#loading`, label: 'Loading' }]
          : branch === 'failed'
            ? [{ key: `${uri}#failed`, label: 'Not readable' }]
            : branch.map((entry) => {
              const child = childUri(uri, entry.name);
              return entry.type === 'directory'
                ? folder(child, entry.name)
                : { key: child, label: entry.name, icon: iconOf(child), draggable: true, data: { uri: child, directory: false } };
            });
      return {
        key: uri,
        label,
        icon: EMOJIcon.folder,
        draggable: true,
        data: { uri, directory: true },
        children,
        ...(trailing === undefined ? {} : { trailing: <span className="web-folders__tag">{trailing}</span> }),
      };
    };
    return roots.map((root) => folder(root.uri, nameOf(root.uri), root.isDefault ? 'default' : undefined));
  }, [roots, branches]);

  if (connection?.status !== 'connected' && roots.length === 0) {
    return connection?.status === 'failed'
      ? <Alert tone="danger" title="Not connected" message={connection.error ?? 'The server refused the connection.'} />
      : <Spinner label="Connecting to the server" />;
  }

  return (
    <div className="web-explorer">
      <div className="web-explorer__title">
        <span>Explorer</span>
        <span className="web-explorer__actions">
          <button type="button" className="web-explorer__action" title="Refresh" aria-label="Refresh" onClick={reload}>
            <span className="web-explorer__icon">{EMOJIcon.reload}</span>
          </button>
        </span>
      </div>
      <div className="web-explorer__scroll" ref={box} onContextMenuCapture={() => { byMenu.current = true; }} onContextMenu={openPanelMenu}>
        {roots.length === 0 ? <p className="web-note web-explorer__empty">The server names no folder yet. Start a session in one.</p> : null}
        <Tree<DraggedHostFile>
          nodes={nodes}
          selectedKey={selected}
          expanded={expanded}
          onExpandedChange={expand}
          contextMenuSlot={ENTRY_SLOT}
          contextFor={(node) => ({
            [MENU_ENTRY]: node.data === undefined
              ? null
              : {
                uri: node.data.uri,
                directory: node.data.directory,
                added: roots.some((root) => root.uri === node.key && root.added),
                root: roots.some((root) => root.uri === node.key),
              } satisfies MenuEntry,
          })}
          contextExtraItems={(node) => (node.data === undefined ? panelItems : node.data.directory ? [] : openItems(node.data.uri))}
          onSelect={(node) => {
            if (byMenu.current) {
              byMenu.current = false;
              if (node.data !== undefined) setSelected(node.key);
              return;
            }
            if (node.data === undefined) return;
            setSelected(node.key);
            if (node.data.directory) {
              const next = new Set(expanded);
              if (!next.delete(node.key)) next.add(node.key);
              expand(next);
            } else {
              open(node.data.uri);
            }
          }}
          onDragStart={(event, node) => {
            if (node.data !== undefined) setHostFile(event.dataTransfer, node.data);
          }}
        />
      </div>
      {menu === null ? null : <ContextMenu spec={{ items: panelItems }} x={menu.x} y={menu.y} onClose={() => setMenu(null)} />}
    </div>
  );
}
