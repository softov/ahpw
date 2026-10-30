---
title: Approvals beside the agent picker
domain: composer
status: active
priority: medium
created: 2026-10-30
revalidated: 2026-10-30
requires:
  - plans/composer/20261028-0951-the-line-above-the-new-session-box/plan.md
refs:
  - "[code://src/resources/sessions/New.tsx#L543](../../../../src/resources/sessions/New.tsx#L543) - the tray draws every whole-session setting, Approvals with them"
  - "[code://src/resources/sessions/New.tsx#L600](../../../../src/resources/sessions/New.tsx#L600) - the footer's left side holds the agent picker alone"
  - "[code://src/resources/sessions/Composer.tsx#L430-L431](../../../../src/resources/sessions/Composer.tsx#L430-L431) - the session composer draws the agent picker, then the whole-session settings; the pattern to mirror"
  - "[code://src/resources/sessions/pill-labels.ts#L13-L14](../../../../src/resources/sessions/pill-labels.ts#L13-L14) - `settingIcon` already names Approvals by the key `permissionMode`"
  - "[code://src/resources/sessions/footer.ts#L11](../../../../src/resources/sessions/footer.ts#L11) - `footerSide`, which splits the settings by `scope`"
---

## Goal

In the new session box, the Approvals pill sits in the footer, right after the agent picker.
The session composer already draws it there, and VS Code draws its approvals picker next to the agent.
The other whole-session settings stay on the line above the box.

## Reconnaissance

### Searches performed

- `rg "footerSide\(option\) === 'left'" src` - the tray of the new session box and the footer of the session composer draw the whole-session settings.
- `rg "permissionMode" src` - only `settingIcon` names the key.
- `rg "'permissionMode'" /github/ahpd/packages` - the Claude, ACP and Pi backends send Approvals under `permissionMode`.

### Runtime path

```
host config schema -> options -> footerSide 'left'
  permissionMode -> footer, after AgentPicker
  other session settings -> tray
```

### Gaps

- The new session box shows Approvals on the line above, away from the agent picker.

## Answers

| What | Source | Task |
| --- | --- | --- |
| Approvals shows beside the agent picker in the new session box | Softov, 2026-10-30: "to show approvals besides agents picker." | 01 |
| Only Approvals moves; the other whole-session settings stay on the line above | Softov, 2026-10-30, question answer: "Approvals only" | 01 |
| Approvals leaves the line above, so it shows once | Softov, 2026-10-30, question answer: "Approvals only" | 01 |
| Approvals is the setting with the key `permissionMode` | [code://src/resources/sessions/pill-labels.ts#L14](../../../../src/resources/sessions/pill-labels.ts#L14) | 01 |
| The session composer's footer is the reference, and no mockup comes first | `(defaulted: the session composer already draws this order)` | 01 |

## Proposed architecture

- **Data flow** - the options and their order come from the host as before.
- **Event flow** - the pill opens the same setting list as before.
- **State flow** - none new.
- **Layer responsibilities** - `src/resources/sessions/pill-labels.ts`: the Approvals key, shared. `src/resources/sessions/New.tsx`: where the pill sits.
- **Source-of-truth files** - [`code://src/resources/sessions/pill-labels.ts`](../../../../src/resources/sessions/pill-labels.ts)

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - approvals sits after the agent picker](task-01-approvals-sits-after-the-agent-picker.md) | implemented | - |

## Risks and tradeoffs

- A backend that names Approvals with another key keeps it on the line above. All ahpd backends use `permissionMode` today.
- The footer of the new session box gets one more pill, so a narrow box wraps sooner.

## Resume state

- **Done so far:** task 01 is implemented, on branch `composer/20261030-1134-approvals-beside-the-agent-picker`.
- **Next action:** Softov reviews the PR.
- **Open questions:** none.
- **Watch out for:** Approvals must not show in both places; the tray filter must skip it.

## Final verification checklist

- [x] The new session box footer reads `+`, agent picker, Approvals, then the right side.
- [x] The line above no longer shows Approvals, and keeps the other session settings in host order.
- [x] The session composer is unchanged.
- [x] Checked at 1280 light and 420 dark; `pnpm typecheck` and `pnpm test` pass.
