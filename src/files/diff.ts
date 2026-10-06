/**
 * A line diff, because the protocol sends both sides of an edit but no hunks.
 *
 * Patience alignment: lines that appear once on each side anchor the match, so
 * the diff follows the structure a person reads rather than any longest common
 * subsequence. Deterministic, always terminates, and bounded by the anchor count.
 */

/** One line of a diff, with the line number it has on each side. */
export interface DiffLine {
  kind: 'context' | 'add' | 'del';
  /** The 1-based line number before the edit, or `null` for an addition. */
  before: number | null;
  /** The 1-based line number after the edit, or `null` for a removal. */
  after: number | null;
  text: string;
}

/** One run of changed lines with the context around it. */
export interface DiffHunk {
  /** 1-based first line this hunk covers, on each side. */
  beforeStart: number;
  beforeCount: number;
  afterStart: number;
  afterCount: number;
  lines: DiffLine[];
}

/** How many unchanged lines are kept on either side of a change. */
const CONTEXT = 3;

/**
 * The lines of a file, as a diff counts them.
 *
 * A trailing newline ends the last line rather than starting an empty one, and
 * an empty file has no lines at all. `''.split('\n')` is `['']`, which would
 * make every empty side one empty line and every created file a one-line edit
 * that is really a zero-line one.
 */
export function splitLines(text: string): string[] {
  if (text === '') return [];
  const body = text.endsWith('\n') ? text.slice(0, -1) : text;
  return body.split('\n');
}

/** Whether a line is unchanged on both sides. */
function same(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((line, index) => line === b[index]);
}

/**
 * The longest strictly increasing run of anchor positions.
 *
 * Patience's step two: the anchors are already sorted by their position in the
 * old file, and keeping the longest run that is also increasing in the new file
 * is the largest set of anchors that can all stay in order. Indices are
 * returned so the caller can slice around them.
 */
function longestRun(positions: number[]): number[] {
  if (positions.length === 0) return [];
  /** `tails[k]` is the index into `positions` of the smallest tail of a run of length `k + 1`. */
  const tails: number[] = [];
  const back = new Array<number>(positions.length).fill(-1);

  for (let index = 0; index < positions.length; index += 1) {
    const value = positions[index] as number;
    let low = 0;
    let high = tails.length;
    while (low < high) {
      const middle = (low + high) >> 1;
      if ((positions[tails[middle] as number] as number) < value) low = middle + 1;
      else high = middle;
    }
    back[index] = low > 0 ? (tails[low - 1] as number) : -1;
    tails[low] = index;
  }

  const out: number[] = [];
  let at = tails.length > 0 ? (tails[tails.length - 1] as number) : -1;
  while (at >= 0) {
    out.push(at);
    at = back[at] as number;
  }
  return out.reverse();
}

/**
 * The lines that appear exactly once on each side, paired by position.
 *
 * A line appearing twice on either side is not an anchor: there is no way to
 * say which occurrence corresponds to which, and guessing is how a diff ends up
 * attributing an edit to the wrong function.
 */
function anchorsOf(a: string[], b: string[]): { a: number; b: number }[] {
  const inA = new Map<string, number>();
  for (const line of a) inA.set(line, (inA.get(line) ?? 0) + 1);
  const inB = new Map<string, number>();
  for (const line of b) inB.set(line, (inB.get(line) ?? 0) + 1);

  const where = new Map<string, number>();
  b.forEach((line, index) => {
    if (inA.get(line) === 1 && inB.get(line) === 1) where.set(line, index);
  });

  const found: { a: number; b: number }[] = [];
  a.forEach((line, index) => {
    const at = where.get(line);
    if (at !== undefined) found.push({ a: index, b: at });
  });
  return found;
}

/** Every line of `a` removed, then every line of `b` added. The honest floor. */
function replaceAll(a: string[], b: string[], a0: number, b0: number): DiffLine[] {
  const out: DiffLine[] = [];
  a.forEach((text, index) => out.push({ kind: 'del', before: a0 + index + 1, after: null, text }));
  b.forEach((text, index) => out.push({ kind: 'add', before: null, after: b0 + index + 1, text }));
  return out;
}

/** How deep the recursion goes before a region is taken as a whole replacement. */
const DEPTH = 24;

/**
 * Align two runs of lines, recursively at the anchors between them.
 *
 * The head and tail are handled by the same recursion as the gaps: passing an
 * empty side is what makes an insertion or a deletion fall out of the general
 * case rather than needing a branch of its own.
 */
