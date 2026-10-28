---
title: UI settings for tools expanded and Markdown in a session
domain: sessions
status: planned
priority: medium
created: 2026-10-28
revalidated: 2026-10-28
requires:
  - plans/sessions/20261028-0951-session-views-open-from-commands/plan.md
refs:
  - "[code://src/resources/sessions/Parts.tsx#L140-L141](../../../../src/resources/sessions/Parts.tsx#L140-L141) - a tool row starts closed: `useState(false)`; a waiting row shows anyway"
  - "[code://src/resources/sessions/Parts.tsx#L185-L196](../../../../src/resources/sessions/Parts.tsx#L185-L196) - a thinking row, which keeps starting closed"
  - "[code://src/resources/sessions/Parts.tsx#L251](../../../../src/resources/sessions/Parts.tsx#L251) - a markdown part drawn with scena's `Markdown`"
  - "[code://src/shell/ui-settings/settings.ts#L23-L35](../../../../src/shell/ui-settings/settings.ts#L23-L35) - the setting shape"
  - "[code://src/resources/sessions/SessionHeader.tsx#L98-L99](../../../../src/resources/sessions/SessionHeader.tsx#L98-L99) - Raw and Hide calls, per page, which stay as they are"
---

## Goal

Two settings in the Session section of the Interface settings set how a session's chat draws.
Show tools expanded opens the tool rows.
Show session formatted draws the agent's text as Markdown, or as plain text.

## Reconnaissance

### Searches performed

- `rg "useState\(false\)" src/resources/sessions/Parts.tsx` - the tool row and the thinking row start closed.
- `rg "<Markdown" src/resources/sessions` - response text, a thinking body, a question title.

### Runtime path

```
ui.toolsExpanded -> ToolCall's first open state
ui.sessionMarkdown -> the markdown part: <Markdown> or plain text
```

### Gaps

- No setting reaches the chat's parts.

## Answers

| What | Source | Task |
| --- | --- | --- |
| Show tools expanded: Expanded or Collapsed, default Expanded | Softov, 2026-10-28 | 01 |
| The setting opens tool rows only; thinking rows keep starting closed | Softov, 2026-10-28, question answer | 01 |
| Show session formatted: Enabled or Disable Markdown, default Enabled | Softov, 2026-10-28 | 02 |
| Plain text keeps line breaks and wraps | `(defaulted: text without Markdown must still read)` | 02 |
| The setting covers the agent's markdown parts; a question title stays Markdown | `(defaulted: the setting names the session's text)` | 02 |
| A row a person opened or closed keeps that state when the setting changes | `(defaulted: the setting is the start state only)` | 01 |

## Proposed architecture

- **Data flow** - two `UiSetting` entries; the chat reads each through the store path its `apply` writes.
- **Event flow** - a change re-renders the chat; a tool row reads the value only for its first state.
- **State flow** - kept as the other UI settings are.
- **Layer responsibilities** - `src/shell/ui-settings/`: the settings. `src/resources/sessions/Parts.tsx`: reads them.
- **Source-of-truth files** - [`code://src/shell/ui-settings/settings.ts`](../../../../src/shell/ui-settings/settings.ts)

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - tools start expanded](task-01-tools-start-expanded.md) | todo | - |
| [02 - markdown can be turned off](task-02-markdown-can-be-turned-off.md) | todo | - |

## Risks and tradeoffs

- Expanded by default makes a long turn taller. The Activity fold that groups steps stays, so a finished run still reads as one line.

## Resume state

- **Done so far:** nothing.
- **Next action:** [task-01-tools-start-expanded.md](task-01-tools-start-expanded.md).
- **Open questions:** none.
- **Watch out for:** the Session section comes from plan `session-views-open-from-commands` task 03.

## Final verification checklist

- [ ] A new session shows its tool rows open; with Collapsed, closed.
- [ ] With Disable Markdown, the agent's text shows as plain text with its line breaks.
- [ ] Both settings reset to their defaults.
- [ ] `pnpm typecheck` and `pnpm test` pass.
