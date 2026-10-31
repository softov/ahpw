import type { BindingPath } from '@softov/scena/types';
import { chatChoice } from '../sessions/view-settings.js';

/** Where a canvas opens, as `ui.canvasOpens` sets it: `ask` asks on the next open and keeps the answer. */
export const CANVAS_OPENS = chatChoice('$/ahp/canvases/opens' as BindingPath, 'ahpw.canvasOpens', ['ask', 'main', 'right'], 'main');

/** Whether a canvas opens by itself when it joins the chat on screen, as `ui.canvasAutoOpen` sets it. */
export const CANVAS_AUTO_OPEN = chatChoice('$/ahp/canvases/autoOpen' as BindingPath, 'ahpw.canvasAutoOpen', ['enabled', 'disabled'], 'disabled');

/** Where a canvas tab opens: `main`, or the right sidebar. */
export type CanvasPlace = 'main' | 'right';
