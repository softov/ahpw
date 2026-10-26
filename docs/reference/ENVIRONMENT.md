# Environment

`ahpw serve` reads these below the [flags](CLI.md) and the [config file](CONFIG-FILE.md):

| Variable | |
| --- | --- |
| `AHPD_URL` | The server's socket |
| `AHPD_HOST` | The server's socket, when `AHPD_URL` is not set |
| `AHPD_TOKEN` | The token, when the socket has no `tkn=` |

A flag or the file that gives a socket or a token replaces the one from here.

```sh
AHPD_URL="ws://127.0.0.1:9187/?tkn=$(cat ~/.config/ahpd/token)" ahpw serve
```
