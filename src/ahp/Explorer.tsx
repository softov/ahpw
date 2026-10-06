import { useEffect, useMemo, type ReactElement } from 'react';
import { useScena, useStore } from '@softov/scena/react';
import { Alert, Badge, Spinner, Tree, type TreeNode } from '@softov/scena/ui';
import type { SessionSummary } from '@microsoft/agent-host-protocol';
import { ACTIVE_SESSION, AHP_CONNECTION, AHP_SESSIONS, type Connection } from './data.js';
import { ACTIVITY_LABEL, ACTIVITY_TONE, activityOf, isArchived } from './status.js';

const sameDay = new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' });
const otherDay = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' });

/** When a session last changed: the time today, the date before. */
function changedAt(iso: string, now = new Date()): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return (date.toDateString() === now.toDateString() ? sameDay : otherDay).format(date);
}

/** The sidebar: the daemon's sessions, newest change first, archived ones left out. */
export default function SessionExplorer(): ReactElement {
  const scena = useScena();
  const connection = useStore<Connection>(AHP_CONNECTION);
  const sessions = useStore<SessionSummary[]>(AHP_SESSIONS);
  const active = useStore<string>(ACTIVE_SESSION);
  const nodes = useMemo<TreeNode<SessionSummary>[]>(
    () => (sessions ?? []).filter((one) => !isArchived(one.status)).map((one) => {
      const activity = activityOf(one.status);
      return {
        key: one.resource,
        label: one.title === '' ? 'Untitled' : one.title,
        trailing: activity === 'idle'
          ? <span className="web-method">{changedAt(one.modifiedAt)}</span>
          : <Badge tone={ACTIVITY_TONE[activity]} text={ACTIVITY_LABEL[activity]} />,
        data: one,
      };
    }),
    [sessions],
  );

  // The first session opens when the list arrives and nothing is open.
  useEffect(() => {
    const first = nodes[0]?.data;
    if (active === undefined && first !== undefined) void scena.commands.execute('ahp.openSession', { resource: first.resource });
  }, [nodes, active, scena]);

  if (connection?.status === 'failed') return <Alert tone="danger" title="Not connected" message={connection.error ?? 'The daemon refused the connection.'} />;
  if (connection?.status !== 'connected' && sessions === undefined) return <Spinner label="Connecting to the daemon" />;
  if (nodes.length === 0) return <Alert tone="info" message="No sessions yet." />;
  return (
    <Tree<SessionSummary>
      nodes={nodes}
      title="Sessions"
      selectedKey={active ?? null}
      onSelect={(node) => {
        if (node.data !== undefined) void scena.commands.execute('ahp.openSession', { resource: node.data.resource });
      }}
    />
  );
}
