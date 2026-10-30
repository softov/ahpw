---
title: The settings move to a line above the new session box
domain: composer
status: planned
priority: medium
created: 2026-10-28
revalidated: 2026-10-28
refs:
  - "[code://src/resources/sessions/New.tsx#L490-L507](../../../../src/resources/sessions/New.tsx#L490-L507) - the tray: the folder pill, the harness pill and the fold button"
  - "[code://src/resources/sessions/New.tsx#L532-L545](../../../../src/resources/sessions/New.tsx#L532-L545) - the footer: the session settings on the left, the model and chat settings on the right"
  - "[code://src/resources/sessions/footer.ts#L11](../../../../src/resources/sessions/footer.ts#L11) - `footerSide`, which splits the settings by `scope`"
  - file:///github/ahpw/.scratch/mockups/new-session-line.html - the mockup that task 01 makes
---

## Goal

The new session box takes VS Code's layout.
One line above the box holds the folder, the branch or worktree, the branch, the computer, the approval mode and the harness.
Inside the box go only the agent picker, the model, and the thinking level when the model supports it.
The fold button at the end of the line draws `<`.

## Reconnaissance

### Searches performed

- `rg "web-new__tray" src` - the tray is drawn only in `New.tsx`.
- `rg "footerSide" src` - the session composer and the new session box both split the footer with it.

### Runtime path

```
NewSessionPage -> tray (wherePill, harness pill, fold) -> box -> footer (+, left settings, model, right settings, send)
```

### Gaps

- The session settings sit in the footer, not on the line.
- The harness pill says "Agent: Claude Code"; VS Code uses "Agent" for the custom agent.
- The fold button draws `▾` and `▸`.

## Answers

| What | Source | Task |
| --- | --- | --- |
| The line above the box: folder, branch or worktree, branch, computer, approval mode, harness | Softov, 2026-10-28 | 02 |
| Inside the box: agent picker, model, thinking level when the model supports it | Softov, 2026-10-28 | 02 |
| The fold button draws `<`, as VS Code does | Softov, 2026-10-28 | 02 |
| A mockup comes first, and the build is compared to it | `(defaulted: a UI change starts from a mockup Softov approves)` | 01 |
| The harness pill shows the harness's name only | `(defaulted: "Agent" names the custom agent picker of plan a-custom-agent-picker)` | 02 |
| A session-scope setting goes on the line, a chat-scope setting stays in the box | `(defaulted: VS Code's line holds what is fixed for the session; footerSide already splits by scope)` | 02 |
| The mockup is approved; the folded line puts `>` at its right end | Softov, 2026-10-29: "Approve it", "> at the right end" | 01 |
| The line keeps the order the host sends; Isolation comes after Approvals for Claude Code | Softov, 2026-10-29: "Host order" | 02 |
| The harness pill shows the harness icon before its name | Softov, 2026-10-29: "Keep the icon" | 02 |
| The session composer keeps its layout | `(defaulted: Softov named the new session box only)` | - |

## Proposed architecture

- **Data flow** - no change: the same settings and values.
- **Event flow** - no change: each pill opens the box's list as today.
- **State flow** - the tray's fold state stays in its `hostKey` value.
- **Layer responsibilities** - `New.tsx` draws the line and the box; `footer.ts` keeps the split by scope.
- **Source-of-truth files** - [`code://src/resources/sessions/footer.ts`](../../../../src/resources/sessions/footer.ts)

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - a mockup of the line and the box](task-01-a-mockup-of-the-line-and-box.md) | implemented | - |
| [02 - the settings move to the line](task-02-the-settings-move-to-the-line.md) | implemented | 01 |

## Risks and tradeoffs

- A narrow window makes the line long; it wraps, and the pills use their short labels.
- The session composer and the new session box then differ; a later plan can move the session composer too.

## Resume state

- **Done so far:** tasks 01 and 02 are built and checked at 1280 light and 760 dark, with no horizontal scroll.
- **Next action:** Softov reviews the build; [the pending file](../../../pending/composer-line-start-check.md) holds the start check.
- **Open questions:** none.
- **Watch out for:** the folded line shows the harness and the folder in one chip.

## Final verification checklist

- [x] The page matches the approved mockup at 1280 and 760 wide, in both themes.
- [x] Each pill on the line and in the box opens its list.
- [ ] A session starts with the chosen settings.
- [x] `pnpm typecheck` and `pnpm test` pass.
