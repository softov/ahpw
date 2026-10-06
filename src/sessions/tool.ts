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

/** The file a call reads or writes, from its input, as a `file://` URI. */
export function fileOf(call: ToolCallState): string | undefined {
  const parsed = inputOf(call);
  if (typeof parsed !== 'object' || parsed === null) return undefined;
  const bag = parsed as Record<string, unknown>;
  for (const key of ['file_path', 'notebook_path', 'path']) {
    const value = bag[key];
    if (typeof value === 'string' && value.startsWith('/')) return `file://${value}`;
  }
  return undefined;
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

/** What sort of thing a call does, which picks its icon. */
export type ToolKind = 'terminal' | 'read' | 'search' | 'edit' | 'subagent' | 'web' | 'other';

/** Harness tool names by kind, for a host that does not say in `_meta.toolKind`. */
const KINDS: Record<string, ToolKind> = {
  Bash: 'terminal', terminal: 'terminal', shell: 'terminal',
  Read: 'read', read_file: 'read', NotebookRead: 'read',
  Glob: 'search', Grep: 'search', WebSearch: 'search', search: 'search',
  Edit: 'edit', MultiEdit: 'edit', Write: 'edit', NotebookEdit: 'edit', write_file: 'edit', edit_file: 'edit',
  Task: 'subagent', Agent: 'subagent',
  WebFetch: 'web', fetch: 'web',
};

export function kindOf(call: ToolCallState): ToolKind {
  const said = (call._meta as Record<string, unknown> | undefined)?.['toolKind'];
  if (said === 'terminal' || said === 'read' || said === 'search' || said === 'subagent') return said;
  const named = KINDS[call.toolName];
  if (named !== undefined) return named;
  const content = 'content' in call && Array.isArray(call.content) ? call.content as unknown as { type?: string }[] : [];
  if (content.some((item) => item.type === 'fileEdit')) return 'edit';
  if (content.some((item) => item.type === 'terminal')) return 'terminal';
  return 'other';
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
  | { kind: 'file'; path: string; file: string; before?: string; after?: string; added?: number; removed?: number }
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
      type Side = { uri?: string; content?: { uri?: string } } | undefined;
      const before = item['before'] as Side;
      const after = item['after'] as Side;
      const file = after?.uri ?? before?.uri ?? '';
      const diff = item['diff'] as { added?: number; removed?: number } | undefined;
      out.push({
        kind: 'file',
        path: folderLabel(file),
        file,
        ...(before?.content?.uri === undefined ? {} : { before: before.content.uri }),
        ...(after?.content?.uri === undefined ? {} : { after: after.content.uri }),
        ...(diff?.added === undefined ? {} : { added: diff.added }),
        ...(diff?.removed === undefined ? {} : { removed: diff.removed }),
      });
    } else if (kind === 'subagent') out.push({ kind: 'note', text: `Ran ${String(item['agentName'] ?? item['title'] ?? 'a subagent')}` });
    else if (kind === 'resource') out.push({ kind: 'note', text: `Read ${folderLabel(String(item['uri'] ?? ''))}` });
  }
  if (call.status === 'completed' || call.status === 'pending-result-confirmation') {
    // A failed call often carries its error as its output too; say it once.
    const message = call.error?.message.trim();
    const said = out.some((one) => (one.kind === 'text' || one.kind === 'terminal') && message !== undefined && one.text.includes(message));
    if (message !== undefined && message !== '' && !said) out.push({ kind: 'note', text: message });
  }
  if (call.status === 'cancelled') {
    const reason = textOf(call.reasonMessage) || ({ denied: 'Denied.', skipped: 'Skipped.', 'result-denied': 'Result rejected.' } as Record<string, string>)[String(call.reason)] || 'Cancelled.';
    out.push({ kind: 'note', text: reason });
  }
  return out;
}

/** A piece of a call's line: plain text, or text that names a file. */
export type Segment = { text: string; href?: string; code?: true };

/** Markdown links and code spans, the two ways a host marks a file in a line. */
const MARKED = /\[([^\]]+)\]\(([^)\s]+)\)|`([^`]+)`/g;

/**
 * A call's line cut into pieces, each file it names a piece with an `href`:
 * the host's markdown links, its code spans, and otherwise the call's own file
 * where the line spells out its path.
 */
export function segmentsOf(line: string, file: string | undefined): Segment[] {
  const out: Segment[] = [];
  let at = 0;
  for (const match of line.matchAll(MARKED)) {
    if (match.index > at) out.push({ text: line.slice(at, match.index) });
    if (match[1] !== undefined) out.push({ text: match[1], href: match[2]! });
    else out.push({ text: match[3]!, href: match[3]!, code: true });
    at = match.index + match[0].length;
  }
  if (out.length > 0) {
    if (at < line.length) out.push({ text: line.slice(at) });
    return out;
  }
  const path = file?.replace(/^file:\/\//, '');
  const found = path === undefined ? -1 : line.indexOf(path);
  if (path === undefined || found < 0) return [{ text: line }];
  return [
    ...(found > 0 ? [{ text: line.slice(0, found) }] : []),
    { text: path, href: file! },
    ...(found + path.length < line.length ? [{ text: line.slice(found + path.length) }] : []),
  ];
}
