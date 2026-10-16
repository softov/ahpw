---
title: Hosts - what exists today
domain: hosts
revalidated: 2026-10-16
---

The hosts domain is how ahpw reaches the AHP hosts it shows.
Today ahpw shows one host per page.
Served by ahpd, it talks to that ahpd; run with `ahpw serve --connect`, it talks to the one host named.
Inside the desk, it talks to the window's host, which the embedder gives.
All of it goes through one data layer, `src/bridges/data.ts`, over the protocol SDK's `MultiHostClient` with one host in it.

## Glossary

| Term | Meaning |
| --- | --- |
| host | An AHP server ahpw talks to: an ahpd, VS Code's agent host, or any other. |
| host id | The name a host has inside ahpw: `daemon` for the one host in mono, the desk's host id in multi. |
| window's host | The host a page shows: the page's origin in the browser, the embedder's `host()` inside the desk. |
| data layer | `src/bridges/data.ts`: the connection, every request and dispatch, the followed channels, and the store paths under `$/ahp/`. |
| store path | A path in scena's store that the data layer writes and the views read, as `$/ahp/sessions`. |
| tab key | The key a page is opened under in scena, as `session:<uri>`; the same key focuses the open tab. |
| embedder | What an app hands ahpw as `globalThis.ahpwEmbedder`: the hosts, the window's host and its token, the statuses, a switch to another host. |
| mono | One host per page, as today. |
| multi | One page with every host, a later option on the desk. |

## Packages

- [`code://src/bridges/data.ts`](../../../src/bridges/data.ts) - the data layer; `const HOST = 'daemon'` at line 62 is the one host id.
- [`code://src/shell/embed/index.ts`](../../../src/shell/embed/index.ts) - the embedder contract, which already lists every host.
- [`code://src/lib/storage-keys.ts`](../../../src/lib/storage-keys.ts) - `hostKey`, which keeps a host's pages under its address on the desk.

## Contracts

- [`code://src/shell/embed/index.ts`](../../../src/shell/embed/index.ts) - `Embedder` and `EmbedHost`; the desk implements it.
- `npm://@microsoft/agent-host-protocol` - `MultiHostClient`, which keys sessions by host id and session URI together.

## Runtime path

```
connect() -> addHost('daemon', socket) -> MultiHostClient
  -> request / dispatch / follow (no host argument) -> store paths $/ahp/... (no host in the path)
  -> views read the paths; pages open under tab keys with the resource alone
```

## Tests

- [`code://src/bridges/summaries.test.ts`](../../../src/bridges/summaries.test.ts) - the summary overlay, keyed by session URI.
- [`code://src/bridges/socket.test.ts`](../../../src/bridges/socket.test.ts) - the socket address, from the embedder or the page.

## Known gaps

- Nothing in the data layer, the store paths, the tab keys or the per-URI maps names a host.
  Two hosts in one page would write over each other (plan 01).
- There is no page with every host (plan 02).
