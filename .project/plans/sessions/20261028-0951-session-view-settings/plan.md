---
title: UI settings for tools expanded and Markdown in a session
domain: sessions
status: active
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
Tool calls sets whether the tool rows start open or closed.
Markdown draws the agent's text as Markdown, or as plain text.

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
| Tool calls: Expanded or Collapsed, default Collapsed | Softov, 2026-10-29: "tool collapsed. default yes" | 01 |
| The setting opens tool rows only; thinking rows keep starting closed | Softov, 2026-10-28, question answer | 01 |
| Markdown: Enabled or Disable Markdown, default Enabled | Softov, 2026-10-29: "Markdown formatter. enabled by default user can disable" | 02 |
| Plain text keeps line breaks and wraps | `(defaulted: text without Markdown must still read)` | 02 |
| The setting covers the agent's markdown parts; a question title stays Markdown | `(defaulted: the setting names the session's text)` | 02 |
| A row a person opened or closed keeps that state when the setting changes | `(defaulted: the setting is the start state only)` | 01 |
| Each value is kept in localStorage, one per browser, as `placing` keeps a place | `(defaulted: the other UI settings that the chat reads keep theirs so)` | 01, 02 |

## Proposed architecture

- **Data flow** - two `UiSetting` entries; the chat reads each through the store path its `apply` writes.
- **Event flow** - a change re-renders the chat; a tool row reads the value only for its first state.
- **State flow** - kept as the other UI settings are.
- **Layer responsibilities** - `src/shell/ui-settings/`: the settings. `src/resources/sessions/Parts.tsx`: reads them.
- **Source-of-truth files** - [`code://src/shell/ui-settings/settings.ts`](../../../../src/shell/ui-settings/settings.ts)

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - tools start expanded](task-01-tools-start-expanded.md) | implemented | - |
| [02 - markdown can be turned off](task-02-markdown-can-be-turned-off.md) | implemented | - |

## Risks and tradeoffs

- Expanded makes a long turn taller. The Activity fold that groups steps stays, so a finished run still reads as one line.

## Resume state

- **Done so far:** tasks 01 and 02 are implemented and wait for review.
- **Next action:** review by Softov; then `implemented.md`.
- **Open questions:** none.
- **Watch out for:** the Session section comes from plan `session-views-open-from-commands` task 03.

## Final verification checklist

- [x] A new session shows its tool rows closed; with Expanded, open.
- [x] With Disable Markdown, the agent's text shows as plain text with its line breaks.
- [x] Both settings reset to their defaults.
- [ ] `pnpm typecheck` and `pnpm test` pass.
