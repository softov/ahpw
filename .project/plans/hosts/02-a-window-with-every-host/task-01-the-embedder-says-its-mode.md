---
title: The embedder says its mode, and gives each host's token
status: done
depends: []
layer: "src/shell/embed, src/lib"
refs:
  - "[code://src/shell/embed/index.ts#L35-L65](../../../../src/shell/embed/index.ts#L35-L65) - `Embedder`: one `token()`, and `manageHosts` with only `add`"
  - "[code://src/lib/storage-keys.ts#L9-L11](../../../../src/lib/storage-keys.ts#L9-L11) - `hostKey`, scoped by `embedder.hostUrl`"
---

## Objective

The embedder contract says whether the window shows one host or every host.
It gives the token of any host it names, opens the desk's form on one host, and asks the window to show one host.

## Files

- `UPDATE: src/shell/embed/index.ts:35-65` - add `readonly mode?: 'mono' | 'multi'`, absent meaning mono; `token(id?: string)`, the page's host without an id; `manageHosts(options?: { add?: boolean; edit?: string })`; `onFocusHost?(handler: (id: string) => void): Unsubscribe`, when the desk asks the window to show one host.
- `UPDATE: src/lib/storage-keys.ts:9-11` - `hostKey` keys a multi window as `${key}@*`, since that window has no one address.
- `UPDATE: src/shell/embed/index.test.ts` - a case for a contract with no `mode`.
- `UPDATE: src/lib/storage-keys.test.ts` - a case for the multi key.

## Steps

1. Add `mode`, the `id` of `token`, `edit` of `manageHosts` and `onFocusHost` to `Embedder`, each with its comment.
2. Export `embedMode(): 'mono' | 'multi'`, which reads `embedder?.mode ?? 'mono'`.
3. Make `hostKey` return `${key}@*` when `embedMode()` is `multi`.
4. Keep every current caller of `token()` without an id, so mono does not change.

## Validation

- `src/shell/embed/index.test.ts` and `src/lib/storage-keys.test.ts` pass with the new cases.
- `pnpm typecheck` passes, including `tsconfig.embed.json`, the published contract.

## Resume

- Done 2026-10-16: `Embedder` has `mode`, `token(id?)`, `manageHosts({ edit })` and `onFocusHost`; `embedMode()` reads an absent mode as mono.
- `hostKey` keys a multi window as `<key>@*`.
- Verified: new cases in `src/shell/embed/index.test.ts` and `src/lib/storage-keys.test.ts`; `pnpm typecheck` passes, `tsconfig.embed.json` included.
