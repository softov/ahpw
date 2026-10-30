import type { ReactElement } from 'react';
import { useI18n } from '@softov/scena/react';
import { Button } from '@softov/scena/ui';
import { ahpPaths, type Connection } from '../../bridges/data.js';
import { fixHost, hostFix, hostState } from '../../bridges/host-state.js';
import { useEach, useHostNames, useShownHosts } from '../../bridges/hosts.js';

/** A host's dot and name, as the panels show the host they are on. */
export function HostTag({ host }: { host: string }): ReactElement {
  const { t } = useI18n();
  const hostName = useHostNames();
  const [connection] = useEach<Connection>([ahpPaths(host).connection]);
  const [refused] = useEach<boolean>([ahpPaths(host).refused]);
  const state = hostState(connection, refused);
  return (
    <span className="web-host-tag" data-state={state} title={t(`hosts/state/${state}`)}>
      <span className="web-host-line__dot" aria-hidden="true" />
      {hostName(host)}
    </span>
  );
}

/**
 * With every host, a line for each shown host that is not connected: its
 * name, its state, and Sign in or Retry. The other hosts' rows stay below.
 */
export function HostLines(): ReactElement | null {
  const { t } = useI18n();
  const hosts = useShownHosts();
  const hostName = useHostNames();
  const connections = useEach<Connection>(hosts.map((host) => ahpPaths(host).connection));
  const refusals = useEach<boolean>(hosts.map((host) => ahpPaths(host).refused));
  const lines = hosts
    .map((host, at) => ({ host, state: hostState(connections[at], refusals[at]) }))
    .filter((one) => one.state !== 'connected')
    .map((one) => ({ ...one, fix: hostFix(one.state) }));
  if (lines.length === 0) return null;
  return (
    <ul className="web-host-lines">
      {lines.map(({ host, state, fix }) => (
        <li key={host} className="web-host-line" data-state={state}>
          <span className="web-host-line__dot" aria-hidden="true" />
          <span className="web-host-line__name">{hostName(host)}</span>
          <span className="web-host-line__state">{t(`hosts/state/${state}`)}</span>
          {fix === null ? null : <Button size="sm" variant="ghost" label={t(fix)} onClick={() => fixHost(host, state)} />}
        </li>
      ))}
    </ul>
  );
}
