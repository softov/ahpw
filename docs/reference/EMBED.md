# Embedding

ahpw runs in three ways: as an ahpd plugin page, served by `ahpw serve`, or inside another app that loads the page and gives it its hosts.

## As an ahpd plugin

The package `@ahpd/web` is an ahpd plugin. Its `package.json` names the plugin entry, `dist/plugin/index.js`, with the title `Web`. The plugin's name is `web`.

The plugin serves the built page under `/plugins/web/` on the daemon's HTTP listener. A request for `/plugins/web` is redirected to `/plugins/web/`, because the page loads its files relative to its own address. Only `GET` and `HEAD` are answered.

`/plugins/web/ahpw.json` answers `{"tokenHeld":false}`: the daemon does not add the token to the socket, so the page asks you to sign in. `ahpw serve` answers the same file.

Every answer carries a content security policy that loads nothing from another origin and does not let another page frame ahpw, since the token sits in the page's storage. Built assets are cached for a year, and the page itself is checked on every load.

See [Get started](../start/GET-STARTED.md) to install and turn it on.

## Inside another app

An app can load the built page, `dist/app`, in its own window and give it hosts. Before ahpw's scripts run, the app sets `globalThis.ahpwEmbedder` to an object that follows the `Embedder` interface. Without that object, ahpw is a page in a browser and reads its host from the address bar.

The types are in `@ahpd/web/embed`, built to `dist/embed/index.js`. The file imports nothing, so an app can depend on the types alone.

```ts
import type { Embedder } from '@ahpd/web/embed';
```

### What the app gives

| Member | |
| --- | --- |
| `mode` | `mono`, one host in the window, or `multi`, every host the app knows. None means `mono` |
| `host()` | The host this page shows. In `multi`, the host the window was opened on |
| `hostUrl` | The address of that host, known before ahpw runs |
| `token(id?)` | The token of host `id`, else of the page's host, or `null` for none |
| `hosts()`, `onHosts(handler)` | Every host, and a call each time one is added, changed or removed |
| `statuses()`, `onStatuses(handler)` | Each host's status: `connected`, `connecting` or `down` |
| `switchHost(id)` | Move this page to another host. The app reloads it |
| `manageHosts(options?)` | Show the app's own place to add, edit and remove hosts. `{ add: true }` opens its form for a new one, `{ edit: id }` the form of that host |
| `onFocusHost(handler)` | Optional. In `multi`, a call when the app asks the window to show one host |
| `window` | Optional. Present when ahpw draws the window's frame |
| `profile` | Optional. Present when the app keeps the UI settings |

A host is `{ id, name, url }`, where `url` is the host's WebSocket address, such as `ws://127.0.0.1:9187`. A token is never part of it.

### What changes in ahpw

- ahpw connects to each host's `url` with the token the app gives, and reads both again on each connect. It keeps no token of its own and shows no sign-in page.
- **Sign out** is left out of the **Manage** menu.
- Every host shares the app's origin, so ahpw keeps each host's tabs, layout and folders under that host's address. A `multi` window keeps its own.
- The title bar shows a host menu. It lists each host with its status, then **Manage hosts** and **Add host**, which call `manageHosts`.
  - In `mono`, a pick calls `switchHost`.
  - In `multi`, the menu also has **All hosts**, and a pick shows only that host in the lists, as **Hosts** does in each list header. Each host's **Options for** menu has **Info**, **Settings**, **Sign in** or **Retry** while it is not connected, and **Edit host**.

### `window`

When the app draws no frame of its own, it gives `window` and ahpw draws one. The page gets rounded corners, square while maximized. The title bar's empty space drags the window, and a double click maximizes or restores it. **Minimize**, **Maximize** or **Restore**, and **Close** sit at the title bar's far end.

| Member | |
| --- | --- |
| `minimize()`, `toggleMaximize()`, `close()` | The window buttons |
| `startDragging()` | Called on a press in the title bar |
| `isMaximized()`, `onResized(handler)` | Whether the window fills the screen, and a call on each resize |

### `profile`

With `profile`, the app keeps the UI settings, such as theme and language, as one object keyed by setting, for example `{ "ui.theme": "default", "ui.language": "pt-BR" }`. ahpw reads it once at start, and what it holds wins. From then on ahpw writes the whole object on every change. Keys ahpw does not know are the app's to keep or drop. Without `profile`, the browser alone keeps them.
