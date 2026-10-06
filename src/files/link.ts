/** A file a link or a path points at, with the lines it names. */
export interface FileTarget {
  uri: string;
  name: string;
  line: number | null;
  end: number | null;
}

/** A path with `.` and `..` folded away. */
function normalise(path: string): string {
  const out: string[] = [];
  for (const part of path.split('/')) {
    if (part === '' || part === '.') continue;
    if (part === '..') out.pop();
    else out.push(part);
  }
  return `${path.startsWith('/') ? '/' : ''}${out.join('/')}`;
}

/**
 * The file a markdown link points at: a `file://` URI, an absolute path, or a
 * path relative to the session's folder, with `#L42` or `#L42-L50`. Any other
 * scheme is not a file, and null says so.
 */
export function fileLink(url: string, workspaceUri: string | null): FileTarget | null {
  const raw = url.trim();
  if (raw === '' || raw.startsWith('#')) return null;
  const scheme = /^([a-z][a-z0-9+.-]*):/i.exec(raw);
  if (scheme !== null && scheme[1]?.toLowerCase() !== 'file') return null;

  const hash = raw.indexOf('#');
  const target = hash < 0 ? raw : raw.slice(0, hash);
  const fragment = hash < 0 ? '' : raw.slice(hash + 1);
  const lines = /^L(\d+)(?:-L?(\d+))?$/i.exec(fragment);

  let path: string;
  try {
    path = decodeURIComponent(target.replace(/^file:\/\//i, '').replace(/\?.*$/, ''));
  } catch {
    return null;
  }
  if (path === '') return null;
  if (!path.startsWith('/')) {
    if (workspaceUri === null) return null;
    path = `${workspaceUri.replace(/^file:\/\//i, '').replace(/\/+$/, '')}/${path}`;
  }
  path = normalise(path);
  const name = path.split('/').pop() ?? path;
  if (name === '') return null;

  const line = lines === null ? null : Number(lines[1]);
  const end = lines === null || lines[2] === undefined ? null : Number(lines[2]);
  return { uri: `file://${path}`, name, line, end: end !== null && line !== null && end > line ? end : null };
}

/** The file a code span such as `src/a.ts:42` may name, or null when it reads as anything else. */
export function codePath(text: string, workspaceUri: string | null): FileTarget | null {
  const raw = text.trim();
  if (raw.length < 2 || raw.length > 240 || /[\s"'`<>(){}[\],;=*|$]/.test(raw) || raw.startsWith('-')) return null;
  const suffix = /^(.*?):(\d+)(?::\d+)?$/.exec(raw);
  const path = suffix === null ? raw : suffix[1] ?? raw;
  const named = path.includes('/') || /^[\w.@+-]+\.[\w]+$/.test(path);
  if (!named || /^\d+$/.test(path) || /^[a-z][a-z0-9+.-]*:/i.test(path) || /^\d+(\.\d+)+$/.test(path)) return null;
  return fileLink(suffix === null ? path : `${path}#L${suffix[2]}`, workspaceUri);
}
