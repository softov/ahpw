---
title: A host keeps this browser's client id
status: implemented
depends: []
layer: bridges
refs:
  - "[code://src/bridges/data.ts#L765](../../../../src/bridges/data.ts#L765) - `new MultiHostClient()`"
  - "[code://src/shell/notify/confirm.ts#L16](../../../../src/shell/notify/confirm.ts#L16) - the `ahpw.` prefix of a `localStorage` key"
  - npm://@microsoft/agent-host-protocol@1.0.0 - `ClientIdStore`, with `load` and `store`
---

## Objective

ahpw gives a host the same client id after a reload, so the host can match this browser to the sessions it opened.

## Files

- `CREATE: src/bridges/client-ids.ts` - a `ClientIdStore` over `localStorage`, under `ahpw.clientId.<host id>`.
- `CREATE: src/bridges/client-ids.test.ts` - the store keeps an id, and works with no storage.
- `UPDATE: src/bridges/data.ts:765` - pass the store as `clientIdStore`.

## Steps

1. Implement `ClientIdStore` with `load` and `store` over `localStorage`.
2. Return nothing from `load` when `localStorage` throws, so the protocol makes a new id.
3. Pass the store to `new MultiHostClient({ clientIdStore })`.
4. Add a test that `store` then `load` returns the same id.
5. Add a test that a `localStorage` that throws gives no id and no error.

## Validation

- `src/bridges/client-ids.test.ts` passes.
- By hand: the client id in the host's log is the same before and after a reload.
