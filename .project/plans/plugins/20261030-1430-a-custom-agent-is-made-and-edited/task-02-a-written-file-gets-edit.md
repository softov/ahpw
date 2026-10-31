---
title: A written file gets Edit
status: implemented
depends:
  - task-01-the-editor-opens-by-a-setting.md
layer: "agents"
refs:
  - "[code://src/resources/agents/words.ts#L210-L223](../../../../src/resources/agents/words.ts#L210-L223) - `childRow`, which gets `editable`"
  - "[code://src/resources/agents/Customizations.tsx#L98-L115](../../../../src/resources/agents/Customizations.tsx#L98-L115) - `DetailModal`, which gets the Edit button"
---

## Objective

An agent or skill file in a directory with `writable: true` shows an Edit button in `DetailModal`. Edit opens the file as `openCustomFile` says.

## Files

- `UPDATE: src/resources/agents/words.ts:77-90` - add `editable` to `ChildRow`.
- `UPDATE: src/resources/agents/words.ts:210-223` - `childRow` takes the parent's `writable`, and sets `editable` for an agent or skill with a file.
- `UPDATE: src/resources/agents/words.ts:238-258` - `customizationRows` passes the directory's `writable` to each child.
- `UPDATE: src/resources/agents/words.test.ts` - cases for `editable`.
- `UPDATE: src/resources/agents/Customizations.tsx:12-20` - add `editable` to `Detail`.
- `UPDATE: src/resources/agents/Customizations.tsx:98-146` - the Edit button in `DetailModal`, and `FileModal` in `CustomizationTrees`.
- `UPDATE: src/i18n/en.json` - the Edit label.
- `UPDATE: src/i18n/pt.json` - the Edit label.
- `UPDATE: src/i18n/es.json` - the Edit label.

## Steps

1. Set `editable` only when the parent is a directory with `writable: true`.
2. Also require an agent or skill child, and a spot from `fileSpotOf`.
3. Leave `editable` false for a plugin's child and for a directory with `writable: false`.
4. Carry `editable` into the `Detail` that a child row opens.
5. In `DetailModal`, show Edit beside the file body when `editable` is true.
6. Make Edit close `DetailModal` and call `openCustomFile` with the spot.
7. Draw `FileModal` from `CustomizationTrees` when `openCustomFile` asks for the modal.

## Validation

- `words.test.ts`: an agent in a writable directory is editable.
- `words.test.ts`: an agent in a read-only directory, a plugin's skill and a command are not.
- By hand on ahpd: open an agent from `~/.claude/agents` and press Edit.
- Change a line, save with Mod-s, and read the file on disk.
- By hand: the same with the setting on a modal.

## Resume

Built on the same branch, not committed.
`words.test.ts` covers an editable agent and skill, and a read-only folder, a plugin's skill, a command and an internal URI that are not.
At 1280 light and 420 dark, `/advisor` in `~/.claude/skills` shows Edit, and Edit opens the editor.
The agents in `~/.claude/agents` show no Edit, because ahpd sends them as `claude-internal:` URIs; [implemented.md](implemented.md) says why.
