---
title: The editor opens by a setting
status: todo
depends: []
layer: "agents"
refs:
  - "[code://src/resources/bots/sidebar.ts#L5](../../../../src/resources/bots/sidebar.ts#L5) - `BOT_CHAT_OPENS`, the setting this one copies"
  - "[code://src/resources/files/FilePage.tsx#L18](../../../../src/resources/files/FilePage.tsx#L18) - the editor the modal shows"
  - "[code://src/resources/files/viewers.ts#L8](../../../../src/resources/files/viewers.ts#L8) - `TEXT_VIEWER`"
---

## Objective

A custom file opens in the text editor, as a new panel or in a modal, by the UI setting `ui.customFileOpens`. The default is a new panel.

## Files

- `CREATE: src/resources/agents/custom-files.ts` - `CUSTOM_FILE_OPENS`, a `chatChoice` with the values `panel` and `modal`, and `openCustomFile`.
- `CREATE: src/resources/agents/custom-files.test.ts` - the setting's values and default, and where `openCustomFile` sends a file.
- `CREATE: src/resources/agents/FileModal.tsx` - `FilePage` in a `Modal`, which asks before it closes with unsaved text.
- `UPDATE: src/shell/ui-settings/settings.ts:126` - list `chatSetting('ui.customFileOpens', CUSTOM_FILE_OPENS)`.
- `UPDATE: src/resources/host/sections.ts:37-44` - add the `agents` section with `ui.customFileOpens`.
- `UPDATE: src/i18n/en.json` - the setting's title, description and values, and the section title.
- `UPDATE: src/i18n/pt.json` - the same words in Portuguese.
- `UPDATE: src/i18n/es.json` - the same words in Spanish.

## Steps

1. Add `CUSTOM_FILE_OPENS = chatChoice('$/ahp/agents/customFileOpens', 'ahpw.customFileOpens', ['panel', 'modal'], 'panel')`.
2. Add `openCustomFile(scena, host, spot, showModal)`, which reads the setting.
3. On `panel`, run `ahp.openFile` with `host`, the spot's `uri` and `line`, and `viewer: TEXT_VIEWER`.
4. On `modal`, call `showModal(spot)`.
5. Write `FileModal`, which draws `FilePage` for the spot in a wide `Modal`.
6. Make `FileModal` ask with `confirm` before it closes while `FilePage` has unsaved text.
7. List the setting in `UI_SETTINGS` and in a new `agents` section of the Interface tab.
8. Add the words in English, Portuguese and Spanish.

## Validation

- `custom-files.test.ts`: the default is `panel`; `panel` runs `ahp.openFile` with `viewer: FilePage`; `modal` calls `showModal`.
- `settings.test.ts` still passes with the new key.
- `pnpm typecheck` and `pnpm test` pass.

## Resume
