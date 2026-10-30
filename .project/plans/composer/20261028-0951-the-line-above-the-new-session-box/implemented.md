---
title: The settings move to a line above the new session box - implemented
date: 2026-10-30
refs:
  - git://5885c6c
  - git://7e4edfe
  - "[code://src/resources/sessions/New.tsx#L540-L551](../../../../src/resources/sessions/New.tsx#L540-L551)"
  - "[code://src/resources/sessions/footer.ts#L11](../../../../src/resources/sessions/footer.ts#L11)"
---

The new session box takes VS Code's layout. The line above the box holds the folder, then the session settings in the order the host sends. The harness pill comes last, with its icon and name. The box holds the model and the chat settings. The fold button draws `<`, and the folded line puts `>` at its right end.

## What was built

- [`code://src/resources/sessions/New.tsx`](../../../../src/resources/sessions/New.tsx) - the line holds the folder pill, the left settings of `footerSide`, the harness pill and the fold button. The box holds the model and the right settings.
- [`code://src/resources/sessions/Composer.tsx`](../../../../src/resources/sessions/Composer.tsx) - Esc on a list that a pill opened removes the command that the pill typed.
- [`code://src/i18n/en.json`](../../../../src/i18n/en.json), [`code://src/i18n/es.json`](../../../../src/i18n/es.json) and [`code://src/i18n/pt.json`](../../../../src/i18n/pt.json) - `sessions/new/agentPill` is removed.
- The line wraps with the existing `.web-composer__where` style, so `app.css` did not change.

## Verified

- Softov approved the mockup on 2026-10-29.
- `pnpm typecheck` and `pnpm test` passed, and CI passed on PR #18.
- By hand at 1280 light and 760 dark: each pill opens its list, `<` folds, `>` unfolds, and the page does not scroll sideways.
- Not verified: a session starts with the settings from the line. That check waits in [composer-line-start-check.md](../../../pending/composer-line-start-check.md).

## Departures from the plan

- Esc takes back a pill's command. The plan did not name it; it shipped in the same commit.

## Left for later

- Nothing.
