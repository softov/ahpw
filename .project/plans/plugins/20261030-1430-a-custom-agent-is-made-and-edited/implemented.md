---
title: A custom agent is made and edited - implemented
date: 2026-10-30
refs:
  - git://5e9ac45
  - "[code://src/resources/agents/custom-files.ts](../../../../src/resources/agents/custom-files.ts)"
  - "[code://src/resources/agents/FileModal.tsx](../../../../src/resources/agents/FileModal.tsx)"
  - "[code://src/resources/agents/words.ts](../../../../src/resources/agents/words.ts)"
  - "[code://src/resources/agents/Customizations.tsx](../../../../src/resources/agents/Customizations.tsx)"
---

A writable skills or agents folder in the customization tree has a New button, which writes a file from a template and opens it.
An agent or skill in a writable folder has Edit in its detail.
The setting "Agent files" opens the file as a tab in the text editor, or in a modal over the page.

## What was built

- [`code://src/resources/agents/custom-files.ts`](../../../../src/resources/agents/custom-files.ts) - the `ui.customFileOpens` setting, the URIs, the templates, `openCustomFile` and `newCustomFile`.
- [`code://src/resources/agents/FileModal.tsx`](../../../../src/resources/agents/FileModal.tsx) - the text editor in a modal, which asks before it closes with unsaved text.
- [`code://src/resources/agents/words.ts`](../../../../src/resources/agents/words.ts) - `editable`, `newKind`, `uri` and `writableFolder` on a row.
- [`code://src/resources/agents/Customizations.tsx`](../../../../src/resources/agents/Customizations.tsx) - New on a folder row, Edit in `DetailModal`, and the modal state.
- [`code://src/resources/files/FilePage.tsx`](../../../../src/resources/files/FilePage.tsx) - the `onDirty` prop, which tells the modal about unsaved text.
- [`code://src/shell/ui-settings/settings.ts`](../../../../src/shell/ui-settings/settings.ts) - the setting, its values and its default.
- [`code://src/resources/host/sections.ts`](../../../../src/resources/host/sections.ts) - the setting in the agents section of the UI settings.
- The strings in en, pt and es, and the styles in `src/style/app.css`.

## Verified

- `pnpm typecheck` passes. `pnpm test` passes: 121 files, 654 tests.
- `pnpm build` passes; it shows only the chunk size warning that was there before.
- `words.test.ts`, `custom-files.test.ts`, `settings.test.ts` and `sections.test.ts` cover the new code.
- A browser run against ahpd at 1280 light and 420 dark checked each task; each task's *Resume* gives the results.
- The check files were deleted after the run.

## Departures from the plan

- Task 01, step 6 - `FileModal` asks in the modal, not with `confirm`, and the modal is not dismissable. The `confirm` dialog draws under scena's `Modal`, and `Modal` hides itself before `onClose` can refuse. The string "Keep editing" was added for the question.

## Left for later

- Edit on an agent waits on ahpd. An agent file in `~/.claude/agents` that is not `<name>.md` comes as a `claude-internal:` URI.
  ahpw cannot write to that URI. The ahpd brief `a-skill-names-its-own-file.md` covers this.
- A new file shows in the tree only after ahpd sends the customizations again.
