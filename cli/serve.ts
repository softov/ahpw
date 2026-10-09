import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { ArgumentError, ConfigurationError, type Command, type Field, type Registry } from '@cofold/commands';
import { resolveConfig } from '@cofold/config';
import { createWebServer } from './server.js';

/** The port the page is served on unless one is named. */
export const DEFAULT_PORT = 5190;

/** The address bound unless one is named. */
export const DEFAULT_HOST = '127.0.0.1';

/**
 * `serve`'s flags. Each is also a key in `~/.config/ahpw/config.json`, spelled
 * the same without the dashes. None has a `default`, so a flag can be told
 * apart from the file; the defaults are in `settingsOf`.
 */
export const serveFields = {
  connect: {
    type: 'string',
    description: 'The daemon\'s AHP socket, as ws://HOST:PORT or wss://HOST:PORT. A tkn in it is the token. Default AHPD_URL, then AHPD_HOST.',
    cli: { value: 'URL' },
  },
  token: {
    type: 'string',
    description: 'Add this token to the socket, so the page asks for none. Default the tkn in the socket, then AHPD_TOKEN.',
    cli: { value: 'SECRET' },
  },
  tokenFile: {
    type: 'string',
    description: 'Read the token to add from this file.',
    cli: { value: 'PATH' },
  },
  host: {
    type: 'string',
    description: `Bind here. Default ${DEFAULT_HOST}.`,
    cli: { value: 'ADDR' },
  },
  port: {
    type: 'integer',
    description: `Listen here. Default ${DEFAULT_PORT}; 0 picks a free one.`,
    cli: { value: 'N' },
  },
  open: {
    type: 'boolean',
    description: 'Open the page in a browser once it is served.',
  },
} satisfies Record<string, Field>;

/** What `serve` runs with, after the flags and the file are folded. */
export interface Settings {
  /** The daemon's socket. */
  connect: URL;
  /** The token the socket is given, when this server holds one. */
  token?: string;
  host: string;
  port: number;
  open: boolean;
}

const KINDS: Readonly<Record<keyof typeof serveFields, string>> = {
  connect: 'string', token: 'string', tokenFile: 'string', host: 'string', port: 'number', open: 'boolean',
};

/** `~` at the start of a path, as a shell would read it. A config file has no shell. */
const expand = (path: string): string => (path === '~' || path.startsWith('~/') ? homedir() + path.slice(1) : path);

/** The variables `serve` reads, below the file. */
export const ENVIRONMENT = { url: 'AHPD_URL', host: 'AHPD_HOST', token: 'AHPD_TOKEN' } as const;

/** One source of settings: the flags, the file, or the environment. */
type Layer = Partial<Record<keyof typeof serveFields, unknown>>;

/**
 * A daemon's socket from what a person wrote. `http` and `https` name the same
 * port as `ws` and `wss`, and a bare `HOST:PORT` is taken as `ws://HOST:PORT`.
 */
