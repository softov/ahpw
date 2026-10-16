---
title: "The composer's controls: Add context at the +, tips, the options tray"
domain: composer
status: built
priority: medium
created: 2026-10-14
revalidated: 2026-10-14
refs:
  - "[code://src/sessions/Composer.tsx#L304-L377](../../../../src/sessions/Composer.tsx#L304-L377) - the session composer's pills above the box, its text and its footer"
  - "[code://src/sessions/New.tsx#L342-L409](../../../../src/sessions/New.tsx#L342-L409) - the new session box: the Agent and folder pills above it, its placeholder, its footer"
  - "[code://src/sessions/New.tsx#L250-L302](../../../../src/sessions/New.tsx#L250-L302) - since 40483b3 the Agent, model and setting pills open the box's own list, as the session's do"
  - "[code://src/sessions/composer-commands.ts#L28-L43](../../../../src/sessions/composer-commands.ts#L28-L43) - `ComposerApi`, which this plan extends with the files, the changed files and a pasted image"
  - "[code://src/sessions/composer-commands.ts#L187-L224](../../../../src/sessions/composer-commands.ts#L187-L224) - `ahp.composer.attach`: writes `/attach` and pushes the Add context list"
  - "[code://src/sessions/Attached.tsx#L29-L37](../../../../src/sessions/Attached.tsx#L29-L37) - `AddButton`, the round `+`"
  - "[code://src/sessions/pills.tsx#L7-L22](../../../../src/sessions/pills.tsx#L7-L22) - `Pill`, one label at every width"
  - "[code://src/sessions/FolderPill.tsx#L34-L69](../../../../src/sessions/FolderPill.tsx#L34-L69) - the folder pill; its own menu toggles from its mark"
  - "[code://src/sessions/attachments.ts#L11](../../../../src/sessions/attachments.ts#L11) - `MAX_EMBEDDED_BYTES`, the 5 MB cap that Upload and the clipboard image share"
  - "[code://src/sessions/attachments.ts#L37-L52](../../../../src/sessions/attachments.ts#L37-L52) - `fromFiles`, which turns browser files into attachments under the cap"
  - "[code://src/sessions/folder-mentions.ts#L37](../../../../src/sessions/folder-mentions.ts#L37) - `folderMentions`, what `@` lists before a session exists"
  - "[code://src/changes/changeset.ts#L61-L168](../../../../src/changes/changeset.ts#L61-L168) - `useChangeset`, a changeset's files as `Change` rows"
  - "[code://src/changes/Explorer.tsx#L47-L52](../../../../src/changes/Explorer.tsx#L47-L52) - how the Changes pane picks its changeset: `scopesOf`, then `firstScope` unless the pane chose one"
  - "[code://src/sessions/Page.tsx#L223-L234](../../../../src/sessions/Page.tsx#L223-L234) - what the session page hands the composer; the session state and the last turn are here"
  - "[code://src/storage-keys.ts#L9-L11](../../../../src/storage-keys.ts#L9-L11) - `hostKey`, for the tray's collapsed state"
  - "[code://src/folders/added.ts#L23-L39](../../../../src/folders/added.ts#L23-L39) - the read and write pattern of a value kept in localStorage"
  - "[code://src/agents/words.ts#L36-L42](../../../../src/agents/words.ts#L36-L42) - `limitsOf` already reads `maxContextWindow`"
  - "[code://src/sessions/turn.ts#L42-L46](../../../../src/sessions/turn.ts#L42-L46) - `tokens`, a count as `12k` or `1.2M`"
  - "[code://src/app.css#L444-L679](../../../../src/app.css#L444-L679) - `.web-composer*`: the box, the chips, the footer, the `+`"
  - "[code://src/app.css#L1673-L1695](../../../../src/app.css#L1673-L1695) - `.web-new*`: the New session page and its list under the box"
  - file:///github/scena/packages/scena/src/ui/menu/ContextMenu.tsx - `ContextMenu` takes a point (`x`, `y`) and a `spec`; used as it is, as the Changes pane's options menu does
  - file:///github/scena/packages/scena/src/ui/menu/ActionList.tsx - renders `items`, `provider` or `query` rows; no filter field, which this plan does not add
  - file:///github/scena/packages/scena/src/ui/overlay/Popup.tsx - places the menu's top left at the point and clamps it into the window; closes on a mousedown outside
  - file:///github/scena/packages/scena/src/sdk/host.ts - `ListSpec` and `HostCtx`; `HostCtx.query` is `''` in a context menu
  - npm://@microsoft/agent-host-protocol@^1.0.0 - `SessionModelInfo.maxContextWindow` (optional), `UsageInfo.inputTokens` and `cacheReadTokens`
  - file:///github/ahpd/packages/agent-claude/src/claude.ts - `permissionMode` (title Approvals, `scope: 'session'`) and `effortLevel` (title Effort, `scope: 'chat'`)
  - file:///github/ahpd/packages/agent-cofold/src/agent.ts - the same two keys, with the same `scope` values, and `maxContextWindow` from the model's context tokens
