import type { ReactElement } from 'react';
import { useLayout, useScena } from '@softov/scena/react';
import { MAIN_LAYOUTS } from './layouts.js';
import { EMOJIcon } from '../emojis.js';

/** Picks how the main area lays out its pages: tabs, groups, split, spatial and the rest. */
export default function LayoutSelect(): ReactElement {
  const scena = useScena();
  const current = useLayout().surfaces.main?.layout ?? 'tab';
  return (
    <label className="web-layout-select" title="Layout">
      <span aria-hidden="true">{MAIN_LAYOUTS.find((one) => one.id === current)?.icon ?? EMOJIcon.layoutTabs}</span>
      <select aria-label="Layout" value={current} onChange={(event) => void scena.commands.execute('view.setMainLayout', { layout: event.target.value })}>
        {MAIN_LAYOUTS.map((one) => <option key={one.id} value={one.id}>{one.label}</option>)}
      </select>
    </label>
  );
}
