import { useState, type ReactElement } from 'react';

/** How many characters a closed object's preview takes before it ends in `…`. */
const PREVIEW_ROOM = 60;

const isBranch = (value: unknown): value is Record<string, unknown> | unknown[] => typeof value === 'object' && value !== null;

/** A value in one line: a string quoted, a branch as its braces or brackets. */
function leafText(value: unknown): string {
  if (typeof value === 'string') return JSON.stringify(value);
  if (Array.isArray(value)) return '[…]';
  if (isBranch(value)) return '{…}';
  return String(value);
}

/**
 * A closed branch in one line, as a browser's console shows it: an object's
 * first keys with their values, an array's length and first items, cut to
 * `room` characters.
 */
export function previewOf(value: Record<string, unknown> | unknown[], room = PREVIEW_ROOM): string {
  const parts = Array.isArray(value) ? value.map(leafText) : Object.entries(value).map(([key, one]) => `${key}: ${leafText(one)}`);
  const [open, close] = Array.isArray(value) ? [`(${String(value.length)}) [`, ']'] : ['{', '}'];
  let body = '';
  for (const part of parts) {
    const next = body === '' ? part : `${body}, ${part}`;
    if (next.length > room) return `${open}${body === '' ? part.slice(0, room) : body}, …${close}`;
    body = next;
  }
  return `${open}${body}${close}`;
}

/** The kind a leaf is drawn as. */
const leafKind = (value: unknown): string => (value === null ? 'null' : typeof value);

function Node({ name, value, depth }: { name: string | null; value: unknown; depth: number }): ReactElement {
  // The top level opens; below it a branch waits to be opened, as a console does.
  const [open, setOpen] = useState(depth === 0);
  const label = name === null ? null : <span className="web-json__key">{name}</span>;
  if (!isBranch(value)) {
    return (
      <li className="web-json__row">
        {label}{label === null ? null : ': '}
        <span className="web-json__leaf" data-kind={leafKind(value)}>{leafText(value)}</span>
      </li>
    );
  }
  const entries = Array.isArray(value) ? value.map((one, at) => [String(at), one] as const) : Object.entries(value);
  return (
    <li className="web-json__row">
      <button type="button" className="web-json__branch" aria-expanded={open} onClick={() => setOpen(!open)}>
        <span className="web-json__caret" aria-hidden="true">{open ? '\u{25BE}' : '\u{25B8}'}</span>
        {label}{label === null ? null : ': '}
        <span className="web-json__preview">{previewOf(value)}</span>
      </button>
      {open ? (
        <ul className="web-json__children">
          {entries.map(([key, one]) => <Node key={key} name={key} value={one} depth={depth + 1} />)}
        </ul>
      ) : null}
    </li>
  );
}

/** A value as a tree to open branch by branch, as a browser's console draws an object. */
export function JsonTree({ value }: { value: unknown }): ReactElement {
  return (
    <ul className="web-json">
      <Node name={null} value={value} depth={0} />
    </ul>
  );
}
