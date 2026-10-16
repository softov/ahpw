import { translate } from '@softov/scena';
import type { Disposable, Scena } from '@softov/scena/types';
import type { SessionSummary } from '@microsoft/agent-host-protocol';
import { ahpPaths } from '../../bridges/data.js';
import { onEachHost } from '../../bridges/hosts.js';
import { tryNotify } from '../../shell/notify/index.js';
import { DISMISS_SLOW_MS, type NotificationInput } from '../../shell/notify/types.js';
import { EMOJIcon } from '../emojis.js';
import { ACTIVE_SESSION, type ActiveSession } from './state.js';
import { activityOf, type Activity } from './status.js';

/** A change in a session worth telling somebody about. */
export type SessionEvent = 'needs-you' | 'finished' | 'failed';

/** The id the notification of a session on the host `host` is kept under, so a later one replaces it. */
export const alertId = (host: string, resource: string): string => `session-alert:${host}:${resource}`;

/** What happened to a session between two activities, or null for nothing worth saying. */
export function eventOf(before: Activity | undefined, after: Activity): SessionEvent | null {
  if (before === undefined || before === after) return null;
  if (after === 'input') return 'needs-you';
  if (before !== 'running' && before !== 'input') return null;
  if (after === 'idle') return 'finished';
  if (after === 'error') return 'failed';
  return null;
}

/** The notification for an event in a session on the host `host`. */
export function noticeOf(host: string, session: SessionSummary, event: SessionEvent): NotificationInput {
  const name = session.title === '' ? translate('sessions/untitled') : session.title;
  const open = [{ label: translate('sessions/alerts/open'), command: 'ahp.openSession', args: { host, resource: session.resource } }];
  const common = { id: alertId(host, session.resource), source: alertId(host, session.resource), actions: open };
  if (event === 'needs-you') {
    return { ...common, type: 'attention', tone: 'warning', icon: EMOJIcon.warning, title: translate('sessions/alerts/needsYou', { name }), dismissAuto: false, alert: { title: name, body: translate('sessions/status/input') } };
  }
  if (event === 'failed') {
    return { ...common, type: 'action.finished', tone: 'danger', icon: EMOJIcon.warning, title: translate('sessions/alerts/failed', { name }), dismissTime: DISMISS_SLOW_MS, alert: { title: name, body: translate('sessions/status/error') } };
  }
  return { ...common, type: 'action.finished', tone: 'success', icon: EMOJIcon.check, title: translate('sessions/alerts/finished', { name }), dismissTime: DISMISS_SLOW_MS, alert: { title: name, body: translate('sessions/alerts/finishedBody') } };
}

/** Whether somebody is looking at this session right now. */
function watched(scena: Scena, host: string, resource: string): boolean {
  const active = scena.store.get<ActiveSession>(ACTIVE_SESSION);
  return active?.host === host && active.resource === resource
    && document.visibilityState === 'visible'
    && document.hasFocus();
}

/**
 * Says when a session starts waiting for somebody, and when its turn ends. The
 * first list is only remembered: what was already so when the page opened is
 * not news.
 */
export function watchSessions(scena: Scena): Disposable {
  return onEachHost(scena, (host) => watchHostSessions(scena, host));
}

function watchHostSessions(scena: Scena, host: string): Disposable {
  let known: Map<string, Activity> | null = null;
  return scena.store.subscribe(ahpPaths(host).sessions, () => {
    const sessions = scena.store.get<SessionSummary[]>(ahpPaths(host).sessions);
    if (sessions === undefined) return;
    const next = new Map(sessions.map((one) => [one.resource, activityOf(one.status)]));
    const before = known;
    known = next;
    if (before === null) return;
    for (const session of sessions) {
      const after = next.get(session.resource)!;
      const was = before.get(session.resource);
      // Waiting no longer: the question was answered, here or elsewhere.
      if (was === 'input' && after !== 'input') tryNotify((notifications) => notifications.dismiss(alertId(host, session.resource)));
      const event = eventOf(was, after);
      if (event === null || watched(scena, host, session.resource)) continue;
      tryNotify((notifications) => notifications.publish(noticeOf(host, session, event)));
    }
  });
}