---

## Goal

Both composers get controls that are easier to reach and to read.
The `+` opens Add context as a menu at the button, toggles, and writes nothing into the message.
The menu gains the clipboard image and the session's changed files.
The boxes ask "What should it do?", and the New session page shows one short tip under its box.
The once-per-session choices of a new session fold away in a tray above the box.
Pill labels shorten as the box narrows.
The footer puts add and approvals on the left, and model, effort and context size on the right.
A click on an attachment the message carries shows it, in the composer and the transcript.

## Reconnaissance

The files read and the patterns to reuse are the `refs` above, each with its note.

### Searches performed

- `rg -n "filter|search|query|input" scena/packages/scena/src/ui/menu/ActionList.tsx` - `Not found: a filter field`; `query` is the command-registry mode of `ListSpec`.
- `rg -n "anchor|placement|side" scena/packages/scena/src/ui/overlay/Popup.tsx` - `Not found: an anchor side`; the popup sits at a point, clamped into the window.
- `rg -n "maxContextWindow|maxPromptTokens" node_modules/@microsoft/agent-host-protocol/dist/types` - `SessionModelInfo` carries `maxContextWindow?`, `maxOutputTokens?` and `maxPromptTokens?`.
- `rg -n "scope" node_modules/@microsoft/agent-host-protocol/dist/types/common/state.d.ts` - `Not found: scope` on `ConfigPropertySchema`; ahpd's backends send it as an extra field.
- `rg -n "perModelEffort" ahpd/packages/agent-claude/src/claude.ts` - the Claude backend drops `effortLevel` once a probed model carries a `configSchema`.
- `rg -n "ResizeObserver|@container|container-type" src` - `ResizeObserver` in `ImagePage.tsx` and `TerminalPage.tsx`; no container query yet.
- `rg -n "hostKey\(" src` - the layout, the tabs and the added folders.
- `rg -n "clipboard" src` - writes only; nothing reads the clipboard.

### Runtime path

```
+ click -> AddButton toggles -> scena ContextMenu at the + rect
  -> contextItems(api, sessions, image) -> pick: api.attach(...) | api.upload() | api.type('@' | '/') | a pushed list
  -> the attachment shows in the box; the message text is unchanged
New session page open -> tipAt(tipsFor(...), readTipCount()) -> one tip under the box
tray click -> writeTrayOpen() under hostKey('ahpd-web.new-tray') -> the Agent and folder pills show or fold
box width -> container query on .web-composer__box -> each pill shows its long, short or icon label
footer: left = + and session-scoped settings; right = model, chat-scoped settings, contextReadout(model, usage)
```

### Gaps

- The `+` goes through the box's list by writing `/attach`, so it never toggles and never stands at the button.
- scena's `ActionList` has no filter field; this plan adds none.
- `ComposerApi` has no way to list host files without writing `@`, no changed files, and no pasted image.
- `Composer` receives neither the session's changesets nor the last turn's usage.
- `Pill` takes one `label`; nothing knows a setting's short label or its icon.
- `Not found: a tip, a tray, or a context readout` - searched `tip`, `tray`, `contextWindow` in `src`.

## Answers

