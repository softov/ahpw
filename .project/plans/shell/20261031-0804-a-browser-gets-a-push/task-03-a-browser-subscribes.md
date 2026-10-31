---
title: A browser subscribes to a host's push
status: todo
depends: [task-01-a-host-keeps-the-client-id.md, task-02-a-service-worker-shows-a-push.md]
layer: shell
refs:
  - "[code://src/shell/notify/index.ts#L36-L64](../../../../src/shell/notify/index.ts#L36-L64) - `notifications.enableAlerts`, the command to copy"
  - "[code://src/shell/notify/browser-channel.ts](../../../../src/shell/notify/browser-channel.ts) - `granted`, `canAsk` and `requestAlerts`"
  - "[code://src/bridges/data.ts#L546-L560](../../../../src/bridges/data.ts#L546-L560) - `greet`"
  - "[code://src/bridges/offers.ts#L66-L81](../../../../src/bridges/offers.ts#L66-L81) - `offersOf`, the host's `push` root"
  - https://www.w3.org/TR/push-api/ - `subscribe`, `getSubscription`, `unsubscribe` and `toJSON`
---

## Objective

A person turns push on from the palette.
ahpw subscribes on every host that serves `push`, and writes its device there.
The person can switch the device between `person` and `device`, and turn push off.

## Files

- `CREATE: src/shell/notify/push.ts` - subscribe, write and remove the device on one host, and on every host.
- `CREATE: src/shell/notify/push.test.ts` - the cases below, with a fake `PushManager` and a fake host.
- `UPDATE: src/shell/notify/index.ts` - the three commands.
- `UPDATE: src/bridges/data.ts:546-560` - `greet` calls the push module for the host.
- `UPDATE: src/i18n/en.json` - the command titles and the notices.
- `UPDATE: src/i18n/es.json` - the command titles and the notices.
- `UPDATE: src/i18n/pt.json` - the command titles and the notices.

## Steps

1. Make one install id at the first use, and keep it as `ahpw.pushInstall`.
2. For one host, skip it when its offers have no `push` provider that allows `write`.
3. Read `push://vapid` and take `publicKey`.
4. Register `sw.js` with the scope `<base>/push/<host id>/`.
5. Call `getSubscription()`, and call `subscribe({ userVisibleOnly: true, applicationServerKey })` when it gives nothing.
6. Unsubscribe and subscribe again when the subscription's key differs from `publicKey`.
7. Write `push://devices/<install id>` with `platform: 'web'`, `endpoint`, `keys`, `lang` and `audience`.
8. Run the steps of one host for each connected host in `notifications.enablePush`, after `requestAlerts`.
9. Set `ahpw.push` to `on` when one host or more succeeds.
10. In `greet`, run the steps of one host when `ahpw.push` is `on` and the permission is `granted`.
11. In `notifications.disablePush`, remove the device and unsubscribe on each host, then remove `ahpw.push`.
12. In `notifications.pushAudience`, flip `ahpw.pushAudience` and write the device again on each host.
13. Name the command by the value it sets, as `notifications.confirmStyle` does.
14. Hide the three commands when `embedder` is present or `PushManager` is absent.
15. Publish one notice with the count of hosts that succeeded and that failed.
16. Add tests for a first subscribe, a changed key, a host with no `push`, turn off, and the audience switch.

## Validation

- `src/shell/notify/push.test.ts` passes.
- By hand, with the ahpd plan built: `resourceRead push://devices/<install id>` on the host shows `platform: web` and the `audience`.
- By hand: a reload keeps the same `endpoint` on the host.
