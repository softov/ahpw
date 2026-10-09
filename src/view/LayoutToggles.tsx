import type { ReactElement } from 'react';
import { useLayout, useScena } from '@softov/scena/react';

type Side = 'left' | 'bottom' | 'right';

interface Toggle {
  side: Side;
  surface: string;
  command: string;
  title: string;
}

const TOGGLES: readonly Toggle[] = [
  { side: 'left', surface: 'sidebar:left', command: 'sidebar.toggleLeft', title: 'Toggle left sidebar (Ctrl+B)' },
  { side: 'bottom', surface: 'panel:bottom', command: 'panel.toggle', title: 'Toggle panel (Ctrl+J)' },
  { side: 'right', surface: 'sidebar:right', command: 'sidebar.toggleRight', title: 'Toggle right sidebar (Ctrl+Alt+B)' },
];

/** The part of the frame a side's area takes, in a 16 by 16 box. */
const AREA: Record<Side, { x: number; y: number; width: number; height: number }> = {
  left: { x: 2, y: 3, width: 4, height: 10 },
  bottom: { x: 2, y: 9, width: 12, height: 4 },
  right: { x: 10, y: 3, width: 4, height: 10 },
};

/** A window frame with one side's area marked, filled while that area is shown. */
function Frame({ side, shown }: { side: Side; shown: boolean }): ReactElement {
  const area = AREA[side];
  const divider = side === 'left' ? 'M6 3v10' : side === 'right' ? 'M10 3v10' : 'M2 9h12';
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1" aria-hidden="true">
      <rect x="1.5" y="2.5" width="13" height="11" rx="1" />
      <path d={divider} />
      {shown ? <rect {...area} fill="currentColor" stroke="none" /> : null}
    </svg>
  );
}

/** The title bar's layout toggles: left sidebar, panel, right sidebar, each marked while its area is shown. */
export default function LayoutToggles(): ReactElement {
  const scena = useScena();
  const surfaces = useLayout().surfaces;
  return (
    <span className="web-toggles">
      {TOGGLES.map((toggle) => {
        const shown = surfaces[toggle.surface]?.visible === true;
        return (
          <button
            key={toggle.side}
            type="button"
            className="web-toggles__button"
            title={toggle.title}
            aria-label={toggle.title}
            aria-pressed={shown}
            onClick={() => void scena.commands.execute(toggle.command)}
          >
            <Frame side={toggle.side} shown={shown} />
          </button>
        );
      })}
    </span>
  );
}
