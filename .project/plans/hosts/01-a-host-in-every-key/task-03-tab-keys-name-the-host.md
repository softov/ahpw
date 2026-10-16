---
title: The tab keys and page props name the host
status: done
depends: [task-01-a-handle-per-host.md]
layer: "src/resources"
refs:
  - "[code://src/resources/sessions/index.ts#L150-L161](../../../../src/resources/sessions/index.ts#L150-L161) - `openSession`: the key `session:<uri>` and `resource: { component, resource }`"
  - "[code://src/resources/files/viewers.ts#L14](../../../../src/resources/files/viewers.ts#L14) - `fileTabKey`"
---

## Objective

Every page opens under a key that names its host, and gets `host` in its resource props, so a page knows which host it shows.
A command that opens a page takes `host` in its arguments, and defaults to the window's host.

## Files

- `UPDATE: src/resources/sessions/index.ts:157` - `session:<host>:<uri>`, and `host` in the resource and the command's arguments.
- `UPDATE: src/resources/files/viewers.ts:14` - `fileTabKey(component, host, uri)` as `file:<host>:<component>:<uri>`.
- `UPDATE: src/resources/files/index.ts:141` - `diff:<host>:<file>:<after or before>`.
- `UPDATE: src/resources/terminals/index.ts` - `terminal:<host>:<uri>`.
- `UPDATE: src/resources/automations/index.ts:79` - `automation:edit:<host>:<resource>`.
- `UPDATE: src/resources/automations/index.ts:96` - `automation:<host>:<resource>`.
- `UPDATE: src/resources/automations/Edit.tsx:72` - the close uses the same key.
- `UPDATE: src/resources/agents/index.ts:50` - `agent:<host>:<provider>`.
- `UPDATE: src/resources/host/index.ts:33` - `host:info:<host>`.
- `UPDATE: src/resources/host/index.ts:44` - `host:settings:<host>`.
- `UPDATE: src/resources/files/FilePage.tsx` - reads `host` from its props.
- `UPDATE: src/resources/files/DiffPage.tsx` - reads `host` from its props.
- `UPDATE: src/resources/sessions/Page.tsx` - reads `host` from its props.
- `UPDATE: src/resources/terminals/TerminalPage.tsx` - reads `host` from its props.
- `UPDATE: src/resources/automations/Page.tsx` - reads `host` from its props.
- `UPDATE: src/resources/agents/Page.tsx` - reads `host` from its props.
- `UPDATE: src/resources/host/Info.tsx` - reads `host` from its props.
- `UPDATE: src/resources/host/Settings.tsx` - reads `host` from its props.

## Steps

1. Add `host` to the resource object of each page opened, beside `resource` or `uri`.
2. Put the host in each tab key, after the kind, as the Files list gives.
3. Add `host?: string` to each open command's arguments, and use `windowHost()` when it is absent.
4. In each page, take `host` from its props, and pass it to the handle and the paths.

## Validation

- `pnpm typecheck` and `pnpm test` pass.
- By hand, served by ahpd: each kind of page opens, from a session to host Info.
- By hand: opening each one again focuses its tab.

## Resume

- Done 2026-10-16: every page opens under a key with its host after the kind, such as `session:<host>:<uri>` and `file:<host>:<viewer>:<uri>`, and gets `host` in its resource.
- Each open command takes `host?` in its arguments and uses `windowHost()` without one; a page that opens another passes its own host.
- `fileTabKey(component, host, uri)`, `fileTabOf` and `openAsItems(scena, host, uri, current)` carry the host; the terminals module parses `terminal:<host>:<uri>` and keys its own sets by tab key.
- The pages read their paths and channels from the `host` prop; their handle calls move in task 05.
- The file pages take `host` in their resource, and read it in task 05, since only their handle calls need it.
- The layout key is `ahpd-web.layout.v2`, so a layout saved before is not restored: its tabs name no host (Answers row 'Every key names the host').
- A host id goes into a key as it is.
  The desk's ids are slugs and the mono id is `daemon`, so neither holds a `:`.
- Bug found and fixed on the way: in `openAsItems`, the menu's `host` argument hid the file's host.
- Verified: the file and terminal tests read the new keys, plus a case that opens another host's terminal; the suite and `pnpm typecheck` pass.
- Not done by hand: opening each kind of page served by ahpd moves to task 06.
