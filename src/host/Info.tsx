import { useEffect, useState, type ReactElement } from 'react';
import { useScena, useStore } from '@softov/scena/react';
import { Alert, Badge, Button, DetailList, Text, type DetailItem } from '@softov/scena/ui';
import type { AgentInfo, AutomationCapabilities } from '@microsoft/agent-host-protocol';
import { call } from '../api.js';
import { AHP_AGENTS, AHP_AUTOMATION_CAPS, AHP_CONNECTION, AHP_DEFAULT_DIRECTORY, AHP_HOST, reconnect, type Connection, type HostFacts } from '../connection/data.js';
import { elapsed, folderLabel } from '../connection/words.js';
import { when } from '../sessions/turn.js';
import { AGENTS_SECTION } from '../agents/index.js';

/** What `GET /api/status` says about the daemon process. */
interface DaemonStatus {
  pid?: number;
  url?: string;
  paths?: string[];
  startedAt?: string;
  automations?: string;
}

type Tone = 'default' | 'success' | 'warning' | 'danger' | 'info';

const CONNECTION: Record<string, { tone: Tone; text: string }> = {
  connected: { tone: 'success', text: 'Connected' },
  connecting: { tone: 'info', text: 'Connecting' },
  reconnecting: { tone: 'warning', text: 'Reconnecting' },
  disconnected: { tone: 'default', text: 'Disconnected' },
  failed: { tone: 'danger', text: 'Failed' },
};

/** The daemon's status, asked again on every new connection. */
function useDaemonStatus(generation: number): { status: DaemonStatus | null; error: string | null } {
  const [status, setStatus] = useState<DaemonStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    call({ method: 'GET', path: '/status' })
      .then((answer) => { if (alive) { setStatus(answer as DaemonStatus); setError(null); } })
      .catch((caught: unknown) => { if (alive) setError(caught instanceof Error ? caught.message : String(caught)); });
    return () => { alive = false; };
  }, [generation]);
  return { status, error };
}

/** A clock that moves once a second. */
function useNow(): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  return now;
}

/** The host: the connection to it, the daemon process, and what it offers. */
export default function HostInfoPage(): ReactElement {
  const scena = useScena();
  const connection = useStore<Connection>(AHP_CONNECTION);
  const host = useStore<HostFacts | null>(AHP_HOST);
  const agents = useStore<AgentInfo[]>(AHP_AGENTS) ?? [];
  const home = useStore<string | null>(AHP_DEFAULT_DIRECTORY);
  const caps = useStore<AutomationCapabilities | null>(AHP_AUTOMATION_CAPS);
  const { status, error } = useDaemonStatus(connection?.generation ?? 0);
  const now = useNow();
  const shown = CONNECTION[connection?.status ?? 'disconnected'] ?? CONNECTION['disconnected']!;
  const started = status?.startedAt === undefined ? NaN : Date.parse(status.startedAt);

  const link: DetailItem[] = [{ label: 'Status', value: shown.text }];
  if (host !== null && host !== undefined) {
    link.push({ label: 'Host', value: host.label });
    if (host.protocolVersion !== null) link.push({ label: 'Protocol', value: host.protocolVersion });
    if (host.connectedAt !== null) link.push({ label: 'Connected', value: `${when(host.connectedAt)} \u{00B7} ${elapsed(now - host.connectedAt)}` });
    link.push({ label: 'Client', value: <code>{host.clientId}</code> }, { label: 'Server sequence', value: String(host.serverSeq) }, { label: 'Following', value: `${host.subscriptions} channels` });
  }
  if (connection?.error !== null && connection?.error !== undefined) link.push({ label: 'Last error', value: connection.error });

  const daemon: DetailItem[] = [];
  if (status !== null) {
    if (!Number.isNaN(started)) daemon.push({ label: 'Started', value: `${when(started)} \u{00B7} up ${elapsed(now - started)}` });
    if (status.pid !== undefined) daemon.push({ label: 'Process', value: String(status.pid) });
    if (status.url !== undefined) daemon.push({ label: 'Address', value: <code>{status.url}</code> });
    if (status.automations !== undefined) daemon.push({ label: 'Automations kept in', value: status.automations });
    if ((status.paths ?? []).length > 0) daemon.push({ label: 'Sessions kept in', value: <span className="web-lines">{status.paths!.map((one) => <code key={one}>{one}</code>)}</span> });
  }

  const offers: DetailItem[] = [
    {
      label: 'Agents',
      value: (
        <button type="button" className="web-link" onClick={() => void scena.commands.execute('sidebar.activate', { section: AGENTS_SECTION })}>
          {agents.length === 0 ? 'None' : agents.map((one) => one.displayName).join(', ')}
        </button>
      ),
    },
    { label: 'Default folder', value: home === null || home === undefined ? 'None' : <code>{folderLabel(home)}</code> },
  ];
  if (host?.activeSessions !== null && host?.activeSessions !== undefined) offers.push({ label: 'Active sessions', value: String(host.activeSessions) });
  offers.push({
    label: 'Automations',
    value: caps === null || caps === undefined ? 'Not offered' : [
      caps.create === undefined ? 'Read only' : 'Clients can create them',
      caps.schedules?.minIntervalMinutes === undefined ? undefined : `at most every ${caps.schedules.minIntervalMinutes} minutes`,
      caps.runCancellation === undefined ? undefined : 'runs can be stopped',
    ].filter((bit) => bit !== undefined).join(', '),
  });

  const terminals = host?.terminals ?? [];
  return (
    <div className="web-page">
      <div className="web-page__head">
        <div className="web-chat__title">
          <Text variant="h2" text="Host" />
          <Badge tone={shown.tone} text={shown.text} />
        </div>
        <div className="web-page__actions">
          {connection?.status === 'connected' ? null : <Button label="Reconnect now" variant="primary" onClick={reconnect} />}
          <Button label="Settings" onClick={() => void scena.commands.execute('ahp.openSettings')} />
        </div>
      </div>

      <Text variant="h3" text="Connection" />
      <DetailList items={link} columns={2} />

      <Text variant="h3" text="Daemon" />
      {error === null ? null : <Alert tone="warning" message={`The daemon's status is not readable: ${error}`} />}
      {daemon.length === 0 ? null : <DetailList items={daemon} columns={2} />}

      <Text variant="h3" text="Offers" />
      <DetailList items={offers} columns={2} />

      <Text variant="h3" text="Terminals" />
      {terminals.length === 0 ? <p className="web-note">No terminals open.</p> : (
        <table className="web-runs web-table">
          <thead>
            <tr><th>Title</th><th>State</th></tr>
          </thead>
          <tbody>
            {terminals.map((one) => {
              const life = one.lifecycle as { status?: string; exitCode?: number };
              return (
                <tr key={one.resource}>
                  <td>{one.title}</td>
                  <td>{life.status === 'exited' ? `Exited${life.exitCode === undefined ? '' : ` (${life.exitCode})`}` : 'Running'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
