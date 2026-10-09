import { useEffect, useState, type ReactElement } from 'react';
import { useStore } from '@softov/scena/react';
import { AHP_CONNECTION, AHP_HOST, reconnect, type Connection, type HostFacts } from './data.js';
import { elapsed } from './words.js';

/** The connection's state, in words. */
const WORDS: Record<Connection['status'], string> = {
  connecting: 'Connecting',
  connected: 'Connected',
  reconnecting: 'Reconnecting',
  disconnected: 'Disconnected',
  failed: 'Not connected',
};

const clock = new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' });

/** The retry the SDK is on, when it says. */
const attemptOf = (connection: Connection | undefined): string => (connection?.attempt === undefined ? '' : ` (try ${connection.attempt})`);

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

/**
 * The status bar's host item: the host, the connection's state, how long this
 * connection has lasted, and how many times it has reconnected. The time
 * starts again on every connection, so a reconnection shows.
 */
export default function ConnectionStatus(): ReactElement {
  const connection = useStore<Connection>(AHP_CONNECTION);
  const host = useStore<HostFacts | null>(AHP_HOST);
  const status = connection?.status ?? 'connecting';
  const since = status === 'connected' ? host?.connectedAt ?? null : null;
  const now = useNow(since !== null);
  const reconnects = Math.max(0, (connection?.generation ?? 0) - 1);
  const down = status === 'disconnected' || status === 'failed' || status === 'reconnecting';

  const tip = [
    host?.label,
    host?.protocolVersion === null || host?.protocolVersion === undefined ? undefined : `AHP ${host.protocolVersion}`,
    since === null ? undefined : `Connected at ${clock.format(since)}`,
    reconnects === 0 ? undefined : `Reconnected ${reconnects} ${reconnects === 1 ? 'time' : 'times'}`,
    connection?.error ?? undefined,
  ].filter((bit) => bit !== undefined).join('\n');

  return (
    <span className="web-connection" data-status={status} title={tip === '' ? undefined : tip}>
      <span className="web-connection__dot" aria-hidden="true" />
      {host === null || host === undefined ? null : <span className="web-connection__host">{host.label}</span>}
      <span>{WORDS[status] ?? status}{status === 'reconnecting' ? attemptOf(connection) : ''}</span>
      {since === null ? null : <span className="web-connection__uptime">{elapsed(now - since)}</span>}
      {reconnects === 0 ? null : <span className="web-connection__uptime">{`\u{21BB} ${reconnects}`}</span>}
      {down ? <button type="button" className="web-connection__retry" onClick={() => void reconnect()}>Reconnect now</button> : null}
    </span>
  );
}
