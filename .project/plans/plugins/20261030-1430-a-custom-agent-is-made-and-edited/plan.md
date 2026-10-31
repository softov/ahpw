---
title: A custom agent is made and edited
domain: plugins
status: built
priority: medium
created: 2026-10-30
revalidated: 2026-10-30
refs:
  - git://079de3f - the last commit that holds the brief this plan covers, `.project/briefs/a-custom-agent-is-made-and-edited.md`
  - "[code://src/resources/agents/Customizations.tsx#L61-L146](../../../../src/resources/agents/Customizations.tsx#L61-L146) - the customization tree, its rows and `DetailModal`, where New and Edit go"
  - "[code://src/resources/agents/words.ts#L201-L206](../../../../src/resources/agents/words.ts#L201-L206) - `fileSpotOf`, which already gives a skill folder's `SKILL.md`"
  - "[code://src/resources/agents/words.ts#L238-L258](../../../../src/resources/agents/words.ts#L238-L258) - `customizationRows`, which builds the rows and drops `writable` and `contents`"
  - "[code://src/resources/agents/Overview.tsx#L104-L109](../../../../src/resources/agents/Overview.tsx#L104-L109) - the section shows when the host sends any customization, an empty directory too"
  - "[code://src/resources/files/FilePage.tsx#L18-L95](../../../../src/resources/files/FilePage.tsx#L18-L95) - the text editor that saves with `ifMatch`; the modal reuses it"
  - "[code://src/resources/files/viewers.ts#L8](../../../../src/resources/files/viewers.ts#L8) - `TEXT_VIEWER`, which a `.md` file needs, because its first viewer is the Markdown view"
  - "[code://src/resources/folders/actions.ts#L55-L65](../../../../src/resources/folders/actions.ts#L55-L65) - `newFile`, the pattern for New: ask a name, write with `createOnly`"
  - "[code://src/resources/folders/ask.ts#L42](../../../../src/resources/folders/ask.ts#L42) - `askName`, whose dialog is mounted on the overlay for every page"
  - "[code://src/resources/folders/menu.ts#L80](../../../../src/resources/folders/menu.ts#L80) - `nameProblem`, the name check New reuses"
  - "[code://src/resources/bots/sidebar.ts#L5](../../../../src/resources/bots/sidebar.ts#L5) - `BOT_CHAT_OPENS`, the `chatChoice` the new setting copies"
  - "[code://src/shell/ui-settings/settings.ts#L126](../../../../src/shell/ui-settings/settings.ts#L126) - where a `chatChoice` is listed as a UI setting"
  - "[code://src/resources/host/sections.ts#L37-L44](../../../../src/resources/host/sections.ts#L37-L44) - the sections of the Interface tab"
  - https://github.com/microsoft/agent-host-protocol/blob/main/types/channels-session/state.ts - `DirectoryCustomization`, with `contents` and `writable`
  - file:///github/ahpd/.project/briefs/a-written-agent-shows-without-a-restart.md - the ahpd half, which sends an empty writable directory and shows a written agent without a restart
  - file:///github/ahpd/.project/briefs/a-skill-names-its-own-file.md - the ahpd brief that makes a skill's `uri` its `SKILL.md`
---

## Goal

A person makes a custom agent or a skill from the agent page, and edits an existing one, as in VS Code's Agent Customizations.
ahpw writes the file through the host, and the host then lists it.

## Reconnaissance

The files read and the patterns to reuse are the `refs` in the frontmatter, each with its note.

### Searches performed

- `rg "writable" src/resources/agents` - only `metaOf` reads it, to show read-only.
- `rg "'ahp.openFile'" src` - every file opens through this command; a `.md` file opens in the Markdown view unless `viewer` names the text editor.
- `rg "NameDialog" src` - the name dialog is mounted on the overlay, so `askName` works from the agent page.
- `rg "\"new\": \"New agent\"" src/i18n/en.json` - the agents explorer already has a New agent, for the agent form.

### Runtime path

```
root state agent.customizations -> customizationRows (newKind, editable)
  directory row New -> askName -> writeResource createOnly -> open editor
  DetailModal Edit -> open editor
open editor -> ui.customFileOpens: panel -> ahp.openFile viewer FilePage | modal -> FilePage in a Modal
host sends a new root state -> the tree shows the new file
```

### Gaps

