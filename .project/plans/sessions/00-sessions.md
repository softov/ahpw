---
title: Sessions - what exists today
domain: sessions
revalidated: 2026-10-16
---

The sessions domain is the session page: a session's header, its chat with each turn's parts, and the composer under it.
It is `src/resources/sessions/`, over the session and chat channels the data layer follows.

## Packages

- [`code://src/resources/sessions/Page.tsx`](../../../src/resources/sessions/Page.tsx) - `SessionPage`: the header (title, status badge, the activity line), the turns, the composer.
- [`code://src/resources/sessions/Parts.tsx`](../../../src/resources/sessions/Parts.tsx) - each response part; `ToolCall` and `Reasoning` expand in place.
- [`code://src/resources/sessions/Activity.tsx`](../../../src/resources/sessions/Activity.tsx) - a run of steps folded to "N steps done in Xs", opened in place.
- [`code://src/resources/sessions/Details.tsx`](../../../src/resources/sessions/Details.tsx) - the right sidebar's Session tab: facts, changes, the terminals in the session's folder.

## Contracts

- `npm://@microsoft/agent-host-protocol` - `SessionState` (with `chats`), `ChatState` (turns, `activeTurn`), `ToolCallState`, `TerminalInfo` (with `claim`).

## Runtime path

```
ahp.openSession -> SessionPage -> useChannel(session) + useChannel(chat = defaultChat) -> TurnView -> Activity | Part
```

## Known gaps

- No per-session raw view; the only raw view is the global Log page.
- The header shows no changed files, terminals, subagents or chats.
- The page always shows the default chat.
