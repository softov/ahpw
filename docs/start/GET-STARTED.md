# Get started

ahpw is a client. It does not run agents or models. It connects to an AHP host, such as [ahpd](https://github.com/softov/ahpd), and shows what that host offers.

There are two ways to run it: as a plugin inside ahpd, or on its own with `ahpw serve` in front of any AHP server.

## Run it in ahpd

Install the plugin:

```sh
ahpd plugin install @ahpd/web
```

That installs it where the daemon looks for plugins and adds it to `plugins` in the configuration file. A plugin installed with `npm i -g` is not seen.

Turn on the API on the daemon's own port:

```json
{
  "http": true,
  "plugins": ["@ahpd/web"]
}
```

Then open `http://127.0.0.1:9187/plugins/web/`.

Keep `http.port` unset. On another port the API is on another origin, and the page cannot reach it.

## Run it on its own

::: code-group

```sh [npm]
npm i -g @ahpd/web
ahpw serve --connect ws://127.0.0.1:9187 --token-file ~/.config/ahpd/token
```

```sh [npx]
npx @ahpd/web serve --connect ws://127.0.0.1:9187 --token-file ~/.config/ahpd/token
```

:::

Then open `http://127.0.0.1:5190/`. Node 22 or later.

See [Serve](SERVE.md) for the options.

## Sign in

When the page has no token, it asks for one. See [Sign in](SIGN-IN.md).

<Shot id="sign-in" alt="The sign-in page, asking for a token" />

## Next

- The [window](../use/WINDOW.md): where everything is.
- [Sessions](../subjects/SESSIONS.md): start one and chat with an agent.
