# Serve

`ahpw serve` serves the page on its own server and passes the socket through to an AHP server.

```sh
ahpw serve --connect ws://127.0.0.1:9187 --token-file ~/.config/ahpd/token
```

Then open `http://127.0.0.1:5190/`.

## The token

- **With a token**, the server adds it to the socket. The page asks for nothing, and the browser never sees the token.
- **Without one**, the page asks for a token, as it does in ahpd. See [Sign in](SIGN-IN.md).

A `tkn=` in the `--connect` URL counts as the token.

## Options

Every option is in the [CLI reference](../reference/CLI.md). Every option can also go in the [config file](../reference/CONFIG-FILE.md), and the server is read from the [environment](../reference/ENVIRONMENT.md) when neither names it.

A flag beats the file, and the file beats the environment.

## Security

- The server binds `127.0.0.1` by default. Anyone who reaches it uses the AHP server with your token, so it warns when `--host` opens it up.
- It takes a socket only from a page it served, at an IP address or `localhost`.
- It warns when the token goes in cleartext (`ws://`) to another machine.
