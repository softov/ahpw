/** The main area's layouts, as scena registers them. */
export const MAIN_LAYOUTS = [
  { id: 'tab', label: 'Tabs', icon: '\u{25AD}' },
  { id: 'tab-panel', label: 'Tab groups', icon: '\u{229E}' },
  { id: 'split', label: 'Split', icon: '\u{229F}' },
  { id: 'spatial', label: 'Spatial', icon: '\u{25C7}' },
  { id: 'stack', label: 'Stack', icon: '\u{2630}' },
  { id: 'single', label: 'Single', icon: '\u{25A1}' },
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
