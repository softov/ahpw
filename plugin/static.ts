import { readFile, stat } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';

/** What a file is served as, by extension. */
const TYPES: Readonly<Record<string, string>> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.map': 'application/json',
  '.txt': 'text/plain; charset=utf-8',
};

/**
 * Headers on every answer.
 *
 * The token sits in this origin's localStorage, so the page loads nothing from
 * anywhere else and cannot be framed. Inline styles stay allowed because the
 * theme sets custom properties on elements.
 */
const SECURITY: Readonly<Record<string, string>> = {
  'content-security-policy': "default-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'",
  'x-content-type-options': 'nosniff',
  'referrer-policy': 'no-referrer',
};

const answer = (status: number, body: string, headers: Record<string, string> = {}): Response =>
  new Response(body, { status, headers: { ...SECURITY, 'content-type': 'text/plain; charset=utf-8', ...headers } });

/**
 * A route that serves the files under `root`, mounted at `prefix`.
 *
 * `prefix` is the path the daemon serves the route at, ending in `/`. The bare
 * prefix without its slash is redirected to it, because the page loads its
 * assets relative to its own address. A path that leaves `root`, by `..` or an
 * encoded separator, is answered 404 like a missing file.
 */
export function staticRoute(root: string, prefix: string): (request: Request) => Promise<Response> {
  const base = resolve(root);
  return async (request) => {
    if (request.method !== 'GET' && request.method !== 'HEAD') return answer(405, 'Method not allowed', { allow: 'GET, HEAD' });
    const url = new URL(request.url);
    if (url.pathname === prefix.slice(0, -1)) return answer(308, '', { location: prefix });
    if (!url.pathname.startsWith(prefix)) return answer(404, 'Not found');

    let parts: string[];
    try {
      parts = url.pathname.slice(prefix.length).split('/').filter((part) => part !== '').map(decodeURIComponent);
    } catch {
      return answer(400, 'Bad path');
    }
    if (parts.some((part) => part === '.' || part === '..' || part.includes('/') || part.includes('\\') || part.includes('\0'))) {
      return answer(404, 'Not found');
    }

    let file = resolve(base, ...parts);
    if (file !== base && !file.startsWith(base + sep)) return answer(404, 'Not found');
    try {
      if ((await stat(file)).isDirectory()) file = resolve(file, 'index.html');
      const body = await readFile(file);
      const type = TYPES[extname(file).toLowerCase()] ?? 'application/octet-stream';
      // Built assets carry a content hash in their name; the page itself does not.
      const cache = parts[0] === 'assets' ? 'public, max-age=31536000, immutable' : 'no-cache';
      return new Response(request.method === 'HEAD' ? null : body, {
        status: 200,
        headers: { ...SECURITY, 'content-type': type, 'cache-control': cache, 'content-length': String(body.byteLength) },
      });
    } catch {
      return answer(404, 'Not found');
    }
  };
}
