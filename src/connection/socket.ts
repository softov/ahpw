/** The path the dev server proxies to the daemon's socket, which answers at `/`. */
export const DEV_SOCKET_PATH = '/ahp';

/**
 * The daemon's AHP socket, on the host that served this page.
 *
 * The token goes in `?tkn=`, because a browser cannot put a header on a
 * WebSocket.
 */
export function socketUrl(token: string | null, where: Pick<Location, 'protocol' | 'host'>, dev: boolean): string {
  const scheme = where.protocol === 'https:' ? 'wss:' : 'ws:';
  const path = dev ? DEV_SOCKET_PATH : '/';
  return `${scheme}//${where.host}${path}${token === null ? '' : `?tkn=${encodeURIComponent(token)}`}`;
}
