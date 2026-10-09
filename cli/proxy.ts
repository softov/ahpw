import type { IncomingMessage } from 'node:http';
import { connect as connectTcp, isIP, type Socket } from 'node:net';
import { connect as connectTls } from 'node:tls';
import type { Duplex } from 'node:stream';

/** The path the page opens its socket on, as it does when the daemon serves it. */
export const SOCKET_PATH = '/';

/** The handshake headers a socket needs upstream. Cookies and the rest stay here. */
const HANDSHAKE = ['upgrade', 'connection', 'sec-websocket-key', 'sec-websocket-version', 'sec-websocket-protocol', 'sec-websocket-extensions', 'user-agent'];

/** Whether `hostname` cannot be a name somebody else's DNS points here: loopback, or an address. */
function addressed(hostname: string): boolean {
  const bare = hostname.replace(/^\[|\]$/g, '');
  return bare === 'localhost' || isIP(bare) !== 0;
}

/**
 * Whether a socket comes from a page this server sent.
 *
 * The `Origin` must be this server as the browser reached it, and that must be
 * an address or `localhost`, so a page on another name that resolves here
 * cannot open the socket. A request with no `Origin` is not from a page and is
 * refused too.
 */
export function originAllowed(origin: string | undefined, host: string | undefined): boolean {
  if (origin === undefined || host === undefined) return false;
  if (origin !== `http://${host}`) return false;
  try {
    return addressed(new URL(origin).hostname);
  } catch {
    return false;
  }
}

/**
 * The path and query the daemon is asked for.
 *
 * The upstream's own path and query, then the browser's query without `tkn`.
 * With a token, it is added as `tkn`; without one, the browser's `tkn` is
 * passed on, because then the page signed in itself.
 */
export function upstreamPath(upstream: URL, requested: string, token: string | undefined): string {
  const query = new URLSearchParams(upstream.search);
  const asked = new URL(requested, 'http://page').searchParams;
  for (const [key, value] of asked) if (key !== 'tkn') query.append(key, value);
  const tkn = token ?? asked.get('tkn') ?? undefined;
  if (tkn !== undefined) query.set('tkn', tkn);
  const search = query.toString();
  return `${upstream.pathname === '' ? '/' : upstream.pathname}${search === '' ? '' : `?${search}`}`;
}

const refuse = (socket: Duplex, status: string): void => {
  socket.end(`HTTP/1.1 ${status}\r\nconnection: close\r\ncontent-length: 0\r\n\r\n`);
};

/**
 * An `upgrade` listener that carries the page's socket to the daemon.
 *
 * The handshake is written upstream with the token in it, and from there the
 * two sockets are piped: the daemon's `101` and every frame after it pass
 * through unread.
 */
export function socketProxy(upstream: URL, token: string | undefined): (request: IncomingMessage, socket: Duplex, head: Buffer) => void {
  const secure = upstream.protocol === 'wss:';
  const port = Number(upstream.port === '' ? (secure ? 443 : 80) : upstream.port);
  const hostname = upstream.hostname.replace(/^\[|\]$/g, '');
  return (request, socket, head) => {
    const url = request.url ?? '/';
    if (new URL(url, 'http://page').pathname !== SOCKET_PATH) return refuse(socket, '404 Not Found');
    if (!originAllowed(request.headers.origin, request.headers.host)) return refuse(socket, '403 Forbidden');

    const lines = [`GET ${upstreamPath(upstream, url, token)} HTTP/1.1`, `host: ${upstream.host}`];
    for (const name of HANDSHAKE) {
      const value = request.headers[name];
      if (typeof value === 'string') lines.push(`${name}: ${value}`);
    }
    const daemon: Socket = secure
      ? connectTls({ host: hostname, port, servername: isIP(hostname) === 0 ? hostname : undefined })
      : connectTcp({ host: hostname, port });
    let piped = false;
    daemon.once(secure ? 'secureConnect' : 'connect', () => {
      piped = true;
      daemon.write(`${lines.join('\r\n')}\r\n\r\n`);
      if (head.length > 0) daemon.write(head);
      daemon.pipe(socket);
      socket.pipe(daemon);
    });
    daemon.on('error', () => {
      if (piped) socket.destroy();
      else refuse(socket, '502 Bad Gateway');
    });
    socket.on('error', () => daemon.destroy());
    socket.on('close', () => daemon.destroy());
    daemon.on('close', () => { if (piped) socket.destroy(); });
  };
}
