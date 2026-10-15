import { useCallback, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type ReactElement } from 'react';
import type { HostCtx, ListSpec, PickerAction, Scena } from '@softov/scena/types';
import { useI18n, useScena, useStore } from '@softov/scena/react';
import { ActionList, type ActionListController } from '@softov/scena/ui/menu';
import { AHP_HOST } from '../bridges/data.js';
import { terminalItems } from '../resources/terminals/rows.js';

/** The slot a command joins to be listed in the palette. */
export const PALETTE_SLOT = 'ahp:palette';

/** The overlay mount the palette lives in while it is open. */
export const PALETTE_KEY = 'command-palette';

/** The list the next palette opens on, when a command asks for one; the command list otherwise. */
let opening: ListSpec | null = null;

/** Opens the palette, on `list` when given (a title bar button opening the layout menu). */
export function openPalette(scena: Scena, list?: ListSpec): void {
  opening = list ?? null;
  scena.surfaces.close(PALETTE_KEY);
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
// (languages, layouts). ahpw adds the host's terminals to the first list.
export default function CommandPalette(): ReactElement {
  const scena = useScena();
  const { t } = useI18n();
  const [search, setSearch] = useState('');
  const [stack, setStack] = useState<ListSpec[]>(() => {
    const first = opening;
    opening = null;
    return first === null ? [{ query: { slot: PALETTE_SLOT }, footerHints: true }] : [{ ...first, footerHints: true }];
  });
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

  const facts = useStore<unknown>(AHP_HOST);
  const depth = stack.length;
  const top = stack[depth - 1]!;
  const spec = useMemo<ListSpec>(() => {
    const searched: ListSpec = top.query
      ? { ...top, query: { ...top.query, q: search } }
      : top.items !== undefined ? { ...top, items: matching(top.items, search) } : top;
    return depth === 1 ? { ...searched, extraItems: terminalItems(scena, search) } : searched;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scena, top, depth, search, facts]);

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
          placeholder={t('shell/palette/placeholder')}
          aria-label={t('shell/commands/palette')}
          onChange={(e) => setSearch(e.currentTarget.value)}
          onKeyDown={onKeyDown}
        />
        <ActionList ref={ref} spec={spec} hostCtx={host} {...(depth > 1 ? { onBack: host.back } : {})} manageKeys={false} />
      </div>
    </div>
  );
}
