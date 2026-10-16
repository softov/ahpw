import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type ReactElement } from 'react';
import type { HostCtx, ListSpec, PickerAction, Scena } from '@softov/scena/types';
import { useI18n, useScena } from '@softov/scena/react';
import { ActionList, type ActionListController } from '@softov/scena/ui/menu';
import { ahpPaths } from '../bridges/data.js';
import { useEach, useEveryHost } from '../bridges/hosts.js';
import { terminalItems } from '../resources/terminals/rows.js';

/** The slot a command joins to be listed in the palette. */
export const PALETTE_SLOT = 'ahp:palette';

/** The overlay mount the palette lives in while it is open. */
export const PALETTE_KEY = 'command-palette';

/** The list the next palette opens on, when a command asks for one; the command list otherwise. */
let opening: ListSpec | null = null;

/** The open palette's way to start over on another list; null while it is closed. */
let restart: ((list: ListSpec | null) => void) | null = null;

/** The palette's first frame: `list`, or the commands. */
function firstFrame(list: ListSpec | null): ListSpec {
  return list === null ? { query: { slot: PALETTE_SLOT }, footerHints: true } : { ...list, footerHints: true };
}

/**
 * Opens the palette, on `list` when given (a title bar button opening the
 * layout menu). An open palette starts over on it: closed and opened in one
 * go, the overlay keeps the same component, and with it the old list.
 */
export function openPalette(scena: Scena, list?: ListSpec): void {
  if (restart !== null) {
    restart(list ?? null);
    return;
  }
  opening = list ?? null;
  scena.surfaces.open({ surface: 'overlay', key: PALETTE_KEY, resource: { component: 'CommandPalette' } });
}

/** Lower case without accents, so "portugues" finds "Português". */
function folded(text: string): string {
  return text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
}

/** A sub-list's rows that match what is typed; ActionList filters only slot queries itself. */
function matching(items: PickerAction[], search: string): PickerAction[] {
  const typed = folded(search.trim());
  if (typed === '') return items;
  return items.filter((item) => 'title' in item && folded(`${item.title} ${item.description ?? ''}`).includes(typed));
}

// Ported from web-next's shell/CommandPalette.tsx: the ActionList picker engine
// over the palette slot, with a stack so a command can open a sub-list
// (languages, layouts). ahpw adds the host's terminals to the command list.
export default function CommandPalette(): ReactElement {
  const scena = useScena();
  const { t } = useI18n();
  const [search, setSearch] = useState('');
  const [stack, setStack] = useState<ListSpec[]>(() => {
    const first = opening;
    opening = null;
    return [firstFrame(first)];
  });
  useEffect(() => {
    restart = (list) => {
      setStack([firstFrame(list)]);
      setSearch('');
    };
    return () => {
      restart = null;
    };
  }, []);
  const ref = useRef<ActionListController>(null);
  const close = useCallback(() => scena.surfaces.close(PALETTE_KEY), [scena]);

  const host = useMemo<HostCtx>(
    () => ({
      pushList: (s) => { setStack((c) => [...c, s]); setSearch(''); },
      replaceList: (s) => setStack((c) => [...c.slice(0, -1), s]),
      openInline: () => undefined,
      openPopover: () => undefined,
      back: () => { setStack((c) => (c.length > 1 ? c.slice(0, -1) : c)); setSearch(''); },
      closeMenu: close,
      keepOpen: () => undefined,
      insertAtCursor: () => undefined,
      replaceActiveToken: () => undefined,
      query: '',
    }),
    [close],
  );

  // Every host's facts, so the terminals among the commands follow each host's list.
  const facts = useEach<unknown>(useEveryHost().map((host) => ahpPaths(host).host));
  const depth = stack.length;
  const top = stack[depth - 1]!;
  // The command list, with the terminals; a list opened on its own (a language, a theme) is only that list.
  const commands = top.query?.slot === PALETTE_SLOT;
  const spec = useMemo<ListSpec>(() => {
    const searched: ListSpec = top.query
      ? { ...top, query: { ...top.query, q: search } }
      : top.items !== undefined ? { ...top, items: matching(top.items, search) } : top;
    return commands ? { ...searched, extraItems: terminalItems(scena, search) } : searched;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scena, top, commands, search, facts]);

  function onKeyDown(e: ReactKeyboardEvent<HTMLInputElement>): void {
    if (e.key === 'Escape') {
      e.preventDefault();
      if (depth > 1) host.back();
      else close();
      return;
    }
    // Arrow/Enter/Tab go to the list; everything else is typing.
    ref.current?.handleKey(e);
  }

  return (
    <div className="web-palette" onMouseDown={(e) => { if (e.target === e.currentTarget) close(); }}>
      <div className="web-palette__box" role="dialog" aria-modal="true" aria-label={t('shell/commands/palette')}>
        <input
          className="web-field web-palette__input"
          autoFocus
          value={search}
          placeholder={commands ? t('shell/palette/placeholder') : top.title ?? t('shell/palette/placeholder')}
          aria-label={t('shell/commands/palette')}
          onChange={(e) => setSearch(e.currentTarget.value)}
          onKeyDown={onKeyDown}
        />
        <ActionList ref={ref} spec={spec} hostCtx={host} {...(depth > 1 ? { onBack: host.back } : {})} manageKeys={false} />
      </div>
    </div>
  );
}