| What | Source | Task |
| --- | --- | --- |
| The plans live in a new `.project/` in ahpw, domain `composer`. | Softov 2026-10-14: "New ahpw/.project (Recommended)" | - |
| One plan, a task per item. | Softov 2026-10-14: "One plan, a task per item (Recommended)" | - |
| Add context opens at the `+`, a second click closes it, and it writes nothing into the message. | Softov 2026-10-14: "At the +, toggles (Recommended)" | 01 |
| Files and folders types `@` and Commands types `/`, as today. | Softov 2026-10-14: "@ fiels / command as today" | 01 |
| No filter field in Add context in this plan; a filter belongs to a fuzzy finder. | Softov 2026-10-14: "for now lets skip the filter... its for a fuzzy finder" | - |
| Task 01 reuses what exists: scena's `ContextMenu` as it is, from `AddButton`; no scena change and no new component. | Softov 2026-10-14: "not new componentes on another package until really needed" | 01 |
| Add context lists Files and folders, Upload, Image from clipboard, Sessions and Commands. | Softov 2026-10-14, the scope of item 1 | 01 |
| The Agent pill is the backend (Claude, cofold, pi), not a custom agent from the customizations, and stays a pill. | Softov 2026-10-14: "Agents pill our backends aren't the same things as the Agents.md files.." | 03 |
| Custom agents (customizations of type `agent`) are not in Add context. | Softov 2026-10-14: "ignore agents for now" | 01 |
| Add context has "Image from clipboard", greyed when the clipboard holds no image or the browser refuses, under the 5 MB cap of Upload. | Softov 2026-10-14: "Yes (Recommended)" | 01 |
| In a session, Add context lists the session's changed files, from the changeset the Changes pane uses; the new session box lists none. | Softov 2026-10-14: "The session's changed files (Recommended)" | 01 |
| Both composers get the short placeholder "What should it do?". | Softov 2026-10-14, the scope of item 2 | 02 |
| Tips show in the new session box only, one per open, in a rounded notice under the box, from a fixed list in ahpw. | Softov 2026-10-14: "New session only (Recommended)" | 02 |
| A collapsible tray above the new session box holds the Agent and folder pills; the model and approvals stay in the footer. | Softov 2026-10-14, the scope of item 3 | 03 |
| The tray's collapsed state is kept per host, through `hostKey`, across opens. | Softov 2026-10-14: "Per host (Recommended)" | 03 |
| Pill labels shorten by the box's own width, as "Approvals: Ask Before Edits", "Ask Before Edits", then an icon, in both composers. | Softov 2026-10-14, the scope of item 4 | 04 |
| The footer has the `+` and approvals-like settings on the left, and the model, effort and a context-size readout on the right. | Softov 2026-10-14, the scope of item 5 | 05 |
| The context-size readout shows only when the host's model info carries a context window. | Softov 2026-10-14: "Only if the host reports it (Recommended)" | 05 |
| Ctrl+V of a screenshot or a copied file attaches it, as a drop does; a paste that carries text stays text. | Softov 2026-10-14: "ctrl + v should also work?" | 01 |
| A click on an attachment the message carries shows it, as ahpapp does: an image as itself, text as text, anything else by type and size. | Softov 2026-10-14: "click to see image like ahpapp does would be good." | 07 |
| The preview is scena's `Modal`, as ahpw already uses it, opened from the composer's chips and the transcript's. | Softov 2026-10-14: "scena Modal (Recommended)", "Composer and transcript" | 07 |
| Add context's changed files come from the session's first changeset, `firstScope(scopesOf(changesets))`, the one the Changes pane opens on. | Softov 2026-10-14, built and seen: "plan implement can commit work" | 01 |
| `/attach`, typed in the box, stays and lists the same items as the `+`, built by `contextItems`. | Softov 2026-10-14, built and seen: "plan implement can commit work" | 01 |
| While a turn runs, the session composer says "Queue a message for after this turn, or steer it", as Enter queues there. | Softov 2026-10-14, built and seen: "plan implement can commit work" | 02 |
| The new session box shows one tip per open, in turn: `/` (only when the agent has commands), `@`, `+`, Enter and Shift+Enter; the counter is kept under `ahpd-web.new-tip`. | Softov 2026-10-14, built and seen: "plan implement can commit work" | 02 |
| The folded tray is one line, "Agent: Claude · folder", with a caret; it is open the first time. | Softov 2026-10-14, built and seen: "plan implement can commit work" | 03 |
| Pill labels shorten through CSS container queries on `.web-composer__box`: below 40rem the short label, below 28rem the icon, with the full label as tooltip. | Softov 2026-10-14, built and seen: "plan implement can commit work" | 04 |
| At the narrowest, approvals shows `EMOJIcon.approvals` (⛨), effort `EMOJIcon.thinking`, the model `EMOJIcon.model` (✦), and any other setting `EMOJIcon.settings`. | Softov 2026-10-14, built and seen: "plan implement can commit work" | 04 |
| The footer splits settings by the `scope` field ahpd's backends send: `'chat'` goes right beside the model, anything else left. | Softov 2026-10-14, built and seen: "plan implement can commit work" | 05 |
| A model's own `configSchema` is not in this plan. | Softov 2026-10-14, built and seen: "plan implement can commit work" | - |
| The context readout reads the last turn's `inputTokens` plus `cacheReadTokens` over the window, as `12k / 200k`; the window alone in a new session; nothing for the agent default. | Softov 2026-10-14, built and seen: "plan implement can commit work" | 05 |
| The work is checked end to end in a browser against a throwaway ahpd, in both themes, narrow and wide. | Softov 2026-10-14, the scope of item 6 | 06 |

