import { useCallback, useEffect, useMemo, useRef, useState, type ReactElement } from 'react';
import { useScena, useStore } from '@softov/scena/react';
import { Alert, Spinner, Tree, type TreeNode } from '@softov/scena/ui';
import type { DirectoryEntry, SessionSummary } from '@microsoft/agent-host-protocol';
import { AHP_CONNECTION, AHP_DEFAULT_DIRECTORY, AHP_SESSIONS, ROOT, request, type Connection } from '../connection/data.js';
import { folderLabel } from '../connection/words.js';
import { EMOJIcon } from '../emojis.js';
import { hideOverlaidSidebar } from '../sessions/index.js';
import type { BindingPath } from '@softov/scena/types';
import type { ModusClass } from '@softov/scena';
import { setHostFile, type DraggedHostFile } from './drag.js';
import { chainTo, childUri, orderEntries, rootsOf } from './roots.js';
import { REVEAL_FOLDER } from './index.js';

/** The display size class the modus backend publishes. */
const MODUS_CLASS = '$/modus/class' as BindingPath;

/** A folder's listing: asked for, refused, or what the host answered. */
type Branch = 'loading' | 'failed' | DirectoryEntry[];

/** A folder's last segment, with its whole path beside it on hover. */
function nameOf(uri: string): ReactElement {
  const path = folderLabel(uri);
  return <span title={path}>{path.replace(/\/+$/, '').split('/').pop() || path}</span>;
}

/** The sidebar: the host's folders as a tree, one level asked for at a time. Files open on click and drag into the composer; a folder a link names opens down to it. */
export default function FolderExplorer(): ReactElement {
  const scena = useScena();
  const connection = useStore<Connection>(AHP_CONNECTION);
  const defaultDirectory = useStore<string | null>(AHP_DEFAULT_DIRECTORY);
  const sessions = useStore<SessionSummary[]>(AHP_SESSIONS);
  const reveal = useStore<string | null>(REVEAL_FOLDER);
  const [revealed, setRevealed] = useState<string[]>([]);
  const roots = useMemo(() => rootsOf(defaultDirectory, sessions ?? [], revealed), [defaultDirectory, sessions, revealed]);
  const [branches, setBranches] = useState<ReadonlyMap<string, Branch>>(new Map());
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<string | null>(null);

  const load = useCallback((uri: string): void => {
    setBranches((held) => new Map(held).set(uri, 'loading'));
    request('resourceList', { channel: ROOT, uri } as never)
      .then((found) => setBranches((held) => new Map(held).set(uri, orderEntries((found as { entries: DirectoryEntry[] }).entries))))
      .catch(() => setBranches((held) => new Map(held).set(uri, 'failed')));
  }, []);

  const expand = useCallback((next: Set<string>): void => {
    for (const uri of next) if (!expanded.has(uri) && !branches.has(uri)) load(uri);
    setExpanded(next);
  }, [expanded, branches, load]);

  // The host's own folder opens by itself, once it is known.
  const first = roots[0]?.uri;
  useEffect(() => {
    if (first !== undefined && !branches.has(first)) expand(new Set([...expanded, first]));
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

  const reload = (): void => {
    setBranches(new Map());
    for (const uri of expanded) load(uri);
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
                : { key: child, label: entry.name, icon: EMOJIcon.file, draggable: true, data: { uri: child, directory: false } };
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
      <div className="web-explorer__scroll" ref={box}>
        {roots.length === 0 ? <p className="web-note web-explorer__empty">The server names no folder yet. Start a session in one.</p> : null}
        <Tree<DraggedHostFile>
          nodes={nodes}
          selectedKey={selected}
          expanded={expanded}
          onExpandedChange={expand}
          onSelect={(node) => {
            if (node.data === undefined) return;
            setSelected(node.key);
            if (node.data.directory) {
              const next = new Set(expanded);
              if (!next.delete(node.key)) next.add(node.key);
              expand(next);
            } else {
              void scena.commands.execute('ahp.openFile', { uri: node.data.uri });
              hideOverlaidSidebar(scena, scena.store.get<ModusClass>(MODUS_CLASS) ?? 'large');
            }
          }}
          onDragStart={(event, node) => {
            if (node.data !== undefined) setHostFile(event.dataTransfer, node.data);
          }}
        />
      </div>
    </div>
  );
}
