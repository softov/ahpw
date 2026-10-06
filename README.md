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
| `pnpm build` | The page into `dist/app`, the plugin into `dist/plugin` |
| `pnpm typecheck` | Every TypeScript project |
| `pnpm test` | The request mapping, the static route, the socket address and the session status |

## Layout

| Path | What it is |
| --- | --- |
| `plugin/` | The ahpd plugin: one route serving `dist/app` |
| `src/manifest/` | The manifest's types, commands to forms and requests, the store provider |
| `src/commands/` | The command list, the command page, the result view |
| `src/connection/` | The AHP connection: one client for the daemon, followed channels, the socket address |
| `src/sessions/` | The sessions list, a new session, and a session's chat |
| `src/automations/` | The automations list and an automation's page |
| `src/host/` | The host's settings |
| `src/token-provider.ts` | Sign-in with a token |

## License

MIT
