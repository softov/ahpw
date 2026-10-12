import { useEffect, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactElement } from 'react';
import { createPortal } from 'react-dom';
import { useStore } from '@softov/scena/react';
import type { SessionSummary } from '@microsoft/agent-host-protocol';
import { AHP_DEFAULT_DIRECTORY, AHP_SESSIONS } from '../connection/data.js';
import { folderLabel } from '../connection/words.js';
import { EMOJIcon } from '../emojis.js';
import { ADDED_FOLDERS } from '../folders/added.js';
import { childFolders, parentPath } from '../folders/folder-path.js';
import { usedFolders } from '../folders/used.js';

/** A line of the menu: a folder to pick, or the way up. */
interface Line {
  kind: 'up' | 'here' | 'host' | 'used';
  path: string;
  label: string;
  /** How many of the host's sessions work in it, for a used folder. */
  sessions?: number;
  /** The heading the line starts, when it starts a group. */
  heading?: string;
}

/** A folder path ending in one slash, as a listing is asked for. */
const asDir = (path: string): string => `${path.replace(/[\\/]+$/, '')}/`;
/** A folder path with no slash at its end, but a root keeps its own. */
const asFolder = (path: string): string => (/^([A-Za-z]:)?\/$/.test(path) ? path : path.replace(/[\\/]+$/, ''));

/**
 * The session's folder: a text box that fits its path, and a menu, opened
 * upward from the folder mark, to pick one without typing. The menu lists the
 * folder's own parent with it selected among its siblings, then the host's
 * folder, then the folders the host's sessions and the workspace use.
 */
export function FolderPill({ value, onChange }: { value: string; onChange: (next: string) => void }): ReactElement {
  const [open, setOpen] = useState(false);
  const pill = useRef<HTMLSpanElement>(null);
  const input = useRef<HTMLInputElement>(null);

  return (
    <span ref={pill} className="web-chip web-chip--text web-folder-pill" title="A folder on the server's machine">
      <button
        type="button"
        className="web-folder-pill__mark"
        aria-label="Choose a folder"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((was) => !was)}
      >
        {EMOJIcon.folder}
      </button>
      <input ref={input} aria-label="Folder" value={value} placeholder="/path/to/project" spellCheck={false} onChange={(event) => onChange(event.currentTarget.value)} />
      {open && pill.current !== null ? (
        <FolderMenu
          anchor={pill.current}
          current={value}
          onPick={(path) => {
            onChange(path);
            setOpen(false);
            input.current?.focus();
          }}
          onClose={() => {
            setOpen(false);
            input.current?.focus();
          }}
        />
      ) : null}
    </span>
  );
}

