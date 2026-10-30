/**
 * The addresses the Browser view opened, oldest first, and the one it shows.
 * On the web a cross-origin page hides its own history, so this is the
 * toolbar's list only; an embedder's browser reports each page it reaches.
 */
export interface Visits {
  readonly entries: readonly string[];
  /** The index of the address shown, or -1 before the first. */
  readonly at: number;
}

export const NO_VISITS: Visits = { entries: [], at: -1 };

/** The address shown, or undefined before the first. */
export const current = (visits: Visits): string | undefined => visits.entries[visits.at];

export const canBack = (visits: Visits): boolean => visits.at > 0;

export const canForward = (visits: Visits): boolean => visits.at < visits.entries.length - 1;

/** Opens `url` after the address shown, and drops the addresses after it. */
export function visit(visits: Visits, url: string): Visits {
  if (current(visits) === url) return visits;
  const entries = [...visits.entries.slice(0, visits.at + 1), url];
  return { entries, at: entries.length - 1 };
}

/** Shows the entry `index`; an index out of the list changes nothing. */
export function go(visits: Visits, index: number): Visits {
  return index >= 0 && index < visits.entries.length ? { ...visits, at: index } : visits;
}

export const back = (visits: Visits): Visits => go(visits, visits.at - 1);

export const forward = (visits: Visits): Visits => go(visits, visits.at + 1);

/**
 * Follows a page the browser reached by itself: the entry before or after
 * the address shown when it is one of them, else a new visit.
 */
export function follow(visits: Visits, url: string): Visits {
  if (current(visits) === url) return visits;
  if (visits.entries[visits.at - 1] === url) return back(visits);
  if (visits.entries[visits.at + 1] === url) return forward(visits);
  return visit(visits, url);
}
