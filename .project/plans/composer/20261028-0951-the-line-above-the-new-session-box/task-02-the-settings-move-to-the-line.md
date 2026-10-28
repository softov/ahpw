---
title: The session settings move to the line above the box
status: todo
depends: [task-01-a-mockup-of-the-line-and-box.md]
layer: "composer"
refs:
  - file:///github/ahpw/.scratch/mockups/new-session-line.html - the approved mockup
---

## Objective

The new session page matches the approved mockup.

## Files

- `UPDATE: src/resources/sessions/New.tsx:490-545` - draw the session settings on the line, the model and the chat settings in the box.
- `UPDATE: src/style/app.css` - the line, its wrap and the fold button.
- `UPDATE: src/i18n/en.json` - `sessions/new/agentPill` without "Agent"; the same keys in `es.json` and `pt.json`.

## Steps

1. Draw the left settings of `footerSide` on the line, after the folder pill.
2. Draw the harness pill last on the line, with its name only.
3. Draw the fold button with `<`.
4. Keep the `+`, the model, the right settings, the context size and send in the box.
5. Leave room in the box for the agent picker of plan `a-custom-agent-picker`.
6. Compare the page with the mockup at 1280 and 760 wide, in both themes.

## Validation

- `pnpm typecheck` and `pnpm test` pass.
- By hand: the page matches the mockup; any difference means stop and ask.

## Resume
