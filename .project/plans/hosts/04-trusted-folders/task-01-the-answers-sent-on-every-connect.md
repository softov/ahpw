---
title: The answers, sent on every connect
status: done
depends: []
layer: "src/bridges"
refs:
  - "[code://src/bridges/data.ts](../../../../src/bridges/data.ts) - the connect event, the event loop, and `HostBridge`"
  - "[code://src/resources/folders/added.ts](../../../../src/resources/folders/added.ts) - the per-host store-and-storage pattern"
  - file:///github/ahpapp/src/trust-store.ts - the shape copied
---

## Objective

Each host's trust answers live in the store and in this browser's storage, and the folders answered yes go to the host on every connect.
A push can be waited on: it settles when the host echoes it, with the host's refusal if there is one.

## Files

- `CREATE: src/bridges/trust.ts` - `trustPath(host)`, `readTrust(host)`, `answerOf(answers, folder)`, `withAnswer`, `withoutAnswer`, `trustedUris(answers)`, `trustAction(uris)`, `pushTrust(host, uris)`, `keepAnswer(store, host, answers)`.
- `CREATE: src/bridges/trust.test.ts`.
- `UPDATE: src/bridges/data.ts` - `HostBridge.dispatchAndWait(channel, action): Promise<string | null>`, matched to its echo by client sequence; on `connected`, load the host's answers and push the yes list when there is one.

## Steps

1. Keep answers as `{ [folderUri]: boolean }` under `perHostKey('ahpd-web.trust', host)`, the folder spelled by `bare`.
2. `dispatchAndWait` sends through the host's client, keeps a waiter keyed by host, channel and `clientSeq`, and settles it from the event loop with the echo's `rejectionReason`, or rejects after 15 seconds.
3. On `connected`, read the answers into the store and push the yes list if it is not empty.

## Validation

- `trust.test.ts`: one spelling per folder, a no kept but not sent, the action's shape, removing an answer.
- `pnpm test` and `pnpm typecheck` pass.

## Resume
