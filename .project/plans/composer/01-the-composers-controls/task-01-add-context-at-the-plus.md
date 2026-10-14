---
title: Add context opens at the + and toggles
status: done
depends: []
layer: "ahpw src/sessions"
refs:
  - "[code://src/sessions/composer-commands.ts#L28-L43](../../../../src/sessions/composer-commands.ts#L28-L43) - `ComposerApi`, which gains `changed`"
  - "[code://src/sessions/composer-commands.ts#L187-L224](../../../../src/sessions/composer-commands.ts#L187-L224) - the `/attach` command, whose items both it and the `+` use"
  - "[code://src/sessions/Attached.tsx#L29-L37](../../../../src/sessions/Attached.tsx#L29-L37) - `AddButton`, which opens the menu"
  - "[code://src/sessions/attachments.ts#L11-L52](../../../../src/sessions/attachments.ts#L11-L52) - the 5 MB cap and `fromFiles`, which the clipboard image goes through"
  - "[code://src/sessions/Page.tsx#L223-L234](../../../../src/sessions/Page.tsx#L223-L234) - where the composer gets the session's changesets"
  - "[code://src/changes/changeset.ts#L61](../../../../src/changes/changeset.ts#L61) - `useChangeset`"
  - "[code://src/changes/words.ts#L15-L28](../../../../src/changes/words.ts#L15-L28) - `scopesOf` and `firstScope`"
  - "[code://src/changes/Explorer.tsx#L242-L271](../../../../src/changes/Explorer.tsx#L242-L271) - a menu opened at a button with scena's `ContextMenu`, the pattern `AddButton` follows"
  - file:///github/scena/packages/scena/src/ui/menu/ContextMenu.tsx - scena's `ContextMenu`, used as it is
---

## Objective

A click on the `+` of either composer opens Add context as scena's existing `ContextMenu` at the button, and a second click closes it.
It writes nothing into the message.
It lists the items `/attach` lists today, plus Image from clipboard, then the session's changed files.
No scena change and no new component file: `AddButton` opens the menu, and one function builds the items for it and for `/attach`.

## Files

- `UPDATE: src/sessions/composer-commands.ts:28-43` - `ComposerApi.changed(): { title: string; description: string; attachment: MessageAttachment }[]`, and `composerAt(path)`.
- `UPDATE: src/sessions/composer-commands.ts:187-224` - `contextItems(api, sessions, image)`, the items, used by `ahp.composer.attach` and by `AddButton`.
- `UPDATE: src/sessions/composer-commands.test.ts` - the items, their order and greyed states.
- `UPDATE: src/sessions/attachments.ts` - `clipboardImage(): Promise<File | string>`.
- `UPDATE: src/sessions/attachments.test.ts` - its cases.
- `UPDATE: src/sessions/Attached.tsx:29-37` - `AddButton` takes the composer's `path`, holds the menu's open state, and renders `ContextMenu`.
- `UPDATE: src/sessions/Composer.tsx` - a `changesets` prop, `changed()` in its `ComposerApi`, and `path` to `AddButton`.
- `UPDATE: src/sessions/New.tsx` - `changed: () => []`, and `path` to `AddButton`.
- `UPDATE: src/sessions/Page.tsx:223-234` - pass `changesets={session.state?.changesets}`.
- `UPDATE: src/app.css` - the `+` while its menu is open, like its hover.

## Steps

1. Move the items of `ahp.composer.attach` into `contextItems(api, sessions, image)` in the same file; the command keeps pushing them with `/attach`.
2. Add "Image from clipboard" after Upload, greyed with `image` as its description when `image` is a reason.
   Picked, it runs `fromFiles([image])`, then `api.attach` on each.
3. After the items, one row per `api.changed()` entry, in a group `changed`, attaching its file.
4. Leave customizations of type `agent` out.
5. `clipboardImage()` returns the first `image/*` item of `navigator.clipboard.read()`, or a reason.
   The reasons are "Needs https or localhost", "No image on the clipboard", "The browser refused" and "Over 5 MB".
6. `composerAt(path)` reads the `composers` map, so `AddButton` reaches the same `ComposerApi` the commands use.
7. On a click while closed, `AddButton` reads its rect, awaits `clipboardImage()`, and opens `ContextMenu` there with `contextItems(...)`.
   On a click while open, it closes it.
8. Stop the button's `mousedown` while the menu is open.
   Otherwise the menu's outside-click close runs before the second click.
9. In `Composer`, read `useChangeset(firstScope(scopesOf(changesets))?.uri)`; `changed()` maps each change to `resourceAttachment(change.file, false)`, titled by name with its folder as description.
10. Pass `path` to `AddButton` in both composers; `New.tsx` returns no changed files.
11. In `Page.tsx`, pass the session's changesets.
12. `typeTrigger(text, caret, prefix)` in `composer-commands.ts` replaces an `@` or `/` word at the caret, as a pill's command does.
    It finds the word with scena's `getActiveToken`, and both composers' `type` use it.
    Source: Softov 2026-10-14: "click + files put @ then click + commands - put @/".
13. `AddButton` takes `onOpenChange`, and each composer hides its `@` or `/` list while the menu is open.
    The text stays as it is (Softov 2026-10-14: "then click + again open over").
14. `useComposerDrop` gains `onPaste`, set on both composer boxes.
    `pastedFiles` takes the paste's files unless it carries `text/plain`, and they go through `upload` as dropped files do.
    Source: Softov 2026-10-14: "ctrl + v should also work?".

## Validation

- `composer-commands.test.ts`: the items in order; a reason greys the clipboard row; changed files follow; none when `changed()` is empty.
- `composer-commands.test.ts`: `typeTrigger` puts `/` at the start of an empty box and spaces `@` from a word.
  It replaces an `@` or `/` at the caret.
- `composer-drop.test.ts`: a paste of files gives them; a paste with `text/plain` beside a picture gives none.
- `attachments.test.ts`: each reason with a stubbed `navigator`, and a `File` for a small PNG.
- `pnpm typecheck` and `pnpm test` pass.
- In the browser: the `+` opens the menu at it in both composers.
  A second click, Escape and a click outside close it, and the message text never changes.
- In the browser: Files and folders, then Commands, leaves `/`; with the `@` list open, the `+` menu shows alone.
- In the browser: Ctrl+V of a screenshot in the box attaches it; Ctrl+V of text pastes the text.
- In the browser: a copied screenshot attaches; copied text greys the row; a session with edits lists its changed files.

## Resume
