---
title: A writable folder gets New
status: done
depends:
  - task-01-the-editor-opens-by-a-setting.md
layer: "agents"
refs:
  - "[code://src/resources/folders/actions.ts#L55-L65](../../../../src/resources/folders/actions.ts#L55-L65) - `newFile`, the pattern"
  - "[code://src/resources/folders/ask.ts#L42](../../../../src/resources/folders/ask.ts#L42) - `askName`"
  - "[code://src/resources/folders/menu.ts#L80](../../../../src/resources/folders/menu.ts#L80) - `nameProblem`"
  - "[code://src/resources/agents/Overview.tsx#L104-L109](../../../../src/resources/agents/Overview.tsx#L104-L109) - the section shows for an empty directory too"
---

## Objective

A directory with `writable: true` and `contents` `agent` shows New agent on its row, and one with `contents` `skill` shows New skill. New asks a name, writes ahpw's template, and opens the file as `openCustomFile` says.

## Files

- `UPDATE: src/resources/agents/words.ts:99-111` - add `newKind` to `CustomizationRow`: `agent`, `skill` or absent.
- `UPDATE: src/resources/agents/words.ts:238-258` - set `newKind` for a writable directory that holds agents or skills.
- `UPDATE: src/resources/agents/words.test.ts` - cases for `newKind`, and an empty writable directory as a row.
- `UPDATE: src/resources/agents/custom-files.ts` - the two templates, `customFileUri` and `newCustomFile`.
- `UPDATE: src/resources/agents/custom-files.test.ts` - the URIs and the template text.
- `UPDATE: src/resources/agents/Customizations.tsx:61-78` - the New button on a row with `newKind`.
- `UPDATE: src/i18n/en.json` - New agent, New skill, the name dialog words and the template's words.
- `UPDATE: src/i18n/pt.json` - the same words in Portuguese.
- `UPDATE: src/i18n/es.json` - the same words in Spanish.

## Steps

1. Set `newKind` from `contents` when the item is a directory with `writable: true` and `contents` is `agent` or `skill`.
2. Give no `newKind` to a directory of commands, rules or hooks.
3. Make `customFileUri(dir, kind, name)` give `<dir>/<name>.md` for an agent and `<dir>/<name>/SKILL.md` for a skill.
4. Remove a typed `.md` from the end of an agent's name before it makes the URI.
5. Write the agent template: frontmatter with `name` and `description`, then a short body to replace.
6. Write the skill template: frontmatter with `name` and `description`, then a short body to replace.
7. Make `newCustomFile` ask the name with `askName` and `nameProblem`.
8. For a skill, make the folder with `makeFolder` first.
9. Write the template with `writeResource` and `createOnly`.
10. Show the host's message in a toast when the write fails, and open nothing.
11. Open the new file with `openCustomFile` when the write succeeds.
12. Draw the New button at the end of the row.
13. Stop its click from reaching the row, as `Copies` does.

## Validation

- `words.test.ts`: a writable agents directory has `newKind: 'agent'`, and an empty one is a row.
- `words.test.ts`: a read-only directory and a commands directory have no `newKind`.
- `custom-files.test.ts`: the agent and skill URIs, a typed `.md` removed, and the template frontmatter holds the name.
- By hand on ahpd: New agent with a new name writes the file and opens it.
- By hand: New agent with the same name shows the refusal, and the file stays as it was.
- By hand: New skill writes `<name>/SKILL.md`.

## Resume

Built on the same branch, not committed.
`words.test.ts` and `custom-files.test.ts` cover `newKind`, an empty writable folder, the URIs and the templates.
At 1280 light and 420 dark, skills shows New skill, agents shows New agent, and commands shows none.
New agent wrote `ahpw-check-agent.md` from the template and opened it.
A second New agent with the same name showed "already exists" in a toast, and the file stayed as it was.
New skill wrote `ahpw-check-skill/SKILL.md`. The check files were deleted after.
