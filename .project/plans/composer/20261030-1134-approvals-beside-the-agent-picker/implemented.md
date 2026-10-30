---
title: Approvals beside the agent picker - implemented
date: 2026-10-30
refs:
  - git://e8fcba5
  - git://3fc0d52
  - "[code://src/resources/sessions/pill-labels.ts](../../../../src/resources/sessions/pill-labels.ts)"
  - "[code://src/resources/sessions/New.tsx](../../../../src/resources/sessions/New.tsx)"
---

In the new session box, the Approvals pill sits in the footer after the agent picker, as in the session composer.
The other whole-session settings stay on the line above the box.

## What was built

- [`code://src/resources/sessions/pill-labels.ts`](../../../../src/resources/sessions/pill-labels.ts) - `APPROVALS_KEY` and `isApprovals`; `settingIcon` uses the key.
- [`code://src/resources/sessions/New.tsx`](../../../../src/resources/sessions/New.tsx) - the line above skips Approvals, and the footer draws it after `AgentPicker`.

## Verified

- `pill-labels.test.ts` checks `isApprovals` for `permissionMode` and for another key.
- `pnpm typecheck`, `pnpm test` (645 passed) and `pnpm build` pass; CI on PR #22 passes.
- Checked by hand at 1280 light and 420 dark against the host on 37537, with the Claude (DeepSeek) build harness.

## Departures from the plan

- None.

## Left for later

- None.
