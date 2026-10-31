---
title: An embedder shows ahpw's alerts
status: implemented
depends: []
layer: "shell embed"
refs:
  - "[code://src/shell/embed/index.ts#L84-L120](../../../../src/shell/embed/index.ts#L84-L120) - `Embedder`, the contract to widen"
  - "[code://src/shell/notify/browser-channel.ts](../../../../src/shell/notify/browser-channel.ts) - the channel to copy"
  - "[code://src/shell/notify/index.ts#L13-L33](../../../../src/shell/notify/index.ts#L13-L33) - where the channels are registered"
---

## Objective

The embed contract has an optional `notifications`.
When the embedder gives one, ahpw sends its alerts there and not to `window.Notification`.

## Files

- `UPDATE: src/shell/embed/index.ts` - an `EmbedNotifications` with `show({ title, body?, tag })`, and the optional `notifications` member.
- `UPDATE: src/shell/embed/index.test.ts` - the contract reads `notifications`, and reads none.
- `CREATE: src/shell/notify/embed-channel.ts` - a channel over `embedder.notifications`, with the away rule of the browser channel.
- `CREATE: src/shell/notify/embed-channel.test.ts` - the cases below.
- `UPDATE: src/shell/notify/index.ts:13-33` - register the embedder channel in place of the browser channel when `embedder.notifications` is present.

## Steps

1. Add `EmbedNotifications` and the optional `notifications` member, with no imports, as the contract's other types.
2. Copy `ALERT_TYPES`, `handles` and the away rule of the browser channel into the embedder channel.
3. In `present`, call `embedder.notifications.show` with the alert's title, body and the tag of the browser channel.
4. Register the embedder channel when `embedder?.notifications` is present, and the browser channel when it is absent.
5. Hide `notifications.enableAlerts` when `embedder?.notifications` is present.
6. Add a test that `show` gets an alert when the window is away, and none when it has focus.

## Validation

- `index.test.ts` and `embed-channel.test.ts` pass.
- `pnpm typecheck` and `pnpm test` pass.
- By hand: a fake `notifications` set before ahpw loads gets `show` for a waiting session.
