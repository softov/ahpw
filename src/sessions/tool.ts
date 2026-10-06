import type { ToolCallState } from '@microsoft/agent-host-protocol';
import { folderLabel, textOf } from '../connection/words.js';

/** The `toolInput` keys that name what a call acts on, most telling first. */
const SUBJECT_KEYS = ['command', 'file_path', 'path', 'pattern', 'query', 'url', 'description'];

/** `_meta` keys ahpd writes on a call: when it started, ended, and how long it took. */
const STARTED = 'ahpd.startedAt';
const DURATION = 'ahpd.durationMs';

/** A call's `toolInput` parsed, or undefined when it is absent or not JSON. */
export function inputOf(call: ToolCallState): unknown {
  const raw = 'toolInput' in call ? call.toolInput : undefined;
  if (typeof raw !== 'string' || raw.trim() === '') return undefined;
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

/** The call's input as a person reads it: pretty JSON, or the raw text. */
export function inputText(call: ToolCallState): string {
  const parsed = inputOf(call);
  if (parsed === undefined) return '';
  return typeof parsed === 'string' ? parsed : JSON.stringify(parsed, null, 2);
}

/** What the call acts on, from its input: a command, a path, a pattern. */
export function subjectOf(call: ToolCallState): string {
  const parsed = inputOf(call);
  if (typeof parsed !== 'object' || parsed === null) return '';
  const bag = parsed as Record<string, unknown>;
  for (const key of SUBJECT_KEYS) {
    const value = bag[key];
    if (typeof value === 'string' && value.trim() !== '') return value.trim().split('\n')[0]!;
  }
  return '';
}

/** The one line a call shows collapsed: what it did, what it does, or what it acts on. */
export function lineOf(call: ToolCallState): string {
  const done = call.status === 'completed' || call.status === 'pending-result-confirmation' ? textOf(call.pastTenseMessage) : '';
  const said = done || textOf('invocationMessage' in call ? call.invocationMessage : undefined) || call.intention || '';
  const name = call.displayName || call.toolName;
  if (said !== '' && said !== name && said !== call.toolName) return said;
  const subject = subjectOf(call);
  return subject === '' ? name : `${name} ${subject}`;
}

/** How long the call took, when the host says. */
export function durationOf(call: ToolCallState): number | undefined {
  const meta = call._meta as Record<string, unknown> | undefined;
  const duration = meta?.[DURATION];
  return typeof duration === 'number' ? duration : undefined;
}

/** When the call started, as epoch milliseconds, when the host says. */
export function startedOf(call: ToolCallState): number | undefined {
  const meta = call._meta as Record<string, unknown> | undefined;
  const at = meta?.[STARTED];
  if (typeof at !== 'string') return undefined;
  const parsed = Date.parse(at);
  return Number.isNaN(parsed) ? undefined : parsed;
}

/** A call's state in one word, and how it reads at a glance. */
export type Outcome = 'preparing' | 'approval' | 'running' | 'sign-in' | 'review' | 'done' | 'failed' | 'cancelled';

export function outcomeOf(call: ToolCallState): Outcome {
  switch (call.status) {
    case 'streaming': return 'preparing';
    case 'pending-confirmation': return 'approval';
    case 'running': return 'running';
    case 'auth-required': return 'sign-in';
    case 'pending-result-confirmation': return 'review';
    case 'completed': return call.success ? 'done' : 'failed';
    case 'cancelled': return 'cancelled';
    default: return 'running';
  }
}

/** One piece of a call's output. */
export type Output =
  | { kind: 'text'; text: string }
  | { kind: 'terminal'; title: string; text: string; exitCode?: number; truncated: boolean }
  | { kind: 'file'; path: string; added?: number; removed?: number }
  | { kind: 'note'; text: string };

/** Strip ANSI escapes, which a terminal preview carries and a page cannot draw. */
// eslint-disable-next-line no-control-regex
const stripAnsi = (text: string): string => text.replace(/\u001b\[[0-9;?]*[ -/]*[@-~]/g, '');

/** What the call produced, in reading order. */
export function outputOf(call: ToolCallState): Output[] {
  const content = 'content' in call && Array.isArray(call.content) ? call.content : [];
  const out: Output[] = [];
  for (const item of content as unknown as Record<string, unknown>[]) {
    const kind = String(item['type'] ?? '');
    if (kind === 'text' && typeof item['text'] === 'string' && item['text'] !== '') out.push({ kind: 'text', text: item['text'] });
    else if (kind === 'terminal') {
      const result = item['result'] as { exitCode?: number; preview?: string; truncated?: boolean } | undefined;
      out.push({
        kind: 'terminal',
        title: String(item['title'] ?? 'Terminal'),
        text: stripAnsi(result?.preview ?? ''),
        ...(result?.exitCode === undefined ? {} : { exitCode: result.exitCode }),
        truncated: result?.truncated === true,
      });
    } else if (kind === 'fileEdit') {
      const side = (item['after'] ?? item['before']) as { uri?: string } | undefined;
      const diff = item['diff'] as { added?: number; removed?: number } | undefined;
      out.push({
        kind: 'file',
        path: folderLabel(side?.uri ?? ''),
        ...(diff?.added === undefined ? {} : { added: diff.added }),
        ...(diff?.removed === undefined ? {} : { removed: diff.removed }),
      });
    } else if (kind === 'subagent') out.push({ kind: 'note', text: `Ran ${String(item['agentName'] ?? item['title'] ?? 'a subagent')}` });
    else if (kind === 'resource') out.push({ kind: 'note', text: `Read ${folderLabel(String(item['uri'] ?? ''))}` });
  }
  if (call.status === 'completed' || call.status === 'pending-result-confirmation') {
    if (call.error !== undefined) out.push({ kind: 'note', text: call.error.message });
  }
  if (call.status === 'cancelled') {
    const reason = textOf(call.reasonMessage) || ({ denied: 'Denied.', skipped: 'Skipped.', 'result-denied': 'Result rejected.' } as Record<string, string>)[String(call.reason)] || 'Cancelled.';
    out.push({ kind: 'note', text: reason });
  }
  return out;
}
