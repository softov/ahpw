---
title: The session's views open from its "..." menu - implemented
date: 2026-10-30
refs:
  - git://369caea
  - "[code://src/shell/right-sidebar.ts](../../../../src/shell/right-sidebar.ts)"
  - "[code://src/resources/sessions/SessionHeader.tsx](../../../../src/resources/sessions/SessionHeader.tsx)"
---

The "..." menu in a session's header lists the views that `mountRight` holds, and New terminal in the session's folder.
The bot, Raw and Hide calls are in a second group, How the chat reads.

## What was built

- [`code://src/shell/right-sidebar.ts`](../../../../src/shell/right-sidebar.ts) - `viewEntries`, each view with its title and icon.
- [`code://src/resources/sessions/SessionHeader.tsx`](../../../../src/resources/sessions/SessionHeader.tsx) - the Views group, New terminal, and the How the chat reads group.

## Verified

- `right-sidebar.test.ts` covers `viewEntries`: the order, the title and icon, and a disposed view.
- `pnpm typecheck`, `pnpm test` and `pnpm build` pass on the branch, with 630 tests; CI on PR #20 passes.
- Checked by hand against the host on 37537 at 1280 light and 420 dark: both groups show, and Session and Changes open their tabs.
- New terminal was not clicked by hand, because it starts a terminal on the host.

## Departures from the plan

- None.

## Left for later

- None.
