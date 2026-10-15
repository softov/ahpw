/**
 * Every frame on the daemon's socket, read into the page's log.
 *
 * Each frame is a `traffic` line, at `debug`, with the frame itself kept as the
 * line's detail. A few frames also say something a person looks for, and those
 * get a line of their own in the scope they are about:
 *
 * - a request the host refused: an error, in the scope of what was asked for;
 * - an action the host rejected: a warning;
 * - a session or chat event (created, failed, turn done, error): `session`;
 * - a terminal event (opened, closed, a command run and how it ended): `terminal`.
 *
 * The requests in flight are remembered by id, so a refusal can say
 * what it refused. Pure apart from the log it writes and that memory.
 */

import type { AhpTransport } from '@microsoft/agent-host-protocol/client';
import { logEvent, type LogLevel, type LogScope } from './log.js';

/** Frames longer than this are kept cut, so one huge snapshot does not hold megabytes. */
const KEEP = 64 * 1024;

type Bag = Record<string, unknown>;

function bag(value: unknown): Bag {
  return typeof value === 'object' && value !== null && !Array.isArray(value) ? value as Bag : {};
}

function str(value: unknown): string | null {
  return typeof value === 'string' && value !== '' ? value : null;
}

/** What the page has asked and not yet heard back about, by request id. */
const asked = new Map<string, { method: string; params: Bag }>();
/** The terminals the host listed last, to say which ones came and went; null before the first list. */
let listed: Map<string, string> | null = null;

/** The session a chat channel belongs to: `ahp-chat://…/<base64 of the session URI>`. */
export function sessionOfChannel(channel: string): string | null {
  if (!channel.startsWith('ahp-chat:')) return null;
  const last = channel.split('/').pop() ?? '';
  try {
    const decoded = atob(last.replace(/-/g, '+').replace(/_/g, '/'));
    return /^[a-z][a-z0-9+.-]*:/i.test(decoded) ? decoded : null;
  } catch {
    return null;
  }
}

/** Which scope a request belongs to, from its method and what it names. */
function scopeOfRequest(method: string, params: Bag): LogScope {
  const target = `${method} ${str(params.resource) ?? ''} ${str(params.channel) ?? ''}`.toLowerCase();
  if (target.includes('terminal')) return 'terminal';
  if (target.includes('session') || target.includes('chat') || str(params.session) !== null) return 'session';
  return 'connection';
}

/** The one line a frame is summarised to. */
function summary(direction: 'sent' | 'received', frame: Bag): string {
  const arrow = direction === 'sent' ? '→' : '←';
  const method = str(frame.method);
  const params = bag(frame.params);
  if (method === 'action') {
    const action = bag(params.action);
    return `${arrow} ${str(action.type) ?? 'action'} ${str(params.channel) ?? ''}`.trim();
  }
  if (method !== null) {
    const what = str(params.resource) ?? str(params.channel) ?? str(params.session) ?? '';
    return `${arrow} ${method}${frame.id === undefined ? '' : ` #${String(frame.id)}`} ${what}`.trim();
  }
  if (frame.error !== undefined) return `${arrow} error #${String(frame.id)} ${str(bag(frame.error).message) ?? ''}`.trim();
  return `${arrow} result #${String(frame.id)}`;
}

