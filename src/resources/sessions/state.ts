import type { BindingPath } from '@softov/scena/types';

/** The session open in `main`, as `ActiveSession`. */
export const ACTIVE_SESSION = '$/ahp/activeSession' as BindingPath;

/** A session and its host. */
export interface ActiveSession {
  host: string;
  resource: string;
}

/** True while the list shows archived sessions too; the header's Show archived is pressed. */
export const SESSIONS_ARCHIVED = '$/ahp/sessions/archived' as BindingPath;

/** What the list is grouped by; null while it is not, so the header's Group is pressed only when grouped. */
export const SESSIONS_GROUPING = '$/ahp/sessions/grouping' as BindingPath;

/** The second grouping, inside each group of the first; null while there is none. */
export const SESSIONS_THEN_BY = '$/ahp/sessions/thenBy' as BindingPath;

/** The list's order, as `Sorting`. */
export const SESSIONS_SORTING = '$/ahp/sessions/sorting' as BindingPath;

/** True while the order is not the usual one, so the header's Sort is pressed. */
export const SESSIONS_SORTED = '$/ahp/sessions/sorted' as BindingPath;

/** Which sessions the list shows, by read or at work; null while it shows them all, so its button is pressed only when it does not. */
export const SESSIONS_SHOW = '$/ahp/sessions/show' as BindingPath;

/** True while the list is read again; the header's Reload turns. */
export const SESSIONS_RELOADING = '$/ahp/sessions/reloading' as BindingPath;
