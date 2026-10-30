---
title: The focused session tab sets the active session
status: done
depends: []
layer: "sessions"
refs:
  - "[code://src/resources/sessions/index.ts#L235-L251](../../../../src/resources/sessions/index.ts#L235-L251) - the mount key a session tab has"
  - "[code://src/resources/sessions/state.ts#L4](../../../../src/resources/sessions/state.ts#L4) - the path to write"
---

## Objective

When the main surface's active tab is a session, `ACTIVE_SESSION` names that session.

## Files

- `CREATE: src/resources/sessions/focus.ts` - `sessionOfKey`, which reads host and resource from a `session:<host>:<resource>` key, and `followFocus`, which subscribes to the layout.
- `CREATE: src/resources/sessions/focus.test.ts` - cases for `sessionOfKey`.
- `UPDATE: src/resources/sessions/index.ts` - register `followFocus` with the other disposables.

## Steps

1. Write `sessionOfKey(key)`, which returns `{ host, resource }` or null.
2. Split the key at its first two colons, so a resource URI keeps its own colons.
3. Write `followFocus(scena)` over `scena.layout.subscribe`.
4. Read `layout.surfaces.main.activeContainerKey` once at start and on each change.
5. Set `ACTIVE_SESSION` when the key is a session and differs from the stored value.
6. Leave `ACTIVE_SESSION` as it is when the focused tab is not a session.
7. Register the disposable in the sessions resource.

## Validation

- `focus.test.ts`: a session key, a resource with colons, a non-session key, an empty key.
- `pnpm typecheck` and `pnpm test` pass.
- By hand: open two sessions in two groups, click each tab, and watch Session Info change.

## Resume

- Built on 2026-10-29. `sessionKey` in `focus.ts` also builds the key, and `ahp.openSession` uses it.
- `focus.test.ts` also has a `followFocus` case: a session tab, a second session tab, then a tab that is not a session.
- Checked by hand on a test host at 1280 light and 760 dark: a tab click in either group changes Session Info and Changes.
