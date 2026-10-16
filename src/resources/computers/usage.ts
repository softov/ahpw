/** A running computer's use, from its `stats` leaf. */
export interface Usage {
  cpu: { percent: number; cores?: number };
  memory: { used: number; limit: number; percent: number };
  pids?: number;
  network?: { rx: number; tx: number };
  block?: { read: number; write: number };
}

function bag(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}
const count = (value: unknown): number | undefined => (typeof value === 'number' && Number.isFinite(value) ? value : undefined);

/** The use in a `stats` leaf's text; null for a machine that is not running, or text that says nothing usable. */
export function usageOf(text: string | null): Usage | null {
  let said: Record<string, unknown> | null;
  try {
    said = bag(text === null ? null : JSON.parse(text));
  } catch {
    return null;
  }
  if (said === null || said.running !== true) return null;
  const cpu = bag(said.cpu);
  const memory = bag(said.memory);
  const used = count(memory?.used);
  const limit = count(memory?.limit);
  if (used === undefined || limit === undefined) return null;
  const network = bag(said.network);
  const block = bag(said.block);
  const rx = count(network?.rx);
  const tx = count(network?.tx);
  const read = count(block?.read);
  const write = count(block?.write);
  const cores = count(cpu?.cores);
  const pids = count(said.pids);
  return {
    cpu: { percent: count(cpu?.percent) ?? 0, ...(cores === undefined ? {} : { cores }) },
    memory: { used, limit, percent: count(memory?.percent) ?? (limit === 0 ? 0 : (used / limit) * 100) },
    ...(pids === undefined ? {} : { pids }),
    ...(rx === undefined || tx === undefined ? {} : { network: { rx, tx } }),
    ...(read === undefined || write === undefined ? {} : { block: { read, write } }),
  };
}

const UNITS = ['B', 'KiB', 'MiB', 'GiB', 'TiB'];

/** A size in binary units, as `1.5 GiB`. */
export function sizeWords(bytes: number): string {
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < UNITS.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${unit === 0 || value >= 10 ? Math.round(value) : value.toFixed(1)} ${UNITS[unit]}`;
}
