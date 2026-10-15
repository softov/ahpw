import { expect, test } from 'vitest';
import type { SessionSummary } from '@microsoft/agent-host-protocol';
import { alertId, eventOf, noticeOf } from './alerts.js';

test('a session that starts waiting needs you, from any activity', () => {
  expect(eventOf('running', 'input')).toBe('needs-you');
  expect(eventOf('idle', 'input')).toBe('needs-you');
});

test('a turn that ends finishes or fails', () => {
  expect(eventOf('running', 'idle')).toBe('finished');
  expect(eventOf('input', 'idle')).toBe('finished');
  expect(eventOf('running', 'error')).toBe('failed');
});

test('a first sight, no change, a start and an idle session erroring say nothing', () => {
  expect(eventOf(undefined, 'input')).toBeNull();
  expect(eventOf('running', 'running')).toBeNull();
  expect(eventOf('idle', 'running')).toBeNull();
  expect(eventOf('input', 'running')).toBeNull();
  expect(eventOf('idle', 'error')).toBeNull();
});

test('the notice names the session, opens it, and carries a browser alert', () => {
  const session = { resource: 'ahp-session://a', title: 'Fix the build' } as SessionSummary;
  const notice = noticeOf(session, 'needs-you');
  expect(notice).toMatchObject({ id: alertId('ahp-session://a'), type: 'attention', title: 'Fix the build needs you', dismissAuto: false, alert: { title: 'Fix the build', body: 'Needs you' } });
  expect(notice.actions?.[0]).toMatchObject({ command: 'ahp.openSession', args: { resource: 'ahp-session://a' } });
  expect(noticeOf({ ...session, title: '' }, 'finished')).toMatchObject({ type: 'action.finished', tone: 'success', title: 'Untitled finished' });
});
