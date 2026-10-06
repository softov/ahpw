import { useEffect, useState, type ReactElement } from 'react';
import { useStore } from '@softov/scena/react';
import { call } from '../api.js';
import { AHP_CONNECTION, reconnect, type Connection } from './data.js';
import { elapsed } from './words.js';

/** The connection's state, in words. */
const WORDS: Record<Connection['status'], string> = {
  connecting: 'Connecting',
  connected: 'Connected',
  reconnecting: 'Reconnecting',
  disconnected: 'Disconnected',
  failed: 'Not connected',
};

/** The retry the SDK is on, when it says. */
const attemptOf = (connection: Connection | undefined): string => (connection?.attempt === undefined ? '' : ` (try ${connection.attempt})`);

/** The daemon's start time, read again on every connection, because a restart moves it. */
function useStartedAt(generation: number, connected: boolean): number | null {
  const [startedAt, setStartedAt] = useState<number | null>(null);
  useEffect(() => {
    if (!connected) return;
    let alive = true;
    call({ method: 'GET', path: '/status' })
      .then((answer) => {
        const at = Date.parse(String((answer as { startedAt?: unknown } | null)?.startedAt ?? ''));
        if (alive) setStartedAt(Number.isNaN(at) ? null : at);
      })
      .catch(() => {
        if (alive) setStartedAt(null);
      });
    return () => {
      alive = false;
    };
  }, [generation, connected]);
  return startedAt;
}

/** A clock that moves once a second while `on`. */
function useNow(on: boolean): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!on) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [on]);
  return now;
}

/** The status bar's connection item: the state, the daemon's uptime, and Reconnect when it is down. */
export default function ConnectionStatus(): ReactElement {
  const connection = useStore<Connection>(AHP_CONNECTION);
  const status = connection?.status ?? 'connecting';
  const connected = status === 'connected';
  const startedAt = useStartedAt(connection?.generation ?? 0, connected);
  const now = useNow(connected && startedAt !== null);
  const down = status === 'disconnected' || status === 'failed' || status === 'reconnecting';

  return (
    <span className="web-connection" data-status={status} title={connection?.error ?? undefined}>
      <span className="web-connection__dot" aria-hidden="true" />
      <span>{WORDS[status] ?? status}{status === 'reconnecting' ? attemptOf(connection) : ''}</span>
      {connected && startedAt !== null ? <span className="web-connection__uptime">up {elapsed(now - startedAt)}</span> : null}
      {down ? <button type="button" className="web-connection__retry" onClick={() => void reconnect()}>Reconnect now</button> : null}
    </span>
  );
}
