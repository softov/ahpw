---
title: A browser gets a push - implemented
date: 2026-10-31
refs:
  - git://c61b638
  - "[code://src/shell/notify/push.ts](../../../../src/shell/notify/push.ts)"
  - "[code://public/sw.js](../../../../public/sw.js)"
  - "[code://src/shell/notify/embed-channel.ts](../../../../src/shell/notify/embed-channel.ts)"
---

ahpw can get a notification from its host with no tab open, through the browser's Web Push service. A click on it opens the session in ahpw. Each browser chooses whether it hears every session of its person or only the sessions it opened. In an embedder that gives `notifications`, ahpw hands its alerts to the embedder and offers no push.

## What was built

- [`code://src/bridges/client-ids.ts`](../../../../src/bridges/client-ids.ts) - the client id per host in `localStorage`, as `ahpw.clientId.<host id>`, given to `MultiHostClient` in [`code://src/bridges/data.ts`](../../../../src/bridges/data.ts).
- [`code://public/sw.js`](../../../../public/sw.js) - shows each push and opens or focuses ahpw on a click.
- [`code://public/manifest.json`](../../../../public/manifest.json) - the manifest, with `icon-192.png` and `icon-512.png` drawn from `ahpio.svg`, linked from `index.html`.
- [`code://src/shell/notify/open-from-address.ts`](../../../../src/shell/notify/open-from-address.ts) - opens the session that `?host=&session=` or a service worker message names, once its host is connected.
- [`code://src/shell/notify/push.ts`](../../../../src/shell/notify/push.ts) - subscribes with `push://vapid`, writes `push://devices/<install id>`, removes it, switches the audience, and writes the device again on each connect.
- [`code://src/shell/notify/index.ts`](../../../../src/shell/notify/index.ts) - the commands `notifications.enablePush`, `notifications.disablePush` and `notifications.pushAudience`, and the alert channel choice.
- [`code://src/shell/embed/index.ts`](../../../../src/shell/embed/index.ts) - `EmbedNotifications` and the optional `notifications` member.
- [`code://src/shell/notify/embed-channel.ts`](../../../../src/shell/notify/embed-channel.ts) - the alerts to `embedder.notifications.show`, while the reader is away.
- [`code://docs/use/INTERFACE.md`](../../../../docs/use/INTERFACE.md) and [`code://docs/use/PALETTE.md`](../../../../docs/use/PALETTE.md) - *With the tab closed*, and the three commands.

## Verified

- `pnpm typecheck` is clean.
- `pnpm vitest run` passes 126 files and 677 tests, with `client-ids.test.ts`, `open-from-address.test.ts`, `push.test.ts`, `embed-channel.test.ts` and the new cases in `embed/index.test.ts`.
- `pnpm build` puts `sw.js`, `manifest.json` and both icons in `dist/app`, and the built `index.html` links the manifest.
- No real push was sent here. The checks by hand are in [push-browser-checks.md](../../../pending/push-browser-checks.md).

## Departures from the plan

- Push is on for the window's host only, not for every connected host. Without an embedder ahpw has one host, `windowHost()`, so one host is every host there is. A command reports one result, not a count.
- The connect hook is `keepPushing` in `push.ts`, which watches the host's connection in the store. `greet` in `data.ts` is not changed, so the bridge does not import the notify shell.
- `sw.js` uses the tag of the page's session alert, `session-alert:<host>:<session>`. A push and a page alert for one session replace each other.
- `notifications.enablePush` is hidden while push is on, and the other two are hidden while it is off.
- The away rule and the alert test are shared from `browser-channel.ts` as `watchAway` and `isAlert`, not copied into the embedder channel.

## Left for later

- Nothing.
