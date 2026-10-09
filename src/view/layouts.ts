import { EMOJIcon } from '../emojis.js';

/** The main area's layouts, as scena registers them. */
export const MAIN_LAYOUTS = [
  { id: 'tab', label: 'Tabs', icon: EMOJIcon.layoutTabs },
  { id: 'tab-panel', label: 'Tab groups', icon: EMOJIcon.layoutGroups },
  { id: 'split', label: 'Split', icon: EMOJIcon.layoutSplit },
  { id: 'spatial', label: 'Spatial', icon: EMOJIcon.layoutSpatial },
  { id: 'stack', label: 'Stack', icon: EMOJIcon.layoutStack },
  { id: 'single', label: 'Single', icon: EMOJIcon.layoutSingle },
] as const;

/** The localStorage key the chosen layout is kept under. */
export const LAYOUT_KEY = 'ahpd-web.main-layout';

/** The layout this browser chose last, when it is one scena has. */
export function readLayout(): string | null {
  try {
    const held = window.localStorage.getItem(LAYOUT_KEY);
    return MAIN_LAYOUTS.some((one) => one.id === held) ? held : null;
  } catch {
    return null;
  }
}

export function writeLayout(layout: string): void {
  try {
    window.localStorage.setItem(LAYOUT_KEY, layout);
  } catch {
    // Storage blocked: the choice lasts as long as the page.
  }
}
