---
title: Composer - what exists today
domain: composer
revalidated: 2026-10-14
---

The composer is where a person writes to an agent.
There are two: the session composer under an open session's chat, and the new session box on the New session page.
Both draw the same box: the attachments, the text, and a footer row.
The footer has the `+` and the session's settings on the left.
On the right it has the model, its chat settings, the context size and send.
Both register a `ComposerApi` that the shared commands (`/model`, `/attach`, one per setting) read through the box's list.
All of it lives in `src/sessions/`, with its styles in `src/app.css`, and draws scena's controls from `@softov/scena`.

## Glossary

| Term | Meaning |
| --- | --- |
| composer | Either of the two boxes a message is written in; the code's `Composer` is the session one. |
| session composer | The box under an open session's chat: `Composer` in `src/sessions/Composer.tsx`. |
| new session box | The box on the New session page that starts a session: `NewSessionPage` in `src/sessions/New.tsx`. |
| box | The bordered part of a composer: attachments, text and footer (`.web-composer__box`). |
| footer | The row under the text: the `+`, the pills and send or stop (`.web-composer__foot`). |
| pill | A small rounded control, a fact or a button that opens the box's list (`Pill` in `src/sessions/pills.tsx`). |
| setting | A property of the host's session config schema, drawn as a pill; the code calls it an `Option`. |
| list | The box's own picker list (`useChatPicker`), opened by `/`, `@` or a pill. |
| Add context | The menu at the `+`, and the `/attach` list: files, upload, the clipboard's image, sessions, commands, and the session's changed files. |
| tray | The fold above the new session box that holds the Agent and folder pills (`.web-new__tray`). |
| tip | The one line under the new session box, a different one each open (`src/sessions/tips.ts`). |
| attachment | A `MessageAttachment` that goes with the message: a host file, embedded content, or another session's chat. |
| changeset | A session's changed files as the host reports them, read by `useChangeset`. |
| host | The AHP server ahpw is connected to; a key kept per host goes through `hostKey`. |

## Packages

- [`code://src/sessions`](../../../src/sessions) - both composers, their commands, their attachments; registered from `src/sessions/index.ts`.
- [`code://src/changes`](../../../src/changes) - the Changes pane and `useChangeset`, which reads a session's changed files.
- `npm://@softov/scena@^0.5.5` - `useChatPicker`, `ContextMenu`, `ActionList`, `Popup`, `Button`; ahpw tries an unreleased scena with `AHPW_SCENA=../scena`.
- `npm://@microsoft/agent-host-protocol@^1.0.0` - `AgentInfo`, `SessionModelInfo`, `SessionConfigPropertySchema`, `MessageAttachment`, `UsageInfo`.

## Contracts

- [`code://src/sessions/composer-commands.ts#L29-L46`](../../../src/sessions/composer-commands.ts#L29-L46) - `ComposerApi`, what a composer lets its commands and its `+` read and do.
- [`code://src/sessions/composer-commands.ts#L55-L71`](../../../src/sessions/composer-commands.ts#L55-L71) - `composerPath`, `attachComposer` and `composerAt`: a command finds its composer by the list's data context, the `+` by its path.
- [`code://src/sessions/composer-commands.ts#L8-L13`](../../../src/sessions/composer-commands.ts#L8-L13) - `COMPOSER_SLOT` and `NEW_SLOT`, the `/` slots of the two boxes.
- [`code://src/sessions/composer-commands.ts#L78-L123`](../../../src/sessions/composer-commands.ts#L78-L123) - `typeTrigger`, and `contextItems`, the one list of Add context.
  Files and folders types `@`, and Commands types `/`.
  Upload, Image from clipboard, Sessions and the changed files attach.
- [`code://src/sessions/footer.ts`](../../../src/sessions/footer.ts) - `footerSide` by the setting's `scope`, and `contextReadout`.
- [`code://src/sessions/pill-labels.ts`](../../../src/sessions/pill-labels.ts) - a pill's long, short and icon labels.
- [`code://src/sessions/attachments.ts#L11`](../../../src/sessions/attachments.ts#L11) - `MAX_EMBEDDED_BYTES`, the 5 MB cap on a file from this computer.
- [`code://src/storage-keys.ts#L9-L11`](../../../src/storage-keys.ts#L9-L11) - `hostKey`, the storage key of what belongs to one host.

## Runtime path

```
+ click -> AddButton -> clipboardImage() -> scena ContextMenu at the + with contextItems(composerAt(path), ...)
  -> api.attach | api.upload | api.type('@' | '/') through typeTrigger | a pushed Sessions list
paste of files / drop -> useComposerDrop -> upload -> fromFiles -> attachments
chip click -> previewOf -> AttachmentPreview (scena Modal)
pill click -> openCommand(<command id>) -> the box's list -> api.setModel / api.setOption
session composer: setOption -> dispatch session/configChanged; send -> chat/turnStarted | chat/pendingMessageSet
new session box: setOption -> chosen -> resolveSessionConfig; Start -> createSession -> ahp.openSession -> chat/turnStarted
```

## Tests

- [`code://src/sessions/composer-commands.test.ts`](../../../src/sessions/composer-commands.test.ts) - `valueWords`, `showsPill`, `contextItems` and `typeTrigger`.
- [`code://src/sessions/attachments.test.ts`](../../../src/sessions/attachments.test.ts) - attachments, ranges, `fromFiles`, `clipboardImage` and `previewOf`.
- [`code://src/sessions/composer-drop.test.ts`](../../../src/sessions/composer-drop.test.ts) - `pastedFiles`.
- [`code://src/sessions/footer.test.ts`](../../../src/sessions/footer.test.ts), [`code://src/sessions/pill-labels.test.ts`](../../../src/sessions/pill-labels.test.ts), [`code://src/sessions/tips.test.ts`](../../../src/sessions/tips.test.ts), [`code://src/sessions/new-tray.test.ts`](../../../src/sessions/new-tray.test.ts) - the footer, the labels, the tips and the tray.
- [`code://src/sessions/folder-mentions.test.ts`](../../../src/sessions/folder-mentions.test.ts) - what `@` lists in the new session box.
- [`code://src/sessions/host-commands.test.ts`](../../../src/sessions/host-commands.test.ts) - the host's `/` commands.
- The composers themselves are React and have no test; vitest runs `src/**/*.test.ts` only.

## Known gaps

- Add context has no filter field; a filter belongs to a fuzzy finder.
- The context readout needs the host's `maxContextWindow`, which agent-claude 0.11.0 does not send.
- A model's own `configSchema`, where the Claude backend puts effort per model, is not drawn.
