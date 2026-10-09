# @ahpd/web

A browser UI for an [ahpd](https://github.com/softov/ahpd) daemon, served by the daemon itself as a plugin. It talks to that one daemon two ways: its administration API, and the Agent Host Protocol.

The sessions come over AHP, on the daemon's own socket: the list stays live as sessions are added, change or end.

Every administration screen is drawn from the daemon's `/api/cli-manifest`: one entry per command, grouped, with a form built from the command's arguments and options, and the answer drawn by its shape. A command ahpd adds shows up here without a change to this package.

Sign in with a token the daemon accepts: the deployment's connection token, or a person's token. Each command checks its own grants, so a token that may not run one is answered with the daemon's refusal. The socket carries the token as `?tkn=`, because a browser cannot put a header on a WebSocket.

## Run it on a daemon

The API has to be on, and on the daemon's own port, so the page and `/api` share an origin:

```json
{
  "http": true,
  "plugins": ["@ahpd/web"]
}
```

Then open `http://127.0.0.1:9187/plugins/ahpd-web/`.

With `http.port` set, the API is on another origin and this page cannot reach it.

## Run it on its own

`ahpw serve` serves the page and carries its socket to any AHP daemon, ahpd or not:

```sh
ahpw serve --connect ws://127.0.0.1:37537 --token-file ~/.vscode/cli/agent-host-token
```

Then open `http://127.0.0.1:5190/`. With `--token` or `--token-file`, the server adds the token to the socket, the page asks for none, and the browser never sees it. Without one, the page asks for a token as it does on a daemon.

| Option | What it does |
| --- | --- |
| `--connect URL` | The daemon's AHP socket, `ws://` or `wss://` |
| `--token SECRET`, `--token-file PATH` | The token the server adds to the socket |
| `--host ADDR` | Bind here, default `127.0.0.1` |
| `--port N` | Listen here, default `5190` |
| `--open` | Open the page in a browser |

Each option can also be a key in `~/.config/ahpw/config.json`, spelled without the dashes (`tokenFile`). A flag beats the file.

The server takes a socket only from a page it served, reached by an address or `localhost`. Anyone who reaches the server uses the daemon with the token it adds, so it binds loopback unless `--host` says otherwise, and warns when it does. The administration screens need ahpd's `/api`, which `ahpw serve` does not carry.

## Develop

```sh
pnpm install
pnpm dev
```

`pnpm dev` serves on `http://127.0.0.1:5180` and proxies `/api`, and the AHP socket at `/ahp`, to `AHPD_URL`, default `http://127.0.0.1:9187`. The daemon needs `"http": true`.

To load a local build into a daemon:

```sh
pnpm build
ahpd run --plugin /path/to/ahpd-web
```

| Script | What it does |
| --- | --- |
| `pnpm dev` | Vite, with `/api` and the socket proxied to a daemon |
| `pnpm build` | The page into `dist/app`, the plugin into `dist/plugin`, the CLI into `dist/cli` |
| `pnpm typecheck` | Every TypeScript project |
| `pnpm test` | The request mapping, the static route, the socket address and the session status |

## Layout

| Path | What it is |
| --- | --- |
| `plugin/` | The ahpd plugin: one route serving `dist/app` |
| `cli/` | `ahpw serve`: the same route on its own server, and the socket proxy |
| `src/manifest/` | The manifest's types, commands to forms and requests, the store provider |
| `src/commands/` | The command list, the command page, the result view |
| `src/connection/` | The AHP connection: one client for the daemon, followed channels, the socket address |
| `src/sessions/` | The sessions list, a new session, and a session's chat |
| `src/automations/` | The automations list and an automation's page |
| `src/host/` | The host's settings |
| `src/token-provider.ts` | Sign-in with a token |

## License

MIT
