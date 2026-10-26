# Config file

`ahpw serve` reads `~/.config/ahpw/config.json`. Every [option](CLI.md) can go in it, spelled the same without the dashes:

```json
{
  "connect": "ws://127.0.0.1:9187",
  "tokenFile": "~/.config/ahpd/token",
  "port": 5190
}
```

| Key | Type |
| --- | --- |
| `connect` | string |
| `token` | string |
| `tokenFile` | string. A `~` at the start is your home folder |
| `host` | string |
| `port` | integer |
| `open` | boolean |

A key `serve` does not take, or a value of the wrong type, stops it with an error. Keep one of `token` and `tokenFile`.

A flag beats the file, and the file beats the [environment](ENVIRONMENT.md).
