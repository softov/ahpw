import type { PresentationPolicy } from '@softov/scena';

/** How the side surfaces give way as the viewport narrows. */
export const PRESENTATION: PresentationPolicy = {
  'sidebar:left': { xsmall: 'sheet', small: 'floating' },
  activitybar: { xsmall: 'bar' },
};
