---
title: A Files tab shows the focused session's folder
status: implemented
depends: []
layer: "sessions, folders"
refs:
  - "[code://src/resources/folders/Explorer.tsx#L51](../../../../src/resources/folders/Explorer.tsx#L51) - the tree to reuse"
  - "[code://src/resources/sessions/Details.tsx#L44](../../../../src/resources/sessions/Details.tsx#L44) - `workingDirectories[0]`, the session's folder"
---

## Objective

The right sidebar has a Files tab with the tree of the focused session's folder.

## Files

- `UPDATE: src/resources/folders/Explorer.tsx` - lift the tree into a component that takes its roots; `FolderExplorer` passes its own roots.
- `CREATE: src/resources/sessions/Files.tsx` - `SessionFiles`: the tree rooted at the active session's first working directory, or a note when it has none.
- `UPDATE: src/resources/sessions/index.ts` - register `SessionFiles` and mount it with `mountRight` as `session:files`.
- `UPDATE: src/i18n/en.json` - the tab title and the empty note; the same keys in `es.json` and `pt.json`.

## Steps

1. Move the tree of `FolderExplorer` into an exported component that takes roots and a host.
2. Keep `FolderExplorer` working with its own roots through that component.
3. Write `SessionFiles` over `ACTIVE_SESSION` and the session summary.
4. Root the tree at `workingDirectories[0]` of the session.
5. Show a note when the session has no folder.
6. Mount the tab with `mountRight`, after Changes.

## Validation

- `pnpm typecheck` and `pnpm test` pass.
- By hand: the left folder explorer works as before.
- By hand: the Files tab follows a click on another session.

## Resume

- `HostFolders` in `src/resources/folders/Explorer.tsx` is exported and takes `rooted`; with it, the tree shows only those folders and keeps its open folders in local state.
- `SessionFiles` mounts from `registerSessionFiles`, which `src/shell/register-shell.tsx` calls after `registerChanges`, so the tab comes after Changes.
- Checked by hand at 1280 light and 760 dark: the left explorer works as before, and Files shows `work` or `work2` for the focused session.
