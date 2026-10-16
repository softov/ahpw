---
title: A host's offers are in the store
status: done
depends: []
layer: "src/bridges"
refs:
  - "[code://src/bridges/server-info.ts](../../../../../src/bridges/server-info.ts) - `serverInfoOf` and `readingServerInfo`"
  - "[code://src/bridges/data.ts#L568](../../../../../src/bridges/data.ts#L568) - `AhpPaths`, and the transport factory that sets `server`"
---

## Objective

`ahpPaths(host).offers` holds what the host's `initialize` answer names under `ahpd.methods`, `ahpd.channels` and `ahpd.resourceProviders`.
Helpers say whether a host serves a method, a channel or a resource provider.

## Files

- `CREATE: src/bridges/offers.ts` - `Offers { methods: string[]; channels: string[]; providers: Record<string, Provider> }`, `Provider { title; root; operations; manifest? }`, `offersOf(message)`, `servesMethod`, `servesChannel`, `providerOf`.
- `UPDATE: src/bridges/server-info.ts` - `readingServerInfo` also hands `offersOf(frame)` to a second callback when the frame is an `initialize` answer.
- `UPDATE: src/bridges/data.ts:15-70` - `offers` in `AhpPaths`; the transport factory at line 568 sets it.

## Steps

1. Write `offersOf`, reading `result._meta` with `ahpdKey`, accepting a list or a map for methods and channels, as ahpapp's `servesMethod` does.
2. Set `ahpPaths(id).offers` from the transport factory.
3. Write `offers.test.ts`.

## Validation

- `src/bridges/offers.test.ts`: it reads a list and a map; no `_meta` gives empty offers.
- The same test: it keeps a provider's `manifest`.
- `pnpm test` and `pnpm typecheck` pass.
- By hand: the store holds the offers of a host with both plugins installed.

## Resume

- Done 2026-10-16: `offers.ts`, `answerMetaOf` in `server-info.ts`, `ahpPaths(host).offers`.
- ahpd 27fbbc75 with both plugins: the `initialize` answer names the methods, channels and providers `offersOf` reads.
- The store check by hand moves to p2, where the computers entry shows only on a host that serves it.