function socketOf(text: string, from: string): URL {
  let url: URL;
  try {
    url = new URL(/^[a-z][a-z0-9+.-]*:\/\//i.test(text) ? text : `ws://${text}`);
  } catch {
    throw new ArgumentError(`${from} is not a URL: ${text}.`);
  }
  if (url.protocol === 'http:') url.protocol = 'ws:';
  else if (url.protocol === 'https:') url.protocol = 'wss:';
  if (url.protocol !== 'ws:' && url.protocol !== 'wss:') throw new ArgumentError(`${from} takes ws://, wss://, http:// or https://, not ${url.protocol}//.`);
  return url;
}

/** A layer with its socket read, and the socket's `tkn` taken out as the layer's token. */
function lifted(layer: Layer, from: string): Layer {
  if (typeof layer.connect !== 'string') return layer;
  const url = socketOf(layer.connect, from);
  const tkn = url.searchParams.get('tkn');
  if (tkn === null) return { ...layer, connect: url };
  if (layer.token !== undefined || layer.tokenFile !== undefined) throw new ArgumentError(`${from} has a tkn, and a token is also given. Pass one.`);
  url.searchParams.delete('tkn');
  return { ...layer, connect: url, token: tkn };
}

/** `AHPD_URL` or else `AHPD_HOST`, with the token in its `tkn` or else `AHPD_TOKEN`. */
function environmentLayer(env: Readonly<Record<string, string | undefined>>): Layer {
  const named = [ENVIRONMENT.url, ENVIRONMENT.host].find((name) => (env[name] ?? '') !== '');
  const layer = named === undefined ? {} : lifted({ connect: env[named] }, named);
  const token = env[ENVIRONMENT.token] ?? '';
  return layer.token === undefined && token !== '' ? { ...layer, token } : layer;
}

const holdsSecret = (layer: Layer): boolean => layer.token !== undefined || layer.tokenFile !== undefined;

/**
 * The flags over the file over the environment, checked, with the defaults filled in.
 *
 * A flag beats the file, and the file beats the environment. `token`,
 * `tokenFile` and a `tkn` in the socket are one secret: two from the same place
 * are refused, and the highest place that gives one replaces the others.
 */
export function settingsOf(flags: Readonly<Record<string, unknown>>, file: Readonly<Record<string, unknown>>, env: Readonly<Record<string, string | undefined>>, read: (path: string) => string = (path) => readFileSync(path, 'utf8')): Settings {
  for (const [key, value] of Object.entries(file)) {
    const kind = KINDS[key as keyof typeof KINDS];
    if (kind === undefined) throw new ConfigurationError(`The configuration has a key serve does not take: ${key}.`);
    if (typeof value !== kind || (key === 'port' && !Number.isInteger(value))) throw new ConfigurationError(`The configuration's ${key} is not a${kind === 'number' ? 'n integer' : ` ${kind}`}.`);
  }
  if (flags['token'] !== undefined && flags['tokenFile'] !== undefined) throw new ArgumentError('Pass --token or --token-file, not both.');
  if (file['token'] !== undefined && file['tokenFile'] !== undefined) throw new ConfigurationError('The configuration has token and tokenFile. Keep one.');
  const layers = [environmentLayer(env), lifted(file, 'The configuration\'s connect'), lifted(flags, '--connect')];
  const secretFrom = layers.findLast(holdsSecret) ?? {};
  const merged: Layer = { ...layers[1], ...layers[2], connect: layers.findLast((layer) => layer.connect !== undefined)?.connect, token: secretFrom.token, tokenFile: secretFrom.tokenFile };

  const connect = merged.connect;
  if (!(connect instanceof URL)) throw new ArgumentError(`Pass --connect with the daemon's socket, as ws://127.0.0.1:PORT, or set ${ENVIRONMENT.url}.`);

  let held: string | undefined;
  if (typeof merged.tokenFile === 'string') {
    try {
      held = read(expand(merged.tokenFile));
    } catch {
      throw new ArgumentError(`No token file at ${merged.tokenFile}.`);
    }
  } else if (typeof merged.token === 'string') held = merged.token;
  const token = held?.trim();
  if (token === '') throw new ArgumentError('The token is empty.');

  const port = (merged.port as number | undefined) ?? DEFAULT_PORT;
  if (port < 0 || port > 65_535) throw new ArgumentError(`--port is not a port: ${port}.`);
  return {
    connect,
    ...(token === undefined ? {} : { token }),
    host: (merged.host as string | undefined) ?? DEFAULT_HOST,
    port,
    open: merged.open === true,
  };
}

/** Whether an address is this machine only. */
const loopback = (host: string): boolean => host === 'localhost' || host === '::1' || host.startsWith('127.');

/** What to say before serving, when something is reachable that a person may not expect. */
export function warningsOf(settings: Settings): string[] {
  const said: string[] = [];
  if (!loopback(settings.host)) {
    said.push(`ahpw: ${settings.host} is reached over plain http and ws.${settings.token === undefined ? '' : ' Anyone who reaches it uses the daemon with the token this server adds.'}`);
  }
  if (settings.token !== undefined && settings.connect.protocol === 'ws:' && !loopback(settings.connect.hostname.replace(/^\[|\]$/g, ''))) {
    said.push(`ahpw: the token travels in cleartext to ${settings.connect.host}.`);
  }
  return said;
}

/** The page's address as a browser would type it. */
const pageUrl = (host: string, port: number): string => {
  const shown = host === '0.0.0.0' || host === '::' ? '127.0.0.1' : host;
  return `http://${shown.includes(':') ? `[${shown}]` : shown}:${port}/`;
};

/** Opens `url` in the desktop's browser, and says nothing when there is none. */
function openBrowser(url: string): void {
  const [command, ...args] = process.platform === 'darwin' ? ['open', url] : process.platform === 'win32' ? ['cmd', '/c', 'start', '', url] : ['xdg-open', url];
  try {
    const child = spawn(command as string, args, { detached: true, stdio: 'ignore' });
    child.on('error', () => undefined);
    child.unref();
  } catch {
    // No browser to open: the address is printed either way.
  }
}

/** `ahpw serve`: the page, and its socket carried to a daemon. Runs until stopped. */
export const declareServe = (registry: Registry<object>, app: string): Command => registry.action({
  id: 'serve',
  summary: 'Serve the page, connected to a daemon',
  description: 'Serves the web UI and carries its socket to the daemon --connect names. With a token, the page asks for none.',
  surfaces: { cli: { pattern: ['serve'] } },
  input: serveFields,
  run: async (context) => {
    const named = context.globals['config'];
    const file = resolveConfig(typeof named === 'string'
      ? { name: 'ahpw', path: named, user: false, environment: false }
      : { name: 'ahpw' });
    const settings = settingsOf(context.input, file.values as Record<string, unknown>, process.env);
    for (const line of warningsOf(settings)) process.stderr.write(`${line}\n`);

    const { server, stop } = createWebServer({ app, upstream: settings.connect, token: settings.token });
    await new Promise<void>((resolve, reject) => {
      server.once('error', reject);
      server.listen(settings.port, settings.host, () => resolve());
    });
    const bound = server.address();
    const url = pageUrl(settings.host, typeof bound === 'object' && bound !== null ? bound.port : settings.port);
    process.stderr.write(`ahpw: serving ${url}, connected to ${settings.connect.origin}${settings.connect.pathname === '/' ? '' : settings.connect.pathname}.\n`);
    if (settings.open) openBrowser(url);

    await new Promise<void>((resolve) => {
      const end = (): void => void stop().then(resolve);
      process.once('SIGINT', end);
      process.once('SIGTERM', end);
    });
  },
});
