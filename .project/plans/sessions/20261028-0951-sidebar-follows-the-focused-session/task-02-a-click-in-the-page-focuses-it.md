---
title: A click inside a session page makes it the focused tab
status: todo
depends: [task-01-the-focused-tab-sets-the-session.md]
layer: "sessions"
refs:
  - "[code://src/resources/sessions/Page.tsx#L210-L212](../../../../src/resources/sessions/Page.tsx#L210-L212) - the page's mount effect, which this task replaces"
---

## Objective

A pointer down anywhere in a session page makes its tab the main surface's active tab, so task 01 sets the session.

## Files

- `UPDATE: src/resources/sessions/Page.tsx:210-212` - remove the write on mount; add a pointer handler on the page root.

## Steps

1. Add `onPointerDownCapture` on the root element of `SessionPage`.
2. Skip the handler when the page's key is already `activeContainerKey`.
3. Set the main surface's `activeContainerKey` to `session:<host>:<resource>` with `scena.layout.setSurface`.
4. Remove the mount effect that writes `ACTIVE_SESSION` only while it is empty.

## Validation

- `pnpm typecheck` and `pnpm test` pass.
- By hand: two sessions in two groups; a click in the text of either changes Session Info.
- By hand: a click in a page does not steal the caret from its composer.
- By hand: a reload restores the focused tab and Session Info shows it.

## Resume
