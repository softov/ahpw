---
title: The header buttons
status: done
depends: [task-01-the-raw-view.md]
layer: "src/resources/sessions"
refs:
  - "[code://src/resources/sessions/Details.tsx](../../../../src/resources/sessions/Details.tsx) - the terminals in the session's folder"
  - "[code://src/shell/right-sidebar.ts](../../../../src/shell/right-sidebar.ts) - `ahp.showRight.<key>`"
  - file:///github/ahpapp/app/session.tsx - the chips
---

## Objective

The header shows, each only when it applies: `+a −d` (changed files), `▮ N` (terminals), `subagents n/N`, and `chat i/N`.
Each opens what it counts: the Changes tab, the terminal or the Session tab, the Raw view on subagents, and a menu of the chats.

## Files

- `CREATE: src/resources/sessions/header.ts` - `sessionTerminals(terminals, resource)`, `subagentsOf(turns, active)`.
- `CREATE: src/resources/sessions/header.test.ts`.
- `UPDATE: src/resources/sessions/Page.tsx` - the buttons, and the chat the page shows.
- `UPDATE: src/style/app.css`, `src/i18n/{en,es,pt}.json`.

## Steps

1. Changes: `summary.changes`, shown when it has files.
2. Terminals: claimed by the session, or with a directory in its folder; one opens it, more open the Session tab.
3. Subagents: the chat's subagent tool calls; the button opens the Raw view filtered to them.
4. Chats: `session.state.chats`, shown from two; the page follows the chosen chat.

## Validation

- `header.test.ts`: a terminal claimed by the session and one by another, the subagent count with one running.
- By hand: each button shows and opens what it says.

## Resume
