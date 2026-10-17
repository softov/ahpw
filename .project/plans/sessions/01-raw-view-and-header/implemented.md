---
title: Raw view and header buttons - implemented
date: 2026-10-16
refs:
  - "[code://src/resources/sessions/raw.ts](../../../../src/resources/sessions/raw.ts)"
  - "[code://src/resources/sessions/RawView.tsx](../../../../src/resources/sessions/RawView.tsx)"
  - "[code://src/resources/sessions/header.ts](../../../../src/resources/sessions/header.ts)"
  - "[code://src/resources/sessions/SessionHeader.tsx](../../../../src/resources/sessions/SessionHeader.tsx)"
---

The session page has a Raw view, toggled from its header, where each step of the chat is one row that opens in place.
Its header carries buttons for changed files, terminals, subagents and the chat switcher, each shown only when it has something to count.

## What was built

- [`code://src/resources/sessions/raw.ts`](../../../../src/resources/sessions/raw.ts) - `rawOf(turns, active)`: each turn's message as step 1, then each response part in order, blank text left out, each with the object the host sent; `shownSteps(steps, filter)` for all steps, tool calls or subagents.
- [`code://src/resources/sessions/RawView.tsx`](../../../../src/resources/sessions/RawView.tsx) - the filter chips, a heading and fact line per turn, `StepRow` opening in place to its facts, arguments, outputs and the host's JSON, and the turn's own JSON under a fold.
- [`code://src/resources/sessions/header.ts`](../../../../src/resources/sessions/header.ts) - `claimedTerminals` and `subagentsOf`; only the turn in flight has subagents running.
- [`code://src/resources/sessions/SessionHeader.tsx`](../../../../src/resources/sessions/SessionHeader.tsx) - `SessionHeaderTools`: `+a −d` opens the Changes tab, `❯ N` opens the one terminal or the Session tab, subagents open the Raw view on its subagents filter, `i/N ▾` picks a chat, and the Raw toggle.
- [`code://src/resources/sessions/Parts.tsx`](../../../../src/resources/sessions/Parts.tsx) - `MARK`, `KIND_ICON`, `ToolLine`, `Block` and `OutputView` exported for the Raw view.
- [`code://src/resources/sessions/Page.tsx`](../../../../src/resources/sessions/Page.tsx) - the head row with the tools, the chosen chat, and the Raw view in place of the turns.
- The `sessions/raw` and `sessions/header` words in en, es and pt, and the `web-raw` and `web-chat__tool` styles.

## Verified

- `src/resources/sessions/raw.test.ts`: 4 tests; `pnpm test` 427 pass, `pnpm typecheck` passes.
- On a scratch ahpd 0.12.0 host with a fake model: a session asked to write `a.ts`; after Allow once, Raw showed turn 1 as the message, the `write_file` call and the reply; the call opened in place to its facts, arguments, output and the host's JSON; the tool-calls filter kept the call with its step number, the subagents filter showed the empty note; a terminal opened in the session's folder brought `❯ 1` to the header.
- At 390 px wide the header and the Raw view fit without overflow.

## Departures from the plan

- The tests for `header.ts` live in `raw.test.ts` rather than a `header.test.ts`.

## Left for later

- See [deferred.md](deferred.md).
