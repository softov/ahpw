import type { BindingPath } from '@softov/scena/types';

/** The resource of the session open in `main`. */
export const ACTIVE_SESSION = '$/ahp/activeSession' as BindingPath;

/** True while the list shows archived sessions too; the header's Show archived is pressed. */
export const SESSIONS_ARCHIVED = '$/ahp/sessions/archived' as BindingPath;

/** What the list is grouped by; null while it is not, so the header's Group is pressed only when grouped. */
export const SESSIONS_GROUPING = '$/ahp/sessions/grouping' as BindingPath;

/** True while the list is read again; the header's Reload turns. */
export const SESSIONS_RELOADING = '$/ahp/sessions/reloading' as BindingPath;
