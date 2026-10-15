import { useEffect, useState, type ReactElement } from 'react';
import { useI18n, useScena, useStore } from '@softov/scena/react';
import { Alert, Badge, Button, DetailList, Text, type DetailItem } from '@softov/scena/ui';
import type { AgentInfo, AutomationCapabilities } from '@microsoft/agent-host-protocol';
// import { call } from '../../lib/api.js';
import { AHP_AGENTS, AHP_AUTOMATION_CAPS, AHP_CONNECTION, AHP_DEFAULT_DIRECTORY, AHP_HOST, reconnect, type Connection, type HostFacts } from '../../bridges/data.js';
import { elapsed, folderLabel } from '../../bridges/words.js';
import { when } from '../sessions/turn.js';
import { AGENTS_SECTION } from '../agents/index.js';
import { plural } from '../../i18n/locales.js';

/** What `GET /api/status` says about the daemon process. */
interface DaemonStatus {
  pid?: number;
  url?: string;
  paths?: string[];
  startedAt?: string;
  automations?: string;
}

type Tone = 'default' | 'success' | 'warning' | 'danger' | 'info';

/** Each connection state's tone, and its word under `bridges/state`. */
const CONNECTION: Record<string, { tone: Tone; word: string }> = {
  connected: { tone: 'success', word: 'connected' },
  connecting: { tone: 'info', word: 'connecting' },
  reconnecting: { tone: 'warning', word: 'reconnecting' },
  disconnected: { tone: 'default', word: 'disconnected' },
  failed: { tone: 'danger', word: 'failed' },
};

/** The daemon's status, asked again on every new connection. */
function useDaemonStatus(generation: number): { status: DaemonStatus | null; error: string | null } {
  const [status, setStatus] = useState<DaemonStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    // ahpd's GET /api/status; off while ahpw is AHP only.
    setStatus(null);
    setError(null);
    // let alive = true;
    // call({ method: 'GET', path: '/status' })
    //   .then((answer) => { if (alive) { setStatus(answer as DaemonStatus); setError(null); } })
    //   .catch((caught: unknown) => { if (alive) setError(caught instanceof Error ? caught.message : String(caught)); });
    // return () => { alive = false; };
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
  const { t } = useI18n();
  const connection = useStore<Connection>(AHP_CONNECTION);
  const host = useStore<HostFacts | null>(AHP_HOST);
  const agents = useStore<AgentInfo[]>(AHP_AGENTS) ?? [];
  const home = useStore<string | null>(AHP_DEFAULT_DIRECTORY);
  const caps = useStore<AutomationCapabilities | null>(AHP_AUTOMATION_CAPS);
  const { status, error } = useDaemonStatus(connection?.generation ?? 0);
  const now = useNow();
  const shown = CONNECTION[connection?.status ?? 'disconnected'] ?? CONNECTION['disconnected']!;
  const shownText = t(`bridges/state/${shown.word}`);
  const started = status?.startedAt === undefined ? NaN : Date.parse(status.startedAt);

  const link: DetailItem[] = [{ label: t('host/info/status'), value: shownText }];
  if (host !== null && host !== undefined) {
    link.push({ label: t('host/info/host'), value: host.label });
    if (host.protocolVersion !== null) link.push({ label: t('host/info/protocol'), value: host.protocolVersion });
    if (host.connectedAt !== null) link.push({ label: t('host/info/connected'), value: t('host/info/connectedValue', { when: when(host.connectedAt), elapsed: elapsed(now - host.connectedAt) }) });
    link.push({ label: t('host/info/client'), value: <code>{host.clientId}</code> }, { label: t('host/info/serverSeq'), value: String(host.serverSeq) }, { label: t('host/info/following'), value: plural('host/info/channels', host.subscriptions) });
  }
  if (connection?.error !== null && connection?.error !== undefined) link.push({ label: t('host/info/lastError'), value: connection.error });

  const daemon: DetailItem[] = [];
  if (status !== null) {
    if (!Number.isNaN(started)) daemon.push({ label: t('host/info/started'), value: t('host/info/startedValue', { when: when(started), elapsed: elapsed(now - started) }) });
    if (status.pid !== undefined) daemon.push({ label: t('host/info/process'), value: String(status.pid) });
    if (status.url !== undefined) daemon.push({ label: t('host/info/address'), value: <code>{status.url}</code> });
    if (status.automations !== undefined) daemon.push({ label: t('host/info/automationsKeptIn'), value: status.automations });
    if ((status.paths ?? []).length > 0) daemon.push({ label: t('host/info/sessionsKeptIn'), value: <span className="web-lines">{status.paths!.map((one) => <code key={one}>{one}</code>)}</span> });
  }

  const offers: DetailItem[] = [
    {
      label: t('host/info/agents'),
      value: (
        <button type="button" className="web-link" onClick={() => void scena.commands.execute('sidebar.activate', { section: AGENTS_SECTION })}>
          {agents.length === 0 ? t('host/info/none') : agents.map((one) => one.displayName).join(', ')}
        </button>
      ),
    },
    { label: t('host/info/defaultFolder'), value: home === null || home === undefined ? t('host/info/none') : <code>{folderLabel(home)}</code> },
  ];
  if (host?.activeSessions !== null && host?.activeSessions !== undefined) offers.push({ label: t('host/info/activeSessions'), value: String(host.activeSessions) });
  offers.push({
    label: t('host/info/automations'),
    value: caps === null || caps === undefined ? t('host/info/automationsNotOffered') : [
      caps.create === undefined ? t('host/info/automationsReadOnly') : t('host/info/automationsCreate'),
      caps.schedules?.minIntervalMinutes === undefined ? undefined : plural('host/info/automationsInterval', caps.schedules.minIntervalMinutes),
      caps.runCancellation === undefined ? undefined : t('host/info/automationsStoppable'),
    ].filter((bit) => bit !== undefined).join(', '),
  });

  const terminals = host?.terminals ?? [];
  return (
    <div className="web-page">
      <div className="web-page__head">
        <div className="web-chat__title">
          <Text variant="h2" text={t('host/title')} />
          <Badge tone={shown.tone} text={shownText} />
        </div>
        <div className="web-page__actions">
          {connection?.status === 'connected' ? null : <Button label={t('bridges/reconnectNow')} variant="primary" onClick={reconnect} />}
          <Button label={t('host/info/settings')} onClick={() => void scena.commands.execute('ahp.openSettings')} />
        </div>
      </div>

      <Text variant="h3" text={t('host/info/connection')} />
      <DetailList items={link} columns={2} />

      {status === null && error === null ? null : <Text variant="h3" text={t('host/info/daemon')} />}
      {error === null ? null : <Alert tone="warning" message={t('host/info/statusUnreadable', { error })} />}
      {daemon.length === 0 ? null : <DetailList items={daemon} columns={2} />}

      <Text variant="h3" text={t('host/info/offers')} />
      <DetailList items={offers} columns={2} />

      <Text variant="h3" text={t('host/info/terminals')} />
      {terminals.length === 0 ? <p className="web-note">{t('host/info/noTerminals')}</p> : (
        <table className="web-runs web-table">
          <thead>
            <tr><th>{t('host/info/terminalTitle')}</th><th>{t('host/info/terminalState')}</th></tr>
          </thead>
          <tbody>
            {terminals.map((one) => {
              const life = one.lifecycle as { status?: string; exitCode?: number };
              return (
                <tr key={one.resource}>
                  <td>{one.title}</td>
                  <td>{life.status !== 'exited' ? t('host/info/running') : life.exitCode === undefined ? t('host/info/exited') : t('host/info/exitedCode', { code: life.exitCode })}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
