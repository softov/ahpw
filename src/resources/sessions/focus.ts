import type { Disposable, Scena, ScenaLayout } from '@softov/scena/types';
import { ACTIVE_SESSION, type ActiveSession } from './state.js';

/** The mount key of a session's tab in `main`: `session:<host>:<resource>`. */
export const sessionKey = (host: string, resource: string): string => `session:${host}:${resource}`;

/**
 * The session a tab's mount key names, or null for any other tab. A host id
 * holds no `:`, and a resource is a URI that does, so the key splits at its
 * first two colons only.
 */
export function sessionOfKey(key: string | undefined): ActiveSession | null {
  if (key === undefined || !key.startsWith('session:')) return null;
  const rest = key.slice('session:'.length);
  const colon = rest.indexOf(':');
  if (colon <= 0 || colon === rest.length - 1) return null;
  return { host: rest.slice(0, colon), resource: rest.slice(colon + 1) };
}

/**
 * Keeps `ACTIVE_SESSION` on the session whose tab has the focus in `main`. A
 * focused tab that is not a session leaves the last session in place, as
 * VS Code's session view does.
 */
export function followFocus(scena: Scena): Disposable {
  const follow = (layout: ScenaLayout): void => {
    const focused = sessionOfKey(layout.surfaces.main?.activeContainerKey);
    if (focused === null) return;
    const now = scena.store.get<ActiveSession>(ACTIVE_SESSION);
    if (now?.host === focused.host && now.resource === focused.resource) return;
    scena.store.set(ACTIVE_SESSION, focused);
  };
  follow(scena.layout.get());
  return scena.layout.subscribe(follow);
}
