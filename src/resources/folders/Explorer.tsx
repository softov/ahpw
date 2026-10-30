import { useCallback, useEffect, useMemo, useRef, useState, type MouseEvent, type ReactElement } from 'react';
import { useI18n, useScena, useStore } from '@softov/scena/react';
import { Alert, ContextMenu, Spinner, Tree, type TreeNode } from '@softov/scena/ui';
import type { DirectoryEntry, SessionSummary } from '@microsoft/agent-host-protocol';
import { ahpPaths, hostBridge, ROOT, type Connection } from '../../bridges/data.js';
import { useHostNames, useShownHosts } from '../../bridges/hosts.js';
import { folderLabel } from '../../bridges/words.js';
import { embedMode } from '../../shell/embed/index.js';
import { HostLines } from '../../shell/explorer/HostLines.js';
import { EMOJIcon } from '../emojis.js';
import { iconOf } from '../files/icons.js';
import { viewerTitle, viewersOf } from '../files/viewers.js';
import { hideOverlaidSidebar } from '../sessions/index.js';
import type { BindingPath, PickerAction } from '@softov/scena/types';
import type { ModusClass } from '@softov/scena';
import { setHostFile, type DraggedHostFile } from './drag.js';
import { bare, chainTo, childUri, orderEntries, rootsOf, type Root } from './roots.js';
import { RELOAD_FOLDERS, REVEAL_FOLDER, type RevealFolderArgs } from './index.js';
import { addedPath } from './added.js';
import { HOST_NODE, expandedPath, setExpanded } from './expanded.js';
import { STALE_FOLDERS, addFolder, type StaleFolders } from './actions.js';
import { ENTRY_SLOT, MENU_ENTRY, type MenuEntry } from './menu.js';

/** The display size class the modus backend publishes. */
const MODUS_CLASS = '$/modus/class' as BindingPath;

/** A folder's listing: asked for, refused, or what the host answered. */
type Branch = 'loading' | 'failed' | DirectoryEntry[];

/** The row selected in the explorer, on its host. */
interface Selected {
  host: string;
  key: string;
}

/** A folder's last segment, with its whole path beside it on hover. */
function nameOf(uri: string): ReactElement {
  const path = folderLabel(uri);
  return <span title={path}>{path.replace(/\/+$/, '').split('/').pop() || path}</span>;
}

/** Bump the reload count, so every host's tree reads its open folders again. */
const bumpReload = (scena: ReturnType<typeof useScena>): void => scena.store.set(RELOAD_FOLDERS, (scena.store.get<number>(RELOAD_FOLDERS) ?? 0) + 1);

/**
 * The sidebar: the host's folders as a tree, one level asked for at a time.
 * With every host, a branch per shown host, named for it, with its folders
 * under it. Files open on click and drag into the composer; a folder a link
 * names opens down to it; rows and the space under them have menus.
 */
export default function FolderExplorer(): ReactElement {
  const scena = useScena();
  const { t } = useI18n();
  const multi = embedMode() === 'multi';
  const hosts = useShownHosts();
  const hostName = useHostNames();
  const [selected, setSelected] = useState<Selected | null>(null);
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);

  // The space under the rows: reload, and add a folder, on each host with every host.
  const panelItems: PickerAction[] = [
    { title: t('common/reload'), icon: EMOJIcon.reload, onSelect: (box) => { box.closeMenu(); bumpReload(scena); } },
    ...hosts.map((host): PickerAction => ({
      title: multi ? t('folders/addFolderOn', { host: hostName(host) }) : t('folders/addFolder'),
      icon: EMOJIcon.folder,
      onSelect: (box) => { box.closeMenu(); void addAndOpen(scena, host); },
    })),
  ];

  const openPanelMenu = (event: MouseEvent<HTMLDivElement>): void => {
    event.preventDefault();
    setMenu({ x: event.clientX, y: event.clientY });
  };

  return (
    <div className="web-explorer">
      <div className="web-explorer__scroll" onContextMenu={openPanelMenu}>
        {multi ? <HostLines /> : null}
        {hosts.map((host) => (
          <HostFolders
            key={host}
            host={host}
            named={multi ? hostName(host) : null}
            selected={selected?.host === host ? selected.key : null}
            onSelected={(key) => setSelected(key === null ? null : { host, key })}
          />
        ))}
      </div>
      {menu === null ? null : <ContextMenu spec={{ items: panelItems }} x={menu.x} y={menu.y} onClose={() => setMenu(null)} />}
    </div>
  );
}

/** The folder a person names on `host`, added as a root and opened. */
async function addAndOpen(scena: ReturnType<typeof useScena>, host: string): Promise<void> {
  const uri = await addFolder(scena, host);
  if (uri === null) return;
  const open = scena.store.get<string[] | null>(expandedPath(host)) ?? [];
  setExpanded(scena.store, host, [...new Set([...open, HOST_NODE, uri])]);
}