- No action writes a file into a writable directory.
- An agent or skill file opens read-only in `DetailModal`, and has no way into the editor.
- The editor opens only as a tab.

## Answers

| What | Source | Task |
| --- | --- | --- |
| The editor opens as a new panel or a modal, by a UI setting, default a new panel | Softov, 2026-10-30: "can be a new panel. or it can be a ui settings. default for a new panel or a modal." | 01 |
| The setting is `ui.customFileOpens`, a `chatChoice` like `ui.botChatOpens`, in a new Agents section of the Interface tab | `(defaulted: the sibling setting's shape)` | 01 |
| A new panel is the file's tab in the text editor, as `ahp.openFile` opens it | `(defaulted: the tab the Open file button already opens)` | 01 |
| An agent or skill file in a writable directory gets Edit in `DetailModal` | Softov, 2026-10-30, the brief | 02 |
| A file in a directory with `writable: false`, a plugin's too, gets no Edit | `(defaulted: the host refuses the write)` | 02 |
| New agent and New skill sit on the writable directory's row | Softov, 2026-10-30, question answer: "On the directory row" | 03 |
| Skills get a New action; commands get none for now | Softov, 2026-10-30: "skills get a new action too." "command I don't think so for now." | 03 |
| The templates are ahpw's own | Softov, 2026-10-30: "template... own." | 03 |
| A new skill is the folder `<name>` with `SKILL.md` in it | `(defaulted: the layout Claude reads skills from)` | 03 |
| The empty Customizations section shows | Softov, 2026-10-30: "show the empty section." | 03 |
| ahpw adds no reload; the tree shows the new file when the host sends a new root state | Softov, 2026-10-30, the brief | 03 |

## Proposed architecture

- **Data flow** - `customizationRows` keeps a directory's `writable` and `contents` as `newKind` on the row, and gives each child `editable`. New writes with `writeResource` and `createOnly`.
- **Event flow** - New and Edit call one `openCustomFile`, which reads the setting.
- **State flow** - the setting is kept by `chatChoice` in the store and `localStorage`. The modal's file is component state in `CustomizationTrees`.
- **Layer responsibilities** - `src/resources/agents/words.ts`: what a row may do. `src/resources/agents/custom-files.ts`: the setting, the templates, `openCustomFile` and `newCustomFile`. `src/resources/agents/Customizations.tsx`: the buttons and the modal.
- **Source-of-truth files** - [`code://src/resources/agents/words.ts`](../../../../src/resources/agents/words.ts)

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - the editor opens by a setting](task-01-the-editor-opens-by-a-setting.md) | done | - |
| [02 - a written file gets edit](task-02-a-written-file-gets-edit.md) | done | 01 |
| [03 - a writable folder gets new](task-03-a-writable-folder-gets-new.md) | done | 01 |

## Risks and tradeoffs

- ahpd's Claude backend leaves out `~/.claude/agents` when it has no agents, so New agent shows only once one agent exists. The ahpd brief fixes it.
- A written file shows in the tree only after an ahpd restart until the ahpd brief is built. ahpw does not work around it.
- ahpd sends a skill's `uri` as its folder today. `fileSpotOf` already turns it into `SKILL.md`, so Edit works before and after the ahpd fix.
- The agents explorer has a New agent for the agent form. The row's New agent writes a file, which is another thing with the same words. The row sits inside the Customizations tree, so the place tells them apart.
- An editor in a modal has no tab, so `useCloseGuard` does not ask before the modal closes with unsaved text. The modal asks itself.

## Resume state

- **Done so far:** the plan is built and merged in PR #23. See [implemented.md](implemented.md).
- **Next action:** none.
- **Open questions:** none.
- **Watch out for:** an agent shows Edit only when ahpd sends its `file:` URI, which waits on the ahpd brief.

## Final verification checklist

- [x] A writable agents directory row shows New agent; a writable skills directory row shows New skill; a commands directory shows none.
- [x] New agent writes `<name>.md` from the template and opens it in the editor; New skill writes `<name>/SKILL.md`.
- [x] A name that exists is refused, and the existing file is unchanged.
- [ ] Edit shows on an agent or skill in a writable directory, and not on a plugin's. A skill was checked; an agent waits on ahpd.
- [x] With the setting on a new panel the file opens as a tab; on a modal it opens over the page, and saves with Mod-s.
- [x] Checked at 1280 light and 420 dark; `pnpm typecheck` and `pnpm test` pass.
