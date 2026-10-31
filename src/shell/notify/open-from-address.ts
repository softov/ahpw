import type { Disposable, Scena } from '@softov/scena/types';
import { ahpPaths, type Connection } from '../../bridges/data.js';
import type { OpenSessionArgs } from '../../resources/sessions/index.js';

/** A session a push asked to open: the host it is on and its URI. */
export interface PushedSession {
  host: string;
  session: string;
}

/** The session the address names with `?host=` and `?session=`, which the service worker opens a window on, or null. */
export function sessionInAddress(search: string): PushedSession | null {
  const params = new URLSearchParams(search);
  const host = params.get('host');
  const session = params.get('session');
  return host === null || host === '' || session === null || session === '' ? null : { host, session };
}

/** The address without `host` and `session`, so a reload does not open the session again. */
export function withoutSession(href: string): string {
  const url = new URL(href);
  url.searchParams.delete('host');
  url.searchParams.delete('session');
  return url.href;
}

/** The session in a service worker's `{ open: { host, session } }` message, or null. */
export function sessionInMessage(data: unknown): PushedSession | null {
  const open = (data as { open?: { host?: unknown; session?: unknown } } | null)?.open;
  return typeof open?.host === 'string' && open.host !== '' && typeof open.session === 'string' && open.session !== '' ? { host: open.host, session: open.session } : null;
}

/** Opens the session once its host is connected, at once when it already is. */
function openWhenConnected(scena: Scena, { host, session }: PushedSession): Disposable {
  const path = ahpPaths(host).connection;
  let done = false;
  const open = (): void => {
    if (done || scena.store.get<Connection>(path)?.status !== 'connected') return;
    done = true;
    void scena.commands.execute('ahp.openSession', { host, resource: session } satisfies OpenSessionArgs);
  };
  const watching = scena.store.subscribe(path, () => {
    open();
    if (done) watching.dispose();
  });
  open();
  if (done) watching.dispose();
  return watching;
}

/**
 * Opens the session a push was clicked for: the one the address names when the
 * service worker opened this window, and each one it sends to a window already
 * open.
 */
export function openPushedSessions(scena: Scena): Disposable {
  if (typeof window === 'undefined') return { dispose: () => undefined };
  const waiting: Disposable[] = [];
  const named = sessionInAddress(window.location.search);
  if (named !== null) {
    window.history.replaceState(window.history.state, '', withoutSession(window.location.href));
    waiting.push(openWhenConnected(scena, named));
  }
  const worker = typeof navigator === 'undefined' ? undefined : navigator.serviceWorker;
  const onMessage = (event: MessageEvent): void => {
    const sent = sessionInMessage(event.data);
    if (sent !== null) waiting.push(openWhenConnected(scena, sent));
  };
  worker?.addEventListener('message', onMessage);
  return {
    dispose: () => {
      worker?.removeEventListener('message', onMessage);
      for (const one of waiting) one.dispose();
    },
  };
}