/** The session and terminal events worth a line of their own. */
function actionLine(envelope: Bag): void {
  const action = bag(envelope.action);
  const type = str(action.type) ?? '';
  const channel = str(envelope.channel) ?? '';
  const session = sessionOfChannel(channel) ?? (channel.includes('session') ? channel : null);
  const say = (scope: LogScope, level: LogLevel, text: string) =>
    logEvent({ scope, level, text, detail: envelope });

  const rejected = str(envelope.rejectionReason);
  if (rejected !== null) {
    say(type.startsWith('terminal/') ? 'terminal' : 'session', 'warn', `${type} rejected: ${rejected} · ${channel}`);
    return;
  }
  switch (type) {
    case 'session/ready':
      say('session', 'info', `ready ${session ?? channel}`);
      return;
    case 'session/creationFailed':
      say('session', 'error', `creation failed: ${str(bag(action.error).message) ?? str(action.message) ?? ''} ${session ?? channel}`);
      return;
    case 'session/titleChanged':
      say('session', 'info', `title "${str(action.title) ?? ''}" ${session ?? channel}`);
      return;
    case 'chat/turnStarted':
      say('session', 'info', `turn started ${session ?? channel}`);
      return;
    case 'chat/turnComplete':
      say('session', 'info', `turn complete ${session ?? channel}`);
      return;
    case 'chat/turnCancelled':
      say('session', 'warn', `turn cancelled ${session ?? channel}`);
      return;
    case 'chat/error':
      say('session', 'error', `${str(bag(action.error).message) ?? str(action.message) ?? 'error'} ${session ?? channel}`);
      return;
    case 'terminal/commandExecuted':
      say('terminal', 'info', `$ ${str(action.commandLine) ?? ''} · ${channel}`);
      return;
    case 'terminal/commandFinished': {
      const code = typeof action.exitCode === 'number' ? action.exitCode : null;
      say('terminal', code !== null && code !== 0 ? 'warn' : 'info', `command finished${code === null ? '' : ` · exit ${code}`} · ${channel}`);
      return;
    }
    case 'terminal/exited': {
      const code = typeof action.exitCode === 'number' ? action.exitCode : null;
      say('terminal', 'info', `exited${code === null ? '' : ` ${code}`} · ${channel}`);
      return;
    }
    case 'terminal/claimed': {
      const claim = bag(action.claim);
      const by = str(claim.session) ?? (claim.kind === 'client' ? `client ${str(claim.clientId) ?? ''}` : '');
      say('terminal', 'info', `claimed by ${by} · ${channel}`);
      return;
    }
    case 'root/terminalsChanged': {
      const next = new Map<string, string>();
      for (const one of Array.isArray(action.terminals) ? action.terminals : []) {
        const info = bag(one);
        const resource = str(info.resource);
        if (resource !== null) next.set(resource, str(info.title) ?? '');
      }
      const before = listed;
      listed = next;
      if (before === null) return;
      for (const [resource, title] of next) {
        if (!before.has(resource)) say('terminal', 'info', `opened ${title === '' ? '' : `${title} `}${resource}`);
      }
      for (const [resource, title] of before) {
        if (!next.has(resource)) say('terminal', 'info', `closed ${title === '' ? '' : `${title} `}${resource}`);
      }
      return;
    }
    default:
  }
}

/** What the log shows in place of a credential. */
const HIDDEN = '••••••';

/**
 * A frame with its credential masked, or the frame itself when it carries none.
 * `authenticate` sends a resource's token in `params.token`, and the log is
 * readable by anyone at the screen.
 */
function masked(frame: Bag): Bag {
  const params = bag(frame.params);
  if (frame.method !== 'authenticate' || typeof params.token !== 'string') return frame;
  return { ...frame, params: { ...params, token: HIDDEN } };
}

/** One frame, either way. */
export function noteFrame(direction: 'sent' | 'received', text: string): void {
  let frame: Bag;
  try {
    frame = bag(JSON.parse(text));
  } catch {
    logEvent({ scope: 'traffic', level: 'debug', text: `${direction === 'sent' ? '→' : '←'} ${text.slice(0, 120)}`, detail: text.slice(0, KEEP) });
    return;
  }
  const shown = masked(frame);
  if (shown !== frame) {
    frame = shown;
    text = JSON.stringify(shown);
  }
  logEvent({ scope: 'traffic', level: 'debug', text: summary(direction, frame), detail: text.length > KEEP ? text.slice(0, KEEP) : text });

  const id = frame.id === undefined || frame.id === null ? null : String(frame.id);
  const method = str(frame.method);
  if (direction === 'sent') {
    if (id !== null && method !== null) asked.set(id, { method, params: bag(frame.params) });
    return;
  }
  if (method === 'action') {
    actionLine(bag(frame.params));
    return;
  }
  if (id === null || method !== null) return;
  const request = asked.get(id);
  asked.delete(id);
  if (frame.error === undefined) return;
  const error = bag(frame.error);
  const what = request === undefined ? `#${id}` : `${request.method} ${str(request.params.resource) ?? str(request.params.channel) ?? ''}`.trim();
  logEvent({
    scope: request === undefined ? 'connection' : scopeOfRequest(request.method, request.params),
    level: 'error',
    text: `${what} refused: ${str(error.message) ?? 'error'}${typeof error.code === 'number' ? ` (${error.code})` : ''}`,
    detail: { request: request ?? null, error: frame.error },
  });
}

/** A socket closed: what it had asked is not going to be answered on it. */
export function forgetFrames(): void {
  asked.clear();
}

/**
 * The same transport, with each frame noted on its way past. A frame is passed
 * on untouched, so a bug here loses a log line, never the connection.
 */
export function observing(inner: AhpTransport): AhpTransport {
  return {
    send: (message) => {
      noteFrame('sent', typeof message === 'string' ? message : JSON.stringify(message));
      return inner.send(message);
    },
    close: () => inner.close(),
    async recv() {
      const frame = await inner.recv();
      if (frame?.kind === 'text') noteFrame('received', frame.text);
      else if (frame?.kind === 'parsed') noteFrame('received', JSON.stringify(frame.message));
      return frame;
    },
  };
}
