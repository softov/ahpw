---
title: "The composer's controls: Add context at the +, tips, the options tray - implemented"
date: 2026-10-14
refs:
  - git://desk
  - "[code://src/sessions/composer-commands.ts#L78-L123](../../../../src/sessions/composer-commands.ts#L78-L123)"
  - "[code://src/sessions/Attached.tsx#L12-L116](../../../../src/sessions/Attached.tsx#L12-L116)"
---

In both composers, the `+` opens Add context as a menu at the button.
A second click closes it, and nothing is written into the message.
Add context offers the clipboard's image and, in a session, the files the session changed.
Ctrl+V of a screenshot or a copied file attaches it, and a click on an attachment the message carries shows it.
The boxes ask "What should it do?", and the New session page shows one tip under its box.
Its Agent and folder fold away in a tray.
Pill labels shorten as the box narrows, and the footer puts the session's settings left and the model with its chat settings right.

## What was built

- [`code://src/sessions/composer-commands.ts#L78-L123`](../../../../src/sessions/composer-commands.ts#L78-L123) - `typeTrigger`, and `contextItems`, the one list behind the `+` and `/attach`.
- [`code://src/sessions/composer-commands.ts#L29-L46`](../../../../src/sessions/composer-commands.ts#L29-L46) - `ComposerApi` with `changed()`; `composerAt` reaches it from the `+`.
- [`code://src/sessions/Attached.tsx#L59-L116`](../../../../src/sessions/Attached.tsx#L59-L116) - `AddButton`: scena's `ContextMenu` at the button, above it when it does not fit below, and `onOpenChange`.
- [`code://src/sessions/Attached.tsx#L12-L48`](../../../../src/sessions/Attached.tsx#L12-L48) - the chips open `AttachmentPreview`, on scena's `Modal`.
- [`code://src/sessions/attachments.ts#L58-L74`](../../../../src/sessions/attachments.ts#L58-L74) - `clipboardImage`, the clipboard's image or why there is none.
- [`code://src/sessions/attachments.ts#L105-L143`](../../../../src/sessions/attachments.ts#L105-L143) - `hasPreview`, `previewOf` and `byteWords`.
- [`code://src/sessions/composer-drop.ts#L73-L76`](../../../../src/sessions/composer-drop.ts#L73-L76) - `pastedFiles`; `useComposerDrop` gained `onPaste`.
- [`code://src/sessions/tips.ts`](../../../../src/sessions/tips.ts) - the new session tips and their counter.
- [`code://src/sessions/new-tray.ts`](../../../../src/sessions/new-tray.ts) - the tray's open state per host.
- [`code://src/sessions/pill-labels.ts`](../../../../src/sessions/pill-labels.ts) - a pill's long, short and icon labels.
- [`code://src/sessions/footer.ts`](../../../../src/sessions/footer.ts) - `footerSide` and `contextReadout`.
- [`code://src/sessions/pills.tsx`](../../../../src/sessions/pills.tsx) - `Pill` renders the three labels; CSS shows one by the box's width.
- [`code://src/app.css`](../../../../src/app.css) - the container queries, the footer groups, the tip, the tray and the preview.

## Verified

- `pnpm typecheck` passes; `vitest run src` passes 281 tests in 48 files.
- New tests: `tips.test.ts`, `new-tray.test.ts`, `pill-labels.test.ts`, `footer.test.ts`, `composer-drop.test.ts`, and new cases in `composer-commands.test.ts` and `attachments.test.ts`.
- Headless Edge ran against a throwaway ahpd 0.11.0 with agent-claude, in the dark theme.
  The `+` menu opens above the button and toggles, and the `@` list hides while it is open.
  Files then Commands leaves `/`, and the footer splits in both composers.
  The pills shorten at 560 and 400 pixels.
  An uploaded image previews, a pasted image attaches, and a paste with text stays text.
- Softov ran it in a browser: the `+` menu, `@`, the clipboard image and Ctrl+V.

## Departures from the plan

- Task 01 gained `typeTrigger` and `onOpenChange`, after Softov's run found `@/` and the menu over the `@` list.
- Task 01 gained Ctrl+V, and task 07 the attachment preview, both asked for during the review.
- The `+` menu's Commands row has the `EMOJIcon.terminal` icon, so every row has one.

## Left for later

- The context readout, the right-hand effort pill, and part of task 06's browser pass - see [deferred.md](deferred.md).
