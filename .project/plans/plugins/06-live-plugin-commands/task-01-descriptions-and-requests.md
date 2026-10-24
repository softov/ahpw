---
title: The host's description of each command, and the two new requests
status: done
depends: []
layer: "ahpw bridges"
refs:
  - "[code://src/bridges/offers.ts](../../../../src/bridges/offers.ts) - `offersOf`"
  - "[code://src/bridges/plugins.ts](../../../../src/bridges/plugins.ts) - the plugin requests"
  - file:///github/ahpd/packages/sdk/src/host/root.ts - the shape of an `ahpd.methods` entry
---

## Objective

`Offers` carries each command's description from the host.
The bridge sends `x-ahpd/plugins/reload` and `x-ahpd/plugins/apply`.

## Files

- `UPDATE: src/bridges/offers.ts` - `described`, each method's description by its name.
- `UPDATE: src/bridges/offers.test.ts` - a method with a description, and one with none.
- `UPDATE: src/bridges/plugins.ts` - `PLUGINS.reload`, `PLUGINS.apply`, `reloadPlugin`, `applyPlugins`, and comments that say the host applies a change at once.

## Steps

1. Add `described: Record<string, string>` to `Offers`, from each `ahpd.methods` entry that has a `description`.
2. Set `described` to `{}` in `NO_OFFERS`.
3. Add `reload` and `apply` to `PLUGINS`.
4. Add `reloadPlugin(host, id)` and `applyPlugins(host)`.
5. Change the comments on the requests to say the host applies a change at once, unless the reply says `restart`.

## Validation

- `src/bridges/offers.test.ts` passes.
- `npx tsc -b` passes.

## Resume
