---
title: A service worker shows a push
status: implemented
depends: []
layer: shell
refs:
  - "[code://plugin/static.ts#L5-L30](../../../../plugin/static.ts#L5-L30) - the types and the CSP"
  - "[code://src/resources/sessions/index.ts#L239-L265](../../../../src/resources/sessions/index.ts#L239-L265) - `ahp.openSession`"
  - "[code://index.html#L11](../../../../index.html#L11) - the icon link, where the manifest link goes"
  - https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerGlobalScope/push_event - the `push` event
  - https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerGlobalScope/notificationclick_event - the click, `clients.matchAll` and `clients.openWindow`
---

## Objective

`sw.js` shows a notification for every push.
A click opens the session in an ahpw window.
ahpw has a web app manifest, so iOS can add it to the Home Screen.

## Files

- `CREATE: public/sw.js` - the `push` and `notificationclick` handlers.
- `CREATE: public/manifest.json` - `name`, `short_name`, `icons`, `start_url: "./"` and `display: "standalone"`.
- `CREATE: public/icon-192.png` - the app icon at 192 pixels, from `src/shell/ahpio.svg`.
- `CREATE: public/icon-512.png` - the app icon at 512 pixels, from `src/shell/ahpio.svg`.
- `UPDATE: index.html:11` - add `<link rel="manifest" href="./manifest.json">`.
- `CREATE: src/shell/notify/open-from-address.ts` - open `?host=&session=` at start, and a session that `sw.js` sends.
- `UPDATE: src/shell/notify/index.ts` - call the module from `registerNotifications`.
- `CREATE: src/shell/notify/open-from-address.test.ts` - the address cases.

## Steps

1. In `sw.js`, read the push as JSON `{ title, body, data }`.
2. Call `showNotification` for every push, with `data.uri` and the host id from the scope.
3. Use the host id and `data.uri` as the notification's `tag`, so a repeat replaces it.
4. On a click, close the notification and find the open ahpw windows with `clients.matchAll`.
5. Focus the first window and send it `{ open: { host, session } }` with `postMessage`.
6. With no window, open `<base>/?host=<id>&session=<uri>` with `clients.openWindow`.
7. In `open-from-address.ts`, run `ahp.openSession` for `?host=` and `?session=` once the host connects.
8. Remove both parameters from the address with `history.replaceState`.
9. Run `ahp.openSession` for each `open` message from the service worker.
10. Add the manifest link to `index.html`.
11. Add tests for an address with both parameters, with one, and with none.

## Validation

- `pnpm build` puts `sw.js` and `manifest.json` at the root of `dist/app`.
- `curl -I` on `<base>/sw.js` from `ahpw serve` and from the daemon answers `text/javascript`.
- By hand: Chrome's DevTools shows the manifest with no errors.
- By hand: a push sent from DevTools shows a notification, and a click opens the session.
