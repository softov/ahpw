import { createServer, type IncomingMessage, type Server } from 'node:http';
import type { Duplex } from 'node:stream';
import { toNodeListener } from '@cofold/remote';
import { staticRoute } from '../plugin/static.js';
import { socketProxy } from './proxy.js';

/** What the page reads to learn that this server adds the token, so it asks for none. */
export const SERVER_FILE = '/ahpw.json';

/** What the web server serves, and the daemon it carries the socket to. */
export interface WebServerOptions {
  /** The built page. */
  app: string;
  /** The daemon's AHP socket, `ws:` or `wss:`. */
  upstream: URL;
  /** The token added to the socket. Absent, the page signs in and its own is passed on. */
  token?: string | undefined;
}

/** The server, and how to stop it with every socket it carries. */
export interface WebServer {
  server: Server;
  /** Stops listening and ends every connection, sockets included. */
  stop(): Promise<void>;
}

/** The page at `/`, and its socket carried to the daemon. Not listening yet. */
export function createWebServer(options: WebServerOptions): WebServer {
  const files = staticRoute(options.app, '/');
  const about = JSON.stringify({ tokenHeld: options.token !== undefined });
  const route = async (request: Request): Promise<Response> => {
    if (new URL(request.url).pathname !== SERVER_FILE) return await files(request);
    return new Response(about, { headers: { 'content-type': 'application/json', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' } });
  };
  const server = createServer(toNodeListener(route));
  const proxy = socketProxy(options.upstream, options.token);
  const carried = new Set<Duplex>();
  server.on('upgrade', (request: IncomingMessage, socket: Duplex, head: Buffer) => {
    carried.add(socket);
    socket.on('close', () => carried.delete(socket));
    proxy(request, socket, head);
  });
  const stop = (): Promise<void> => new Promise((resolve) => {
    server.close(() => resolve());
    server.closeAllConnections();
    for (const socket of carried) socket.destroy();
  });
  return { server, stop };
}
