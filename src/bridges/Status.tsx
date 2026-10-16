import { useEffect, useState, type ReactElement } from 'react';
import { useI18n, useStore } from '@softov/scena/react';
import { ahpPaths, hostBridge, windowHost, type Connection, type HostFacts } from './data.js';
import { useEach, useEveryHost, useHostNames } from './hosts.js';
import { embedMode } from '../shell/embed/index.js';
import { serverLabel, type ServerInfo } from './server-info.js';
import { elapsed } from './words.js';
import { EMOJIcon } from '../resources/emojis.js';
import { plural, dateFormat } from '../i18n/locales.js';

/** The connection's state, as its word under `bridges/state`. */
const WORDS: Record<Connection['status'], string> = {
  connecting: 'connecting',
  connected: 'connected',
  reconnecting: 'reconnecting',
  disconnected: 'disconnected',
  failed: 'notConnected',
};

const clock = dateFormat({ hour: '2-digit', minute: '2-digit', second: '2-digit' });

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
 * The status bar's host item: the host's software and version, the
 * connection's state, how long this connection has lasted, and how many times
 * it has reconnected. The time starts again on every connection, so a
 * reconnection shows. A host that sends no `serverInfo` is named by its
 * address, which the tooltip always gives.
 */
export default function ConnectionStatus(): ReactElement {
  return embedMode() === 'multi' ? <EveryHostStatus /> : <OneHostStatus />;
}

function OneHostStatus(): ReactElement {
  const { t } = useI18n();
  const paths = ahpPaths(windowHost());
  const connection = useStore<Connection>(paths.connection);
  const host = useStore<HostFacts | null>(paths.host);
  const server = useStore<ServerInfo | null>(paths.server);
  const name = server === null || server === undefined ? host?.label : serverLabel(server);
  const status = connection?.status ?? 'connecting';
  const since = status === 'connected' ? host?.connectedAt ?? null : null;
  const now = useNow(since !== null);
  const reconnects = Math.max(0, (connection?.generation ?? 0) - 1);
  const down = status === 'disconnected' || status === 'failed' || status === 'reconnecting';

  const tip = [
    name,
    name === host?.label ? undefined : host?.label,
    host?.protocolVersion === null || host?.protocolVersion === undefined ? undefined : `AHP ${host.protocolVersion}`,
    since === null ? undefined : t('bridges/connectedAt', { time: clock.format(since) }),
    reconnects === 0 ? undefined : plural('bridges/reconnected', reconnects),
    connection?.error ?? undefined,
  ].filter((bit) => bit !== undefined).join('\n');
  // The retry the SDK is on, when it says.
  const word = status === 'reconnecting' && connection?.attempt !== undefined
    ? t('bridges/state/reconnectingTry', { attempt: connection.attempt })
    : WORDS[status] === undefined ? status : t(`bridges/state/${WORDS[status]}`);

  return (
    <span className="web-connection" data-status={status} title={tip === '' ? undefined : tip}>
      <span className="web-connection__dot" aria-hidden="true" />
      {name === undefined ? null : <span className="web-connection__host">{name}</span>}
      <span>{word}</span>
      {since === null ? null : <span className="web-connection__uptime">{elapsed(now - since)}</span>}
      {reconnects === 0 ? null : <span className="web-connection__uptime">{`${EMOJIcon.reload} ${reconnects}`}</span>}
      {down ? <button type="button" className="web-connection__retry" onClick={() => void hostBridge(windowHost()).reconnect()}>{t('bridges/reconnectNow')}</button> : null}
    </span>
  );
}

/** How bad a state is, so the worst host's state colours the dot. */
const RANK: Record<Connection['status'], number> = { connected: 0, connecting: 1, reconnecting: 2, disconnected: 3, failed: 4 };

/**
 * With every host: how many hosts are connected, the dot of the worst state,
 * and one line per host in the tooltip. Retry tries every host that is down.
 */
function EveryHostStatus(): ReactElement {
  const { t } = useI18n();
  const hosts = useEveryHost();
  const hostName = useHostNames();
  const connections = useEach<Connection>(hosts.map((host) => ahpPaths(host).connection));
  const states = hosts.map((_, at) => connections[at]?.status ?? 'connecting');
  const up = states.filter((one) => one === 'connected').length;
  const worst = states.reduce<Connection['status']>((held, one) => (RANK[one] > RANK[held] ? one : held), 'connected');
  const down = states.some((one) => one === 'disconnected' || one === 'failed' || one === 'reconnecting');
  const tip = hosts.map((host, at) => `${hostName(host)}: ${t(`bridges/state/${WORDS[states[at]!]}`)}`).join('\n');
  return (
    <span className="web-connection" data-status={worst} title={tip === '' ? undefined : tip}>
      <span className="web-connection__dot" aria-hidden="true" />
      <span>{t('bridges/hostsUp', { up, total: hosts.length })}</span>
      {down ? <button type="button" className="web-connection__retry" onClick={() => void Promise.all(hosts.filter((_, at) => states[at] !== 'connected').map((host) => hostBridge(host).reconnect()))}>{t('bridges/reconnectNow')}</button> : null}
    </span>
  );
}