## Proposed architecture

- **Data flow** - Each pick in Add context becomes a `MessageAttachment` through `api.attach`.
  The sessions come from `AHP_SESSIONS`, and the changed files from `useChangeset`.
  Host files come from `completions` in a session, and from `resourceList` in a new session.
  The image comes from `navigator.clipboard.read()`.
- **Event flow** - A click on the `+` opens scena's `ContextMenu` from `AddButton`.
  A second click, Escape or a click outside closes it.
  No `/attach` text and no box list take part.
- **State flow** - The menu's open state is React state in `AddButton`.
  The tray's open state is in localStorage under `hostKey('ahpd-web.new-tray')`, and the tip counter is in localStorage.
  A pill renders its long, short and icon labels, and CSS shows one by the box's width.
- **Layer responsibilities** - scena: nothing changes.
  ahpw `src/sessions`: the item list, the composer wiring, the tips, the tray, the pill labels, the footer split and the readout.
  ahpw `src/app.css`: the container queries and the footer groups.
- **Source-of-truth files** - [`code://src/sessions/composer-commands.ts`](../../../../src/sessions/composer-commands.ts) stays the contract of `ComposerApi`.
  `contextItems` in `composer-commands.ts` holds the one list of Add context items, for `/attach` and the `+`.

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - Add context opens at the + and toggles](task-01-add-context-at-the-plus.md) | done | - |
| [02 - A short placeholder and a tip under the new session box](task-02-placeholder-and-tips.md) | done | - |
| [03 - The options tray above the new session box](task-03-options-tray.md) | done | - |
| [04 - Pill labels shorten as the box narrows](task-04-labels-shorten.md) | done | - |
| [05 - The footer order and the context readout](task-05-footer-order-and-context.md) | done | 04 |
| [06 - The composers end to end in a browser](task-06-end-to-end.md) | done | 01, 02, 03, 04, 05, 07 |
| [07 - A click on an attachment shows it](task-07-attachment-preview.md) | done | 01 |

## Risks and tradeoffs

- Reading the clipboard asks for a permission in Chromium on the first open.
  Firefox shows its own Paste button on each read.
  The probe runs only on a click of the `+`, and a refusal greys the row.
- `navigator.clipboard` is missing on a page served over plain http from another machine - the row is greyed there, with the reason.
- AHP 1.0.0 does not type the `scope` field that splits the footer - a property without it goes left, so nothing is lost.
- Container queries need Chromium 105, Safari 16 or Firefox 110 - older browsers show the long label, as today.

## Resume state

- **Done so far:** tasks 01 to 07, built and seen by Softov; see [implemented.md](implemented.md).
- **Next action:** none; what waits is in [deferred.md](deferred.md).
- **Watch out for:** scena's `Popup` closes on a mousedown outside before the `+` sees its click.
  So the `+` stops that mousedown while the menu is open.

## Final verification checklist

- [x] Every task is `done` or `dropped`, and `implemented.md` is written.
- [x] `pnpm typecheck` and `pnpm test` pass in ahpw; scena is unchanged.
- [ ] Task 06's browser pass holds in the light and dark themes, narrow and wide.
- [x] `00-composer.md` says what the composer is after this plan.
- [x] `plans/index.md` updated.
