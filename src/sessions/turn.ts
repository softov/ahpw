import type { ActiveTurn, Turn } from '@microsoft/agent-host-protocol';

/** What a turn says about itself, beyond its text. */
export interface TurnFacts {
  startedAt?: number;
  duration?: number;
  model?: string;
  input?: number;
  output?: number;
  cacheRead?: number;
  tools: number;
}

/** A model as people name it: the selection's id, or the one usage reports. */
const modelOf = (turn: Turn | ActiveTurn): string | undefined => turn.message.model?.id ?? turn.usage?.model;

export function factsOf(turn: Turn | ActiveTurn): TurnFacts {
  const started = turn.startedAt === undefined ? Number.NaN : Date.parse(turn.startedAt);
  const model = modelOf(turn);
  const usage = turn.usage;
  return {
    ...(Number.isNaN(started) ? {} : { startedAt: started }),
    ...('duration' in turn && typeof turn.duration === 'number' ? { duration: turn.duration } : {}),
    ...(model === undefined ? {} : { model }),
    ...(usage?.inputTokens === undefined ? {} : { input: usage.inputTokens }),
    ...(usage?.outputTokens === undefined ? {} : { output: usage.outputTokens }),
    ...(usage?.cacheReadTokens === undefined ? {} : { cacheRead: usage.cacheReadTokens }),
    tools: turn.responseParts.filter((part) => String(part.kind) === 'toolCall').length,
  };
}

/** A token count as `950`, `12.3k` or `1.2M`. */
export function tokens(count: number): string {
  if (count < 1000) return String(count);
  if (count < 1_000_000) return `${(count / 1000).toFixed(count < 10_000 ? 1 : 0)}k`;
  return `${(count / 1_000_000).toFixed(1)}M`;
}

/** What every loaded turn adds up to. */
export interface Totals {
  turns: number;
  working: number;
  input: number;
  output: number;
  tools: number;
  models: string[];
}

export function totalsOf(turns: readonly Turn[]): Totals {
  const models = new Set<string>();
  const totals: Totals = { turns: turns.length, working: 0, input: 0, output: 0, tools: 0, models: [] };
  for (const turn of turns) {
    const facts = factsOf(turn);
    totals.working += facts.duration ?? 0;
    totals.input += facts.input ?? 0;
    totals.output += facts.output ?? 0;
    totals.tools += facts.tools;
    if (facts.model !== undefined) models.add(facts.model);
  }
  totals.models = [...models];
  return totals;
}

/** A date as a short local time, with the day when it is not today. */
export function when(at: number | string): string {
  const date = new Date(at);
  const today = new Date().toDateString() === date.toDateString();
  return today
    ? date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
    : date.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}
