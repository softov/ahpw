import { terminalReducer, type TerminalAction, type TerminalClaim, type TerminalContentPart, type TerminalInfo, type TerminalState } from '@microsoft/agent-host-protocol';

function bag(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {};
}

function str(value: unknown): string | null {
  return typeof value === 'string' && value !== '' ? value : null;
}

function num(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

/** One part's text: a `command` part's `output`, any other part's `value`. */
function partText(part: TerminalContentPart): string {
  if (part.type === 'command') return typeof part.output === 'string' ? part.output : '';
  return typeof part.value === 'string' ? part.value : '';
}

/** The raw stream the parts hold, as the protocol joins them. */
export function joinParts(content: readonly TerminalContentPart[]): string {
  let out = '';
  for (const part of content) out += partText(part);
  return out;
}

/**
 * A snapshot with the fields `terminalReducer` reads filled in: `content`,
 * `lifecycle` and `claim`. Everything else stays as the host sent it.
 */
export function normalizeState(raw: unknown): TerminalState {
  const held = bag(raw);
  const lifecycle = bag(held.lifecycle);
  const exitCode = num(lifecycle.exitCode);
  return {
    ...(held as object),
    title: str(held.title) ?? '',
    content: Array.isArray(held.content) ? (held.content as TerminalContentPart[]) : [],
    // `TerminalLifecycleStatus` is a `const enum`, so the wire strings are spelled.
    lifecycle: (str(lifecycle.status) === 'exited'
      ? { status: 'exited', ...(exitCode === null ? {} : { exitCode }) }
      : { status: 'running' }) as TerminalState['lifecycle'],
    claim: isClaim(held.claim) ? held.claim : clientClaim(''),
  } as TerminalState;
}

/** Fold one action into a terminal's state; the reducer `follow` takes. */
export function foldTerminal(state: unknown, action: unknown): TerminalState {
  return terminalReducer(normalizeState(state), action as TerminalAction);
}

export function isClaim(value: unknown): value is TerminalClaim {
  const kind = str(bag(value).kind);
  return kind === 'client' || kind === 'session';
}

/** The claim this client makes on a terminal it creates. */
export function clientClaim(clientId: string): TerminalClaim {
  return { kind: 'client', clientId } as TerminalClaim;
}

/** Who holds a terminal's keyboard: this client, a session's tool call, or another client. */
export type Holder = { kind: 'you' } | { kind: 'session'; session: string } | { kind: 'another' };

export function holderOf(claim: unknown, clientId: string | null): Holder {
  const held = bag(claim);
  if (held.kind === 'session') return { kind: 'session', session: str(held.session) ?? '' };
  if (held.kind === 'client' && clientId !== null && held.clientId === clientId) return { kind: 'you' };
  return { kind: 'another' };
}

export function hasExited(info: Pick<TerminalInfo, 'lifecycle'>): boolean {
  return bag(info.lifecycle).status === 'exited';
}

/** The exit code a finished terminal named, or null. */
export function exitCodeOf(info: Pick<TerminalInfo, 'lifecycle'>): number | null {
  return num(bag(info.lifecycle).exitCode);
}

let counter = 0;

/** A new terminal URI, chosen by this client. */
export function newTerminalUri(): string {
  counter += 1;
  return `ahp-terminal:/${Date.now().toString(36)}-${counter.toString(36)}`;
}

/**
 * What to write to the screen to go from `drawn` to `next`: the new tail, or
 * the whole of `next` after a reset when it no longer starts with `drawn`
 * (cleared, or trimmed by the host).
 */
export function deltaOf(drawn: string, next: string): { reset: boolean; text: string } {
  if (next.startsWith(drawn)) return { reset: false, text: next.slice(drawn.length) };
  return { reset: true, text: next };
}

/** A terminal's name as a tab or a row shows it. */
export function terminalTitle(info: { title?: string; resource?: string }): string {
  return info.title !== undefined && info.title !== '' ? info.title : 'Terminal';
}