function align(a: string[], b: string[], a0: number, b0: number, depth: number): DiffLine[] {
  if (a.length === 0 && b.length === 0) return [];
  if (same(a, b)) {
    return a.map((text, index) => ({
      kind: 'context' as const,
      before: a0 + index + 1,
      after: b0 + index + 1,
      text,
    }));
  }
  if (a.length === 0 || b.length === 0 || depth >= DEPTH) return replaceAll(a, b, a0, b0);

  const anchors = anchorsOf(a, b);
  if (anchors.length === 0) return replaceAll(a, b, a0, b0);

  const kept = longestRun(anchors.map((anchor) => anchor.b)).map(
    (index) => anchors[index] as { a: number; b: number },
  );
  if (kept.length === 0) return replaceAll(a, b, a0, b0);

  const out: DiffLine[] = [];
  let aAt = 0;
  let bAt = 0;
  for (const anchor of kept) {
    out.push(...align(a.slice(aAt, anchor.a), b.slice(bAt, anchor.b), a0 + aAt, b0 + bAt, depth + 1));
    out.push({
      kind: 'context',
      before: a0 + anchor.a + 1,
      after: b0 + anchor.b + 1,
      text: a[anchor.a] as string,
    });
    aAt = anchor.a + 1;
    bAt = anchor.b + 1;
  }
  out.push(...align(a.slice(aAt), b.slice(bAt), a0 + aAt, b0 + bAt, depth + 1));
  return out;
}

/**
 * The diff of two texts, as hunks with line numbers.
 *
 * No hunks means the files are the same, which is a real answer and drawn as
 * one: a file whose content did not change should not open onto an empty box.
 */
export function diffLines(before: string, after: string, context = CONTEXT): DiffHunk[] {
  const lines = align(splitLines(before), splitLines(after), 0, 0, 0);
  const changed = lines
    .map((line, index) => (line.kind === 'context' ? -1 : index))
    .filter((index) => index >= 0);
  if (changed.length === 0) return [];

  // Changed lines closer together than two runs of context belong to one hunk,
  // because splitting them would mean printing the same context twice.
  const regions: { from: number; to: number }[] = [];
  for (const index of changed) {
    const last = regions[regions.length - 1];
    if (last !== undefined && index - last.to <= context * 2) last.to = index;
    else regions.push({ from: index, to: index });
  }

  return regions.map((region) => {
    const from = Math.max(0, region.from - context);
    const to = Math.min(lines.length - 1, region.to + context);
    const body = lines.slice(from, to + 1);
    const first = body[0] as DiffLine;
    const beforeStart = first.before ?? first.after ?? 1;
    const afterStart = first.after ?? first.before ?? 1;
    return {
      beforeStart: body.some((line) => line.before !== null) ? beforeStart : 0,
      beforeCount: body.filter((line) => line.kind !== 'add').length,
      afterStart: body.some((line) => line.after !== null) ? afterStart : 0,
      afterCount: body.filter((line) => line.kind !== 'del').length,
      lines: body,
    };
  });
}

/** `@@ -37,9 +37,13 @@`, the header a hunk is read by. */
export function hunkHeader(hunk: DiffHunk): string {
  const before = hunk.beforeCount === 1 ? `${hunk.beforeStart}` : `${hunk.beforeStart},${hunk.beforeCount}`;
  const after = hunk.afterCount === 1 ? `${hunk.afterStart}` : `${hunk.afterStart},${hunk.afterCount}`;
  return `@@ -${before} +${after} @@`;
}

/** Lines added and removed, counted the way the host counts them. */
export function countChanges(hunks: DiffHunk[]): { added: number; removed: number } {
  let added = 0;
  let removed = 0;
  for (const hunk of hunks) {
    for (const line of hunk.lines) {
      if (line.kind === 'add') added += 1;
      else if (line.kind === 'del') removed += 1;
    }
  }
  return { added, removed };
}

/** One row of a side-by-side diff: the old line on the left, the new on the right. */
export interface SideBySideRow {
  left: DiffLine | null;
  right: DiffLine | null;
}

/**
 * A hunk's lines as side-by-side rows.
 *
 * A context line is on both sides. A run of removals and the run of additions
 * that follows it are paired line by line, the way a split diff shows an edit;
 * the longer run's extra lines face an empty cell.
 */
export function sideBySide(lines: readonly DiffLine[]): SideBySideRow[] {
  const rows: SideBySideRow[] = [];
  let at = 0;
  while (at < lines.length) {
    const line = lines[at] as DiffLine;
    if (line.kind === 'context') {
      rows.push({ left: line, right: line });
      at += 1;
      continue;
    }
    const removed: DiffLine[] = [];
    const added: DiffLine[] = [];
    while (at < lines.length && (lines[at] as DiffLine).kind === 'del') removed.push(lines[at++] as DiffLine);
    while (at < lines.length && (lines[at] as DiffLine).kind === 'add') added.push(lines[at++] as DiffLine);
    for (let n = 0; n < Math.max(removed.length, added.length); n++) {
      rows.push({ left: removed[n] ?? null, right: added[n] ?? null });
    }
  }
  return rows;
}
