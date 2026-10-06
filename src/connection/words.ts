/**
 * A random id in UUID form.
 *
 * `crypto.randomUUID` exists only in a secure context, and a daemon reached
 * over plain http on another machine is not one, so this builds the same
 * shape from `getRandomValues`.
 */
export function newId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6]! & 0x0f) | 0x40;
  bytes[8] = (bytes[8]! & 0x3f) | 0x80;
  const hex = [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/** A folder as the URI the protocol takes: a path becomes `file://`, a URI stays. */
export function folderUri(folder: string): string {
  const trimmed = folder.trim();
  if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed)) return trimmed;
  return `file://${trimmed.split('/').map(encodeURIComponent).join('/')}`;
}

/** A folder URI as a person reads it: a `file://` URI becomes its path. */
export function folderLabel(uri: string): string {
  if (!uri.startsWith('file://')) return uri;
  try {
    return decodeURIComponent(uri.slice('file://'.length));
  } catch {
    return uri;
  }
}

/** Text the protocol sends as a string or as `{ markdown }`. */
export function textOf(value: string | { markdown: string } | undefined): string {
  if (value === undefined) return '';
  return typeof value === 'string' ? value : value.markdown;
}

/** A length of time as `13s`, `5m13s`, `2h5m` or `3d2h`. */
export function elapsed(ms: number): string {
  const seconds = Math.max(0, Math.floor(ms / 1000));
  const s = seconds % 60;
  const m = Math.floor(seconds / 60) % 60;
  const h = Math.floor(seconds / 3600) % 24;
  const d = Math.floor(seconds / 86400);
  if (d > 0) return `${d}d${h}h`;
  if (h > 0) return `${h}h${m}m`;
  if (m > 0) return `${m}m${s}s`;
  return `${s}s`;
}