/**
 * One host's tree. With every host, `named` is the host's name, and its roots
 * sit under a branch with that name; in mono they are the tree's top.
 * With `rooted`, the tree shows only those folders, open at the start; its
 * open folders last as long as it is drawn, and a folder a link names does not
 * open in it.
 */
export function HostFolders({ host, named, selected, onSelected, rooted }: {
  host: string;
  named: string | null;
  selected: string | null;
  onSelected: (key: string | null) => void;
  rooted?: readonly string[];
}): ReactElement | null {
  const scena = useScena();
  const { t } = useI18n();
  const connection = useStore<Connection>(ahpPaths(host).connection);
  const defaultDirectory = useStore<string | null>(ahpPaths(host).defaultDirectory);
  const sessions = useStore<SessionSummary[]>(ahpPaths(host).sessions);
  const reveal = useStore<RevealFolderArgs | null>(REVEAL_FOLDER);
  const added = useStore<string[]>(addedPath(host));
  const stale = useStore<StaleFolders | null>(STALE_FOLDERS);
  const [revealed, setRevealed] = useState<string[]>([]);
  const roots = useMemo((): Root[] => (rooted === undefined
    ? rootsOf(defaultDirectory, sessions ?? [], revealed, added ?? [])
    : rooted.map((uri) => ({ uri: bare(uri), isDefault: false, added: false }))), [rooted, defaultDirectory, sessions, revealed, added]);
  const [branches, setBranches] = useState<ReadonlyMap<string, Branch>>(new Map());
  // In the store, so the tree opens as it was left when the explorer is drawn again.
  const kept = useStore<string[] | null>(expandedPath(host));
  const [own, setOwn] = useState<string[]>(() => rooted?.map(bare) ?? []);
  const held = rooted === undefined ? kept : own;
  const expanded = useMemo(() => new Set(held ?? []), [held]);

  /** Read a folder; `quiet` keeps what it shows until the answer comes. */
  const load = useCallback((uri: string, quiet = false): void => {
    if (!quiet) setBranches((now) => new Map(now).set(uri, 'loading'));
    hostBridge(host).request('resourceList', { channel: ROOT, uri } as never)
      .then((found) => setBranches((now) => new Map(now).set(uri, orderEntries((found as { entries: DirectoryEntry[] }).entries))))
      .catch(() => setBranches((now) => new Map(now).set(uri, 'failed')));
  }, [host]);

  // Each open folder is read once it is open, the ones left open when the tree is drawn again among them.
  useEffect(() => {
    for (const uri of expanded) if (uri !== HOST_NODE && !branches.has(uri)) load(uri);
  }, [expanded]);

  const fixed = rooted !== undefined;
  const expand = useCallback((next: Set<string>): void => (fixed ? setOwn([...next]) : setExpanded(scena.store, host, [...next])), [scena, host, fixed]);

  // The host's own folder opens by itself, once it is known, until a folder was opened or closed here.
  const first = roots[0]?.uri;
  useEffect(() => {
    if (first !== undefined && (held ?? null) === null) expand(new Set([HOST_NODE, first]));
  }, [first]);

  // A folder a link named on this host: its root and every folder down to it open, and it is selected.
  const scrollTo = useRef<string | null>(null);
  useEffect(() => {
    if (fixed || reveal === null || reveal === undefined || reveal.host !== host) return;
    scena.store.set(REVEAL_FOLDER, null);
    const chain = chainTo(roots.map((root) => root.uri), reveal.uri);
    const [root] = chain;
    if (root !== undefined && !roots.some((one) => one.uri === root)) setRevealed((now) => [...now, root]);
    expand(new Set([...expanded, HOST_NODE, ...chain]));
    const last = chain[chain.length - 1] ?? null;
    onSelected(last);
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

  // A folder a menu changed on this host is read again, when it has been read at all.
  useEffect(() => {
    if (stale?.host !== host) return;
    for (const uri of stale.uris) if (branches.has(uri)) load(uri, true);
  }, [stale]);

  // The header's Refresh: every open folder is read again.
  const reloads = useStore<number>(RELOAD_FOLDERS);
  useEffect(() => {
    if (reloads === undefined) return;
    setBranches(new Map());
    for (const uri of expanded) if (uri !== HOST_NODE) load(uri);
  }, [reloads]);

  /** What a row that is no file or folder offers: this host's reload and Add folder. */
  const hostItems: PickerAction[] = [
    { title: t('common/reload'), icon: EMOJIcon.reload, onSelect: (menu) => { menu.closeMenu(); bumpReload(scena); } },
    { title: t('folders/addFolder'), icon: EMOJIcon.folder, onSelect: (menu) => { menu.closeMenu(); void addAndOpen(scena, host); } },
  ];

  /** Open a file, in `viewer` or its default one. */
  const open = (uri: string, viewer?: string): void => {
    void scena.commands.execute('ahp.openFile', { host, uri, ...(viewer === undefined ? {} : { viewer }) });
    hideOverlaidSidebar(scena, scena.store.get<ModusClass>(MODUS_CLASS) ?? 'large');
  };

  /** Open and one Open with per viewer, ahead of a file row's commands. */
  const openItems = (uri: string): PickerAction[] => {
    const viewers = viewersOf(scena, uri);
    return [
      { title: t('folders/explorer/open'), icon: EMOJIcon.open, onSelect: (menu) => { menu.closeMenu(); open(uri); } },
      ...(viewers.length < 2 ? [] : viewers.map((viewer): PickerAction => ({
        title: t('folders/explorer/openWith', { viewer: viewerTitle(viewer) }),
        ...(viewer.opens?.icon === undefined ? {} : { icon: viewer.opens.icon }),
        onSelect: (menu) => { menu.closeMenu(); open(uri, viewer.component); },
      }))),
    ];
  };

  /** Set while a right-click is on its way, since the tree selects a row before it opens its menu and that select is not a click. */
  const byMenu = useRef(false);

  const nodes = useMemo<TreeNode<DraggedHostFile>[]>(() => {
    const folder = (uri: string, label: ReactElement | string, trailing?: string): TreeNode<DraggedHostFile> => {
      const branch = branches.get(uri);
      const children: TreeNode<DraggedHostFile>[] = branch === undefined
        ? []
        : branch === 'loading'
          ? [{ key: `${uri}#loading`, label: t('folders/explorer/loading') }]
          : branch === 'failed'
            ? [{ key: `${uri}#failed`, label: t('folders/explorer/notReadable') }]
            : branch.map((entry) => {
              const child = childUri(uri, entry.name);
              return entry.type === 'directory'
                ? folder(child, entry.name)
                : { key: child, label: entry.name, icon: iconOf(child), draggable: true, data: { host, uri: child, directory: false } };
            });
      return {
        key: uri,
        label,
        icon: EMOJIcon.folder,
        draggable: true,
        data: { host, uri, directory: true },
        children,
        ...(trailing === undefined ? {} : { trailing: <span className="web-folders__tag">{trailing}</span> }),
      };
    };
    const top = roots.map((root) => folder(root.uri, nameOf(root.uri), root.isDefault ? t('folders/explorer/default') : undefined));
    if (named === null) return top;
    // With every host, the host's branch; one connected with no folder says so under it.
    const empty = connection?.status === 'connected' && top.length === 0 ? [{ key: `${HOST_NODE}#empty`, label: t('folders/explorer/empty') }] : [];
    const under = [...top, ...empty];
    // A host with nothing to show yet has no chevron.
    return [{ key: HOST_NODE, label: named, icon: EMOJIcon.host, ...(under.length === 0 ? {} : { children: under }) }];
  }, [roots, branches, named, connection?.status, host, t]);

  if (named === null && connection?.status !== 'connected' && roots.length === 0) {
    return connection?.status === 'failed'
      ? <Alert tone="danger" title={t('folders/explorer/notConnected')} message={connection.error ?? t('folders/explorer/refused')} />
      : <Spinner label={t('folders/explorer/connecting')} />;
  }

  return (
    <div
      ref={box}
      onContextMenuCapture={() => { byMenu.current = true; }}
      // Reached only off the rows, whose menus stop here: no select is on its way.
      onContextMenu={() => { byMenu.current = false; }}
    >
      {named === null && roots.length === 0 ? <p className="web-note web-explorer__empty">{t('folders/explorer/empty')}</p> : null}
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
              host,
              uri: node.data.uri,
              directory: node.data.directory,
              added: roots.some((root) => root.uri === node.key && root.added),
              root: roots.some((root) => root.uri === node.key),
            } satisfies MenuEntry,
        })}
        contextExtraItems={(node) => (node.data === undefined ? hostItems : node.data.directory ? [] : openItems(node.data.uri))}
        onSelect={(node) => {
          if (byMenu.current) {
            byMenu.current = false;
            if (node.data !== undefined) onSelected(node.key);
            return;
          }
          if (node.key === HOST_NODE) {
            const next = new Set(expanded);
            if (!next.delete(HOST_NODE)) next.add(HOST_NODE);
            expand(next);
            return;
          }
          if (node.data === undefined) return;
          onSelected(node.key);
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
  );
}