function FolderMenu({ anchor, current, onPick, onClose }: { anchor: HTMLElement; current: string; onPick: (path: string) => void; onClose: () => void }): ReactElement {
  const sessions = useStore<SessionSummary[]>(AHP_SESSIONS);
  const added = useStore<string[]>(ADDED_FOLDERS);
  const defaultDirectory = useStore<string | null>(AHP_DEFAULT_DIRECTORY);
  const here = asFolder(current.trim());
  // The folder listed: the parent of the session's folder, so it shows among its siblings.
  const [view, setView] = useState<string | null>(() => (here === '' ? null : parentPath(asDir(here)) ?? asDir(here)));
  const [names, setNames] = useState<string[] | 'loading' | 'failed'>('loading');
  const [picked, setPicked] = useState(0);
  const [place, setPlace] = useState<{ left: number; bottom: number; maxHeight: number } | null>(null);
  const menu = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (view === null) return;
    let alive = true;
    setNames('loading');
    childFolders(view)
      .then((found) => { if (alive) setNames(found); })
      .catch(() => { if (alive) setNames('failed'); });
    return () => { alive = false; };
  }, [view]);

  const hostPath = defaultDirectory === null || defaultDirectory === undefined ? null : folderLabel(defaultDirectory).replace(/\/+$/, '');
  const used = useMemo(() => usedFolders(sessions ?? [], added ?? [], defaultDirectory), [sessions, added, defaultDirectory]);

  const lines = useMemo(() => {
    const out: Line[] = [];
    if (view !== null) {
      const up = parentPath(view);
      if (up !== null) out.push({ kind: 'up', path: asFolder(up), label: asFolder(up) });
      if (Array.isArray(names)) for (const name of names) out.push({ kind: 'here', path: `${view}${name}`, label: name });
    }
    if (hostPath !== null) out.push({ kind: 'host', path: hostPath, label: hostPath, heading: 'Host folder' });
    used.forEach((one, at) => out.push({ kind: 'used', path: one.path, label: one.path, sessions: one.sessions, ...(at === 0 ? { heading: 'Used' } : {}) }));
    return out;
  }, [view, names, hostPath, used]);

  // Start on the session's folder among its siblings, or on the first line.
  useEffect(() => {
    const at = lines.findIndex((line) => line.kind === 'here' && line.path === here);
    setPicked(at === -1 ? 0 : at);
  }, [lines, here]);

  useEffect(() => {
    menu.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' });
  }, [picked]);

  // Above the pill, in the page's own coordinates: a portal, so a scaled card
  // or a clipping pane does not move or cut it.
  useLayoutEffect(() => {
    const measure = (): void => {
      const box = anchor.getBoundingClientRect();
      setPlace({ left: box.left, bottom: window.innerHeight - box.top + 4, maxHeight: Math.max(120, Math.min(360, box.top - 12)) });
    };
    measure();
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    return () => {
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
  }, [anchor]);

  // Once placed: a hidden menu cannot take the focus.
  const placed = place !== null;
  useEffect(() => {
    if (placed) menu.current?.focus();
  }, [placed]);

  useEffect(() => {
    const away = (event: MouseEvent): void => {
      const target = event.target as Node;
      if (!menu.current?.contains(target) && !anchor.contains(target)) onClose();
    };
    document.addEventListener('mousedown', away);
    return () => document.removeEventListener('mousedown', away);
  }, [anchor, onClose]);

  const walk = (line: Line): void => setView(asDir(line.path));
  const take = (line: Line): void => (line.kind === 'up' ? walk(line) : onPick(line.path));

  const keys = (event: KeyboardEvent<HTMLDivElement>): void => {
    const line = lines[picked];
    if (event.key === 'Escape') onClose();
    else if (event.key === 'ArrowDown') setPicked((at) => Math.min(lines.length - 1, at + 1));
    else if (event.key === 'ArrowUp') setPicked((at) => Math.max(0, at - 1));
    else if (event.key === 'ArrowRight' && line !== undefined && line.kind !== 'up') walk(line);
    else if (event.key === 'ArrowLeft' && view !== null && parentPath(view) !== null) setView(parentPath(view));
    else if (event.key === 'Enter' && line !== undefined) take(line);
    else return;
    // Used here: a layout that closes on Esc leaves it to the menu.
    event.preventDefault();
    event.stopPropagation();
  };

  return createPortal(
    <div
      ref={menu}
      className="web-folder-menu"
      role="listbox"
      aria-label="Folders"
      tabIndex={-1}
      style={place === null ? { visibility: 'hidden' } : { left: place.left, bottom: place.bottom, maxHeight: place.maxHeight }}
      onKeyDown={keys}
    >
      {view !== null && names === 'loading' ? <div className="web-folder-menu__note">Reading {asFolder(view)}</div> : null}
      {view !== null && names === 'failed' ? <div className="web-folder-menu__note">The host cannot list {asFolder(view)}</div> : null}
      <div className="web-folder-menu__list">{lines.map((line, at) => (line.kind === 'up' || line.kind === 'here' ? row(line, at) : null))}</div>
      {lines.map((line, at) => (line.kind === 'host' || line.kind === 'used' ? row(line, at) : null))}
    </div>,
    document.body,
  );

  /** One line, with its heading when it starts a group. */
  function row(line: Line, at: number): ReactElement {
    return (
        <div key={`${line.kind}:${line.path}`}>
          {line.heading === undefined ? null : <div className="web-folder-menu__heading">{line.heading}</div>}
          <div
            role="option"
            className="web-folder-menu__line"
            data-kind={line.kind}
            data-current={line.path === here ? 'true' : undefined}
            aria-selected={at === picked}
            title={line.kind === 'here' ? line.path : undefined}
            onMouseEnter={() => setPicked(at)}
            onClick={() => take(line)}
          >
            <span className="web-folder-menu__mark" aria-hidden="true">{line.kind === 'up' ? '↑' : EMOJIcon.folder}</span>
            <span className="web-folder-menu__label">{line.label}</span>
            {line.sessions === undefined || line.sessions === 0 ? null : <span className="web-folder-menu__count" title={`${line.sessions} sessions`}>{line.sessions}</span>}
            {line.kind === 'up' ? null : (
              <button
                type="button"
                className="web-folder-menu__walk"
                aria-label={`Open ${line.label}`}
                tabIndex={-1}
                onClick={(event) => {
                  event.stopPropagation();
                  walk(line);
                }}
              >
                {EMOJIcon.caretRight}
              </button>
            )}
          </div>
        </div>
    );
  }
}
