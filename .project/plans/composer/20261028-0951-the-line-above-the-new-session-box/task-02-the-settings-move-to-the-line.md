---
title: The session settings move to the line above the box
status: implemented
depends: [task-01-a-mockup-of-the-line-and-box.md]
layer: "composer"
refs:
  - file:///github/ahpw/.scratch/mockups/new-session-line.html - the approved mockup
---

## Objective

The new session page matches the approved mockup.

## Files

- `UPDATE: src/resources/sessions/New.tsx:490-545` - draw the session settings on the line, the model and the chat settings in the box.
- `UPDATE: src/i18n/en.json` - remove `sessions/new/agentPill`, because the harness pill shows the name only.
- `UPDATE: src/i18n/es.json` - the same key removed.
- `UPDATE: src/i18n/pt.json` - the same key removed.

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

Built without a change to `app.css`, because the line wraps with the existing `.web-composer__where` style.
Checked at 1280 light and 760 dark: each pill opens its list, `<` folds, `>` unfolds, and the page does not scroll sideways.
