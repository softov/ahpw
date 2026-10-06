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
