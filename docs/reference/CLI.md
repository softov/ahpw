# CLI

```sh
ahpw serve [options]
```

| Option | What it does |
| --- | --- |
| `--connect URL` | The server's socket: `ws://`, `wss://`, `http://`, `https://` or `HOST:PORT` |
| `--token SECRET` | The token to add to the socket |
| `--token-file PATH` | Read the token from a file |
| `--host ADDR` | Bind here, default `127.0.0.1` |
| `--port N` | Listen here, default `5190`. `0` picks a free port |
| `--open` | Open the page in a browser once it is served |

`http://` and `https://` name the same port as `ws://` and `wss://`. A bare `HOST:PORT` is taken as `ws://HOST:PORT`.

A `tkn=` in the `--connect` URL counts as the token. Give one of `--token`, `--token-file` or a `tkn=`, not two.

A flag beats the [config file](CONFIG-FILE.md), and the file beats the [environment](ENVIRONMENT.md).
