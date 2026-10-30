---
title: Approvals sits after the agent picker
status: done
depends: []
layer: "composer"
refs:
  - "[code://src/resources/sessions/New.tsx#L543](../../../../src/resources/sessions/New.tsx#L543) - the tray's whole-session settings"
  - "[code://src/resources/sessions/New.tsx#L600](../../../../src/resources/sessions/New.tsx#L600) - the footer's agent picker"
---

## Objective

In the new session box, the Approvals pill shows in the footer after the agent picker, and not on the line above.

## Files

- `UPDATE: src/resources/sessions/pill-labels.ts:13-14` - export `APPROVALS_KEY` and `isApprovals(option)`; `settingIcon` uses the key.
- `UPDATE: src/resources/sessions/pill-labels.test.ts` - a case for `isApprovals`.
- `UPDATE: src/resources/sessions/New.tsx:543` - the tray skips Approvals.
- `UPDATE: src/resources/sessions/New.tsx:600` - the footer draws Approvals after the agent picker.

## Steps

1. Add `APPROVALS_KEY` and `isApprovals` to `pill-labels.ts`, and use the key in `settingIcon`.
2. Make the tray draw the whole-session settings that are not Approvals.
3. Draw the Approvals setting with `settingPill` after `AgentPicker` in the footer's left side.
4. Add the `isApprovals` case to `pill-labels.test.ts`.

## Validation

- `src/resources/sessions/pill-labels.test.ts` - `isApprovals` is true for `permissionMode` and false for another key.
- `pnpm typecheck` and `pnpm test` pass.
- By hand at 1280 light and 420 dark, check the footer order and that the tray has no Approvals.
- By hand, check that the Approvals pill opens its list and that a pick shows on the pill.

## Resume

Checked on Vite against the host on 37537, with the Claude (DeepSeek) build harness, which sends Approvals.
At 1280 light the footer reads `+`, Agent, Approvals: Ask Before Edits, and the line above has no Approvals.
At 420 dark the pill shows its icon alone.
A pick of Edit Automatically shows on the pill.
`pnpm typecheck`, `pnpm test` (645 passed) and `pnpm build` pass.
