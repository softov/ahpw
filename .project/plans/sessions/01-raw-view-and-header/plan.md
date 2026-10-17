---
title: Raw view and header buttons
domain: sessions
status: built
priority: medium
created: 2026-10-16
revalidated: 2026-10-16
refs:
  - "[code://src/resources/sessions/Page.tsx#L165-L259](../../../../src/resources/sessions/Page.tsx#L165-L259) - `SessionPage`: the header at 209-215, the turns, the default chat"
  - "[code://src/resources/sessions/Parts.tsx#L137-L183](../../../../src/resources/sessions/Parts.tsx#L137-L183) - `ToolCall`: the in-place pattern, `ToolLine`, `KIND_ICON`, `OutputView`"
  - "[code://src/resources/sessions/tool.ts](../../../../src/resources/sessions/tool.ts) - `kindOf`, `outcomeOf`, `lineOf`, `inputOf`, `outputOf`, `durationOf`"
  - "[code://src/resources/sessions/Details.tsx#L16-L26](../../../../src/resources/sessions/Details.tsx#L16-L26) - a terminal is the session's while its directory is in the session's folder"
  - "[code://src/shell/right-sidebar.ts](../../../../src/shell/right-sidebar.ts) - `ahp.showRight.<key>` opens a right-sidebar tab"
  - "[code://src/resources/sessions/Explorer.tsx#L129](../../../../src/resources/sessions/Explorer.tsx#L129) - the changes line from `SessionSummary.changes`"
  - file:///github/ahpapp/src/session-analysis.ts - `rawOf`: a turn's message and each response part as a step, with the host's own object
  - file:///github/ahpapp/src/components/RawView.tsx - `RawList`, `StepDetail`: the row and what a step shows
  - file:///github/ahpapp/app/session.tsx - the header's changes chip, terminals chip and chat switcher
  - file:///github/ahpapp/src/terminal-sessions.ts - a terminal is the session's when its claim names it
---

## Goal

The session page gets a Raw view, as ahpapp has, where every step of the chat is one row and opens in place to what the host sent for it.
Its header gets buttons, as ahpapp's has: changed files, terminals, subagents, and a chat switcher when there is more than one chat.

## Reconnaissance

The files read and the patterns to reuse are the `refs` above, each with its note.

### Runtime path

```
header Raw button -> page shows RawView(chat) instead of the turns -> a row -> expands in place
header +a -d -> ahp.showRight.changes:explorer
header terminals N -> one: ahp.openTerminal; more: ahp.showRight.session:details
header subagents n/N -> Raw view, showing subagent steps
header chat i/N -> the page shows that chat
```

## Answers

| What | Source | Task |
| --- | --- | --- |
| The new view is a Raw view: one row per step, and a row opens in place to its input, result, timing and the host's raw object; Back to chat returns. | Softov, 2026-10-16, asked "What should the new session view be?" and chose "Raw view, steps open in place" | 01 |
| The header has changed files, terminals, subagents and a chat switcher. | Softov, 2026-10-16, asked "Which header buttons do you want?" and chose all four | 02 |
| The Raw view is toggled by a header button. | Softov, 2026-10-16, asked "Where does the Raw view toggle live?" and chose "A header button" | 01 |
| A step is the turn's message or one response part, with the object the host sent for it. | file:///github/ahpapp/src/session-analysis.ts | 01 |
| A terminal is the session's when its claim names the session, or its directory is in the session's folder. | file:///github/ahpapp/src/terminal-sessions.ts and [`code://src/resources/sessions/Details.tsx`](../../../../src/resources/sessions/Details.tsx) | 02 |
| Subagents are counted from the chat's subagent tool calls, running out of total. | `(defaulted: neither app keeps a subagent list)` | 02 |
| The Raw view filters to all steps, tool calls, or subagents. | `(defaulted: the subagents button needs a filter, and ahpapp has a tool-calls toggle)` | 01 |

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - the Raw view](task-01-the-raw-view.md) | done | - |
| [02 - the header buttons](task-02-the-header-buttons.md) | done | 01 |

## Risks and tradeoffs

- A long chat makes a long Raw list - rows stay one line until opened, and only an opened row draws its JSON.
- A turn not loaded yet is not in the list - the Older turns button shows above it, as in the chat.

## Resume state

- **Done so far:** both tasks; see [implemented.md](implemented.md).
- **Next action:** none.
- **Open questions:** none.
- **Watch out for:** a bot chat has its own page and gets neither the Raw view nor the buttons.

## Final verification checklist

- [x] The Raw button swaps the chat for the steps and back; a step opens in place with its input, result, timing and raw object.
- [ ] The header shows +a -d, terminals, subagents and the chat switcher when each applies, and each opens what it says.
- [x] `pnpm test` and `pnpm typecheck` pass.
