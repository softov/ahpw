import type { BindingPath } from '@softov/scena/types';

/** The bot open in `main`, as `{ host, slug }`. */
export const ACTIVE_BOT = '$/ahp/activeBot' as BindingPath;

/** Whether any host this page connects to serves bots; their activity bar entry and layer show while it does. */
export const BOTS_SERVED = '$/ahp/bots/served' as BindingPath;
