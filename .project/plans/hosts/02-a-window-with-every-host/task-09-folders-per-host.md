---
title: The folders explorer shows each host's folders
status: done
depends: [task-04-the-host-filter.md]
layer: "src/resources/folders"
refs:
  - "[code://src/resources/folders/Explorer.tsx#L34-L60](../../../../src/resources/folders/Explorer.tsx#L34-L60) - `FolderExplorer`: its branches, roots and reads, all for one host"
  - "[code://src/resources/folders/actions.ts#L32-L42](../../../../src/resources/folders/actions.ts#L32-L42) - `addFolder`, from the window's host's default folder"
  - "[code://src/resources/folders/added.ts](../../../../src/resources/folders/added.ts) - `ADDED_KEY`, the added folders of one host"
  - "[code://src/resources/folders/expanded.ts](../../../../src/resources/folders/expanded.ts) - `EXPANDED_KEY`, the open folders of one host"
---

## Objective

In multi, the folders explorer shows one branch per shown host, named for the host, with that host's roots under it.
Each host keeps its own open folders and added folders, and every action on a row goes to the row's host.

## Files

- `CREATE: src/resources/folders/HostFolders.tsx` - the tree of one host: the body of `FolderExplorer` today, with `host` as a prop for its paths, reads and actions.
- `UPDATE: src/resources/folders/Explorer.tsx:34-60` - in mono, `HostFolders` for the window's host; in multi, a branch per shown host, each with its own `HostFolders`.
- `UPDATE: src/resources/folders/added.ts`, `src/resources/folders/expanded.ts` - the stored lists by host id, so two hosts' folders do not mix.
- `UPDATE: src/resources/folders/actions.ts:32-42` - `addFolder(scena, host)`; the entry actions get the host of the menu's row.
- `UPDATE: src/resources/folders/index.ts` - `REVEAL_FOLDER` holds `{ host, uri }`; `ahp.revealFolder` takes `host?`; the header declares `HOST_FILTER_ACTION`.
- `UPDATE: src/resources/folders/FolderPicker.tsx` - `askFolder` takes the host whose folders it walks.

## Steps

1. Move the body of `FolderExplorer` into `HostFolders`, with `host` in place of `windowHost()`.
2. Key the added and open folders by host, keeping the mono lists where they are.
3. Draw a branch per shown host in multi, and the one tree in mono.
4. Give `REVEAL_FOLDER`, `addFolder`, the entry actions and `askFolder` their host.

## Validation

- `src/resources/folders/*.test.ts` pass, with cases for two hosts' added folders.
- `pnpm test` and `pnpm typecheck` pass.
- By hand, in task 08: each host's folders show under its name, and a file opens on its own host.

## Resume

- Done 2026-10-16: `FolderExplorer` draws one `HostFolders` per shown host.
  With every host, each sits under a branch named for its host, kept open as `HOST_NODE`.
- `HostFolders.tsx` was not made: `HostFolders` is a function in `Explorer.tsx`, beside the one that lays the hosts out.
- The added and open folders are per host: `addedPath(host)` and `expandedPath(host)` in the store, and `perHostKey` in `src/lib/storage-keys.ts` for storage.
  Mono keeps its keys; `onEachHost` loads each host's lists as it joins.
- `MenuEntry`, `StaleFolders`, `REVEAL_FOLDER`, `askFolder` and a dragged file carry their host; `addFolder` takes it.
- A composer drops only a file from its own host's tree.
- The folders and agents headers have the host filter.
- With every host, the not-connected line is `HostLines`, as in the other lists.
- Verified: `src/resources/folders/added.test.ts` for two hosts' added folders, `perHostKey` in `src/lib/storage-keys.test.ts`; the suite, 60 files and 347 tests, and `pnpm typecheck` pass.
