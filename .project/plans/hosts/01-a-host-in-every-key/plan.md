---
title: A host in every key
domain: hosts
status: built
priority: high
created: 2026-10-16
revalidated: 2026-10-16
refs:
  - "[code://src/bridges/data.ts#L62](../../../../src/bridges/data.ts#L62) - `const HOST = 'daemon'`, the one host id, used 14 times in this file only"
  - "[code://src/bridges/data.ts#L17-L54](../../../../src/bridges/data.ts#L17-L54) - the store paths under `$/ahp/`, with no host in them"
  - "[code://src/bridges/data.ts#L92-L99](../../../../src/bridges/data.ts#L92-L99) - the module state of the one host: `client`, `newer`, `followed`, `waiting`"
  - "[code://src/bridges/data.ts#L303-L327](../../../../src/bridges/data.ts#L303-L327) - `publishHost`, which drops the `hostId` the SDK gives"
  - "[code://src/bridges/summaries.ts#L15-L19](../../../../src/bridges/summaries.ts#L15-L19) - the overlay, keyed by session URI because ahpw shows one host"
  - "[code://src/resources/log/wire.ts#L33-L36](../../../../src/resources/log/wire.ts#L33-L36) - `asked` and `listed`, for one host"
  - "[code://src/resources/sessions/index.ts#L157](../../../../src/resources/sessions/index.ts#L157) - the tab key `session:<uri>`; the other resources key their tabs the same way"
  - "[code://src/shell/embed/index.ts](../../../../src/shell/embed/index.ts) - `host()` gives the window's host, with its id"
  - "[code://src/lib/storage-keys.ts#L9-L11](../../../../src/lib/storage-keys.ts#L9-L11) - `hostKey`, which stays as it is"
  - npm://@microsoft/agent-host-protocol - `MultiHostClient`; its hosts types say a session is keyed by host id and resource together
  - file:///github/ahp-desk/.project/specs/app-window.md - the desk's one host per window, which plan 02 and the desk's plan 12 change
---

## Goal

Every place in ahpw that holds a host's data names the host.
That is the data layer, the store paths, the tab keys, and the maps keyed by a session or a terminal.
Nothing changes for the person: a page still shows one host, served by ahpd, run by hand, or in a desk window.
This is the ground for a page with every host (plan 02).
There, two hosts can have the same session id or the same file path.

## Reconnaissance

The files read and the patterns to reuse are the `refs` above, each with its note.

### Searches performed

- `rg "bridges/data|bridges/channel|bridges/summaries" src` - 38 files outside the tests import the data layer: agents, automations, changes, files, folders, host, log, sessions, terminals, `CommandPalette` and `register-shell`.
- `rg "AHP_[A-Z_]+|channelPath\(|titlePath\(|channelErrorPath\(" src` - 29 files read the store paths; terminals, host Info and the session explorer the most.
- `rg "session:\$\{|file:\$\{|diff:\$\{|terminal:\$\{|automation:|agent:\$\{|host:(info|settings):page" src` - the tab keys of every resource.
- `rg "new Map<string" src/resources` - maps keyed by URI in `log/wire.ts`, `sessions/composer-commands.ts`, `sessions/Activity.tsx` and `sessions/Question.tsx`.

### Runtime path

```
connect() -> addHost(<host id>, socket) -> MultiHostClient
  -> hostBridge(<host id>).request / dispatch / follow -> $/ahp/hosts/<host id>/...
  -> views read their host's paths; pages open under keys that name the host, with `host` in their props
```

### Gaps

- The data layer's functions take no host, and its module state is for one host.
- The store paths, the tab keys and four maps are keyed without the host.
- `Not found: a test of data.ts - searched src/bridges/*.test.ts.`

## Answers

| What | Source | Task |
| --- | --- | --- |
| A host is reached through a handle bound to it, `hostBridge(hostId)`, with the functions the data layer exports today. | Softov, 2026-10-16: "A handle per host" | 01, 05 |
| Every key names the host, in mono as in multi, so there is one shape and one code path. Tabs saved before are not restored once. | Softov, 2026-10-16: "what is the best case? saved tabs aren't a problem"; one shape everywhere was the recommendation | 02, 03, 04 |
| In multi, a host is named by the desk's host id. In mono the one host is `daemon`, which ahpw knows at once; the embedder's id comes only from the asynchronous `host()`. | Softov, 2026-10-16, asked what names a host in multi: "The desk's host id" | 01 |
| Mono looks and behaves as today: served by ahpd, run by hand with one host, and in a desk window. | Softov, 2026-10-16: "When inside ahpd it act as today. When running manually with a host defined, work as today." | 06 |
| `hostKey`, which keeps a host's pages under its address on the desk, stays as it is. | [code://src/lib/storage-keys.ts#L9-L11](../../../../src/lib/storage-keys.ts#L9-L11) | - |

## Proposed architecture

- **Data flow** - `hostBridge(id)` returns one host's `HostBridge`: `request`, `dispatch`, `follow`, `readOnce`, `refresh`, `reloadSessions`, the resource reads and writes, and `reconnect`. Its state lives in a `Map<string, HostState>` by host id.
- **Event flow** - `watchHost` and `watchChannels` write each host's events under that host's paths, from the `hostId` the SDK tags them with.
- **State flow** - the store paths are `$/ahp/hosts/<host id>/...`, built by `ahpPaths(host)`, `channelPath(host, uri)`, `titlePath(host, uri)` and `channelErrorPath(host, uri)`.
- **Layer responsibilities** - `src/bridges`: the handles and the paths · `src/resources/*`: each view takes its host's handle and paths, and each page gets `host` · `src/shell`: `windowHost()`.
- **Source-of-truth files** - [`code://src/bridges/data.ts`](../../../../src/bridges/data.ts)

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - the data layer has a handle per host](task-01-a-handle-per-host.md) | done | - |
| [02 - the store paths name the host](task-02-store-paths-name-the-host.md) | done | 01 |
| [03 - the tab keys and page props name the host](task-03-tab-keys-name-the-host.md) | done | 01 |
| [04 - the maps keyed by a resource name the host](task-04-maps-name-the-host.md) | done | 01 |
| [05 - every caller takes its host's handle, and the old exports go](task-05-callers-take-the-handle.md) | done | 02, 03, 04 |
| [06 - mono end to end, as today](task-06-mono-end-to-end.md) | done | 05 |

## Risks and tradeoffs

- A call left on the wrong host fails with no error, as the SDK warns. Task 05 removes the old exports, so a call with no host does not compile.
- 38 files change; the work moves one resource folder at a time behind the handle, with the old exports kept until task 05.
- `@ahpd/web` releases with the desk; the embedder contract does not change in this plan, so an older desk keeps working.

## Resume state

- **Done so far:** the plan, and tasks 01 to 06, 2026-10-16.
- **Next action:** none; hosts plan 02 builds on this.
- **Open questions:** none.
- **Watch out for:** `settleWaiting` fails every waiting request at once; with a handle per host, a host that fails must fail only its own requests.

## Final verification checklist

- [x] `rg "'daemon'" src` finds only `windowHost()`.
- [x] Served by ahpd, by `ahpw serve`, and in a desk window, ahpw looks and works as before, a host switch on the desk included.
- [x] `pnpm test` and `pnpm typecheck` pass; ahpw has no lint script.
- [x] `plans/index.md` updated.
