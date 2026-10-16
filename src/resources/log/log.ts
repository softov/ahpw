import { useSyncExternalStore } from 'react';

/**
 * The page's log: what happened on the daemon's socket, as lines a person can filter.
 *
 * A module store rather than the scena store, because the transport that writes
 * most of it runs outside React and writes a line per frame. Kept while the page
 * is open and capped, traffic apart from the rest so a busy socket cannot push a
 * refusal out of the window.
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
export type LogScope = 'connection' | 'session' | 'terminal' | 'traffic';

export const LOG_SCOPES: readonly LogScope[] = ['connection', 'session', 'terminal', 'traffic'];
export const LOG_LEVELS: readonly LogLevel[] = ['debug', 'info', 'warn', 'error'];

/** One line. */
export interface LogEntry {
  /** Unique while the page is open. */
  id: string;
  /** Epoch milliseconds. */
  at: number;
  level: LogLevel;
  scope: LogScope;
  /** The line as read; URIs in it are drawn as links. */
  text: string;
  /** What the line is about, opened in place. A string is a frame as it came off the wire. */
  detail?: unknown;
}

/** Lines kept apart from traffic. */
export const LOG_CAP = 2000;
/** Traffic lines kept, the oldest dropped first. */
export const WIRE_CAP = 1024;

let lines: LogEntry[] = [];
let wire: LogEntry[] = [];
let merged: LogEntry[] | null = null;
let serial = 0;
const listeners = new Set<() => void>();
let pending = false;

/** Readers hear about new lines at most every 50ms: a streaming turn is hundreds of frames. */
function emit(): void {
  merged = null;
  if (pending) return;
  pending = true;
  setTimeout(() => {
    pending = false;
    for (const listener of listeners) listener();
  }, 50);
}

/** Write one line. */
export function logEvent(entry: Omit<LogEntry, 'id' | 'at'> & { at?: number }): void {
  serial += 1;
  const line: LogEntry = { ...entry, id: `l${serial}`, at: entry.at ?? Date.now() };
  if (line.scope === 'traffic') {
    wire = wire.length >= WIRE_CAP ? [...wire.slice(wire.length - WIRE_CAP + 1), line] : [...wire, line];
  } else {
    lines = lines.length >= LOG_CAP ? [...lines.slice(lines.length - LOG_CAP + 1), line] : [...lines, line];
  }
  emit();
}

/** Forget every line. */
export function clearLog(): void {
  lines = [];
  wire = [];
  emit();
}

/** Every line, oldest first. */
export function logLines(): LogEntry[] {
  if (merged === null) {
    merged = [...lines, ...wire].sort((a, b) => a.at - b.at || Number(a.id.slice(1)) - Number(b.id.slice(1)));
  }
  return merged;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Every line, oldest first, read again as lines are written. */
export function useLog(): LogEntry[] {
  return useSyncExternalStore(subscribe, logLines, logLines);
}

/** What the reader narrowed the log to. */
export interface LogFilter {
  /** The scopes shown; empty is all of them. */
  scopes: readonly LogScope[];
  /** The least severe level shown. */
  minLevel: LogLevel;
  /** Words the line must hold, and `!words` it must not, as VS Code's output filter reads them. */
  query: string;
}

/** The lines a filter keeps. */
export function filterLog(entries: readonly LogEntry[], filter: LogFilter): LogEntry[] {
  const floor = LOG_LEVELS.indexOf(filter.minLevel);
  const terms = filter.query.split(/\s+/).filter((one) => one !== '' && one !== '!');
  const want = terms.filter((one) => !one.startsWith('!')).map((one) => one.toLowerCase());
  const avoid = terms.filter((one) => one.startsWith('!')).map((one) => one.slice(1).toLowerCase());
  return entries.filter((entry) => {
    if (filter.scopes.length > 0 && !filter.scopes.includes(entry.scope)) return false;
    if (LOG_LEVELS.indexOf(entry.level) < floor) return false;
    if (want.length === 0 && avoid.length === 0) return true;
    const text = entry.text.toLowerCase();
    return want.every((one) => text.includes(one)) && !avoid.some((one) => text.includes(one));
  });
}

/** A piece of a line: words, or a URI that may open something. */
export type LogPiece = { kind: 'text'; text: string } | { kind: 'uri'; text: string };

/** A URI in a line: a scheme, then a path, up to a space or closing punctuation. */
const URI = /\b[a-z][a-z0-9+.-]*:\/{1,3}[^\s"'`<>()[\]{},]+/gi;

/** A line cut into its words and its URIs. */
export function piecesOf(text: string): LogPiece[] {
  const pieces: LogPiece[] = [];
  let last = 0;
  for (const match of text.matchAll(URI)) {
    const at = match.index;
    // A trailing full stop or colon ends the sentence, not the URI.
    const uri = match[0].replace(/[.:;]+$/, '');
    if (at > last) pieces.push({ kind: 'text', text: text.slice(last, at) });
    pieces.push({ kind: 'uri', text: uri });
    last = at + uri.length;
  }
  if (last < text.length) pieces.push({ kind: 'text', text: text.slice(last) });
  return pieces;
}

/** `19:50:46.977`, local time. */
export function clock(at: number): string {
  const when = new Date(at);
  const two = (n: number): string => String(n).padStart(2, '0');
  return `${two(when.getHours())}:${two(when.getMinutes())}:${two(when.getSeconds())}.${String(when.getMilliseconds()).padStart(3, '0')}`;
}

/** One line as plain text. */
export const lineText = (entry: LogEntry): string =>
  `${new Date(entry.at).toISOString().replace('T', ' ').replace('Z', '')} [${entry.level}] [${entry.scope}] ${entry.text}`;

/** The lines as plain text, one per line, for a copy of what is shown. */
export const logText = (entries: readonly LogEntry[]): string => entries.map(lineText).join('\n');
