import type { ReactElement } from 'react';
import { useStore } from '@softov/scena/react';
import { Alert, Badge, DetailList, Text, type DetailItem } from '@softov/scena/ui';
import type { SessionSummary } from '@microsoft/agent-host-protocol';
import { AHP_SESSIONS } from './data.js';
import { ACTIVITY_LABEL, ACTIVITY_TONE, activityOf } from './status.js';

const when = (iso: string): string => {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? iso : date.toLocaleString();
};

/** One session, as its summary says it. */
export default function SessionPage({ resource }: { resource?: string }): ReactElement {
  const sessions = useStore<SessionSummary[]>(AHP_SESSIONS);
  const session = sessions?.find((one) => one.resource === resource);
  if (session === undefined) return <Alert tone="warning" message="This session is gone." />;
  const activity = activityOf(session.status);
  const items: DetailItem[] = [
    { label: 'Status', value: <Badge tone={ACTIVITY_TONE[activity]} text={ACTIVITY_LABEL[activity]} /> },
    { label: 'Agent', value: session.provider },
    ...(session.activity === undefined ? [] : [{ label: 'Doing', value: session.activity }]),
    ...(session.project === undefined ? [] : [{ label: 'Project', value: session.project.displayName }]),
    ...(session.workingDirectories === undefined || session.workingDirectories.length === 0
      ? []
      : [{ label: 'Folders', value: session.workingDirectories.join('\n'), span: true }]),
    { label: 'Started', value: when(session.createdAt) },
    { label: 'Changed', value: when(session.modifiedAt) },
    ...(session.chats === undefined ? [] : [{ label: 'Chats', value: String(session.chats.length) }]),
  ];
  return (
    <div className="web-page">
      <Text variant="h2" text={session.title === "" ? "Untitled" : session.title} />
      <DetailList items={items} columns={2} />
    </div>
  );
}
