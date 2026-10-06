import { useMemo, useRef, useState, type ReactElement } from 'react';
import { createPortal } from 'react-dom';
import { useScena, useStore } from '@softov/scena/react';
import { ActionList } from '@softov/scena/ui';
import type { BindingPath, HostCtx } from '@softov/scena/types';

/** True while the palette is open. */
export const PALETTE_OPEN = '$/ahp/palette/open' as BindingPath;

/** The slot a command joins to be listed in the palette. */
export const PALETTE_SLOT = 'ahp:palette';

/** What the list answers to while the input keeps focus; scena does not export its type. */
interface ListKeys {
  handleKey(event: { key: string; preventDefault: () => void }): boolean;
}

/** The command palette: type to filter the commands in `PALETTE_SLOT`, Enter runs one. */
export default function Palette(): ReactElement | null {
  const open = useStore<boolean>(PALETTE_OPEN) === true;
  if (!open) return null;
  return createPortal(<PaletteBox />, document.body);
}

function PaletteBox(): ReactElement {
  const scena = useScena();
  const [query, setQuery] = useState('');
  const list = useRef<ListKeys>(null);
  const close = (): void => scena.store.set(PALETTE_OPEN, false);
  const host = useMemo<HostCtx>(() => ({
    pushList: () => undefined,
    replaceList: () => undefined,
    openInline: () => undefined,
    openPopover: () => undefined,
    back: () => undefined,
    closeMenu: close,
    keepOpen: () => undefined,
    insertAtCursor: () => undefined,
    replaceActiveToken: () => undefined,
    query: '',
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), []);
  const spec = useMemo(() => ({ query: { slot: PALETTE_SLOT, q: query } }), [query]);
  return (
    <div className="web-palette" onMouseDown={(event) => { if (event.target === event.currentTarget) close(); }}>
      <div
        className="web-palette__box"
        role="dialog"
        aria-label="Command palette"
        onClick={(event) => { if ((event.target as HTMLElement).closest('.oo-action-list__row') !== null) close(); }}
      >
        <input
          className="web-field web-palette__input"
          autoFocus
          value={query}
          placeholder="Type a command"
          aria-label="Command"
          onChange={(event) => setQuery(event.currentTarget.value)}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              event.preventDefault();
              close();
              return;
            }
            // A command run from the list does not close it; the palette does, once one ran.
            if (list.current?.handleKey(event) === true && event.key === 'Enter') close();
          }}
        />
        <ActionList spec={spec} hostCtx={host} manageKeys={false} ref={list} />
      </div>
    </div>
  );
}
