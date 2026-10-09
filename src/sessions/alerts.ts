import type { Disposable, Scena } from '@softov/scena/types';
import type { SessionSummary } from '@microsoft/agent-host-protocol';
import { AHP_SESSIONS } from '../connection/data.js';
import { tryNotify } from '../notify/index.js';
import { DISMISS_SLOW_MS, type NotificationInput } from '../notify/types.js';
import { EMOJIcon } from '../emojis.js';
import { ACTIVE_SESSION } from './state.js';
import { activityOf, type Activity } from './status.js';

/** A change in a session worth telling somebody about. */
export type SessionEvent = 'needs-you' | 'finished' | 'failed';

/** The id a session's notification is kept under, so a later one replaces it. */
export const alertId = (resource: string): string => `session-alert:${resource}`;

/** What happened to a session between two activities, or null for nothing worth saying. */
export function eventOf(before: Activity | undefined, after: Activity): SessionEvent | null {
  if (before === undefined || before === after) return null;
  if (after === 'input') return 'needs-you';
  if (before !== 'running' && before !== 'input') return null;
  if (after === 'idle') return 'finished';
  if (after === 'error') return 'failed';
  return null;
}

/** The notification for an event in a session. */
export function noticeOf(session: SessionSummary, event: SessionEvent): NotificationInput {
  const name = session.title === '' ? 'Untitled' : session.title;
  const open = [{ label: 'Open', command: 'ahp.openSession', args: { resource: session.resource } }];
  const common = { id: alertId(session.resource), source: alertId(session.resource), actions: open };
  if (event === 'needs-you') {
    return { ...common, type: 'attention', tone: 'warning', icon: EMOJIcon.warning, title: `${name} needs you`, dismissAuto: false, alert: { title: name, body: 'Needs you' } };
  }
  if (event === 'failed') {
    return { ...common, type: 'action.finished', tone: 'danger', icon: EMOJIcon.warning, title: `${name} failed`, dismissTime: DISMISS_SLOW_MS, alert: { title: name, body: 'Failed' } };
  }
  return { ...common, type: 'action.finished', tone: 'success', icon: EMOJIcon.check, title: `${name} finished`, dismissTime: DISMISS_SLOW_MS, alert: { title: name, body: 'Finished' } };
}

/** Whether somebody is looking at this session right now. */
function watched(scena: Scena, resource: string): boolean {
  return scena.store.get<string>(ACTIVE_SESSION) === resource
    && document.visibilityState === 'visible'
    && document.hasFocus();
}

/**
 * Says when a session starts waiting for somebody, and when its turn ends. The
 * first list is only remembered: what was already so when the page opened is
 * not news.
 */
export function watchSessions(scena: Scena): Disposable {
  let known: Map<string, Activity> | null = null;
  return scena.store.subscribe(AHP_SESSIONS, () => {
    const sessions = scena.store.get<SessionSummary[]>(AHP_SESSIONS);
    if (sessions === undefined) return;
    const next = new Map(sessions.map((one) => [one.resource, activityOf(one.status)]));
    const before = known;
    known = next;
    if (before === null) return;
    for (const session of sessions) {
      const after = next.get(session.resource)!;
      const was = before.get(session.resource);
      // Waiting no longer: the question was answered, here or elsewhere.
      if (was === 'input' && after !== 'input') tryNotify((notifications) => notifications.dismiss(alertId(session.resource)));
      const event = eventOf(was, after);
      if (event === null || watched(scena, session.resource)) continue;
      tryNotify((notifications) => notifications.publish(noticeOf(session, event)));
    }
  });
}
