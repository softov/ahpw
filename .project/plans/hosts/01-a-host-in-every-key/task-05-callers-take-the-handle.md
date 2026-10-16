---
title: Every caller takes its host's handle, and the old exports go
status: done
depends: [task-02-store-paths-name-the-host.md, task-03-tab-keys-name-the-host.md, task-04-maps-name-the-host.md]
layer: "src/bridges, src/resources, src/shell"
refs:
  - "[code://src/bridges/data.ts](../../../../src/bridges/data.ts) - the old exports, which task 01 left as calls on the window's host"
---

## Objective

No code calls the data layer without a host: each caller uses `hostBridge(host)`.
The old exports are gone, so a call with no host does not compile.

## Files

- `UPDATE: src/bridges/data.ts` - the old exports go; `hostBridge`, `windowHost`, `ahpPaths` and the path builders stay.
- `UPDATE: src/resources/agents/Explorer.tsx` - `hostBridge(windowHost())`.
- `UPDATE: src/resources/agents/Page.tsx` - `hostBridge(props.host)`.
- `UPDATE: src/resources/agents/index.ts` - the command's host.
- `UPDATE: src/resources/automations/Edit.tsx` - the page's host.
- `UPDATE: src/resources/automations/Explorer.tsx` - the window's host.
- `UPDATE: src/resources/automations/Page.tsx` - the page's host.
- `UPDATE: src/resources/automations/actions.ts` - the host passed in.
- `UPDATE: src/resources/automations/index.ts` - the command's host.
- `UPDATE: src/resources/changes/Explorer.tsx` - the active session's host.
- `UPDATE: src/resources/changes/changeset.ts` - the host passed in.
- `UPDATE: src/resources/files/DiffPage.tsx` - the page's host.
- `UPDATE: src/resources/files/FilePage.tsx` - the page's host.
- `UPDATE: src/resources/files/clicks.ts` - the host passed in.
- `UPDATE: src/resources/files/media.tsx` - the page's host.
- `UPDATE: src/resources/files/text.tsx` - the page's host.
- `UPDATE: src/resources/folders/Explorer.tsx` - the window's host.
- `UPDATE: src/resources/folders/FolderPicker.tsx` - the host passed in.
- `UPDATE: src/resources/folders/actions.ts` - the host passed in.
- `UPDATE: src/resources/folders/folder-path.ts` - the host passed in.
- `UPDATE: src/resources/host/Info.tsx` - the page's host.
- `UPDATE: src/resources/host/Settings.tsx` - the page's host.
- `UPDATE: src/resources/log/LogPage.tsx` - the window's host.
- `UPDATE: src/resources/sessions/Attached.tsx` - the session's host.
- `UPDATE: src/resources/sessions/Composer.tsx` - the session's host.
- `UPDATE: src/resources/sessions/Details.tsx` - the session's host.
- `UPDATE: src/resources/sessions/Explorer.tsx` - the window's host.
- `UPDATE: src/resources/sessions/FolderPill.tsx` - the host passed in.
- `UPDATE: src/resources/sessions/New.tsx` - the window's host.
- `UPDATE: src/resources/sessions/Page.tsx` - the page's host.
- `UPDATE: src/resources/sessions/alerts.ts` - the host passed in.
- `UPDATE: src/resources/sessions/composer-commands.ts` - the composer's host.
- `UPDATE: src/resources/sessions/folder-mentions.ts` - the host passed in.
- `UPDATE: src/resources/sessions/index.ts` - the command's host.
- `UPDATE: src/resources/terminals/TerminalPage.tsx` - the page's host.
- `UPDATE: src/resources/terminals/index.ts` - the command's host.
- `UPDATE: src/resources/terminals/rows.ts` - the host passed in.
- `UPDATE: src/shell/CommandPalette.tsx` - the window's host.
- `UPDATE: src/shell/register-shell.tsx` - the window's host.

## Steps

1. Move one resource folder at a time from the old exports to `hostBridge(host)`, with `pnpm typecheck` after each.
2. Take the host from a page's props, a command's arguments, or `windowHost()` in a sidebar view.
3. Delete the old exports from `data.ts` when nothing imports them.

## Validation

- `pnpm typecheck` passes with the old exports gone.
- `rg "from '.*bridges/data(\.js)?'" src` shows only `hostBridge`, `windowHost`, `ahpPaths`, the path builders and types imported.
- `pnpm test` passes.

## Resume

- Done 2026-10-16: the old exports and `mine()` are gone from `src/bridges/data.ts`; every caller uses `hostBridge(host)`.
- Pages use their `host` prop; sidebars, the palette, the status bar and New session use `windowHost()`.
- The helpers take the host first: `useFileText`, `useFileUrl`, `MediaFrame`, `imagesFrom`, `linkClicks`, `useChangeset`, `openChange`, `childFolders`, `folderMentions` and the automation actions.
- The folder entry actions get the window's host, the one the explorer shows.
- Transcript parts read the page's host with `useSessionHost()`, which throws outside a session page.
- `CustomizationTrees` takes the agent page's host, for the files it reads and opens.
- Verified: `pnpm typecheck` and the suite, 56 files and 331 tests, pass.
- The data.js imports are only `hostBridge`, `windowHost`, `ahpPaths`, the path builders, `ROOT`, `AUTOMATIONS`, `ahpProvider` and types; `'daemon'` is only in `windowHost()`.
