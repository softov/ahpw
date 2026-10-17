---
title: Trusted folders
domain: hosts
status: built
priority: high
created: 2026-10-16
revalidated: 2026-10-16
refs:
  - "[code://src/bridges/data.ts#L456-L467](../../../../src/bridges/data.ts#L456-L467) - the connect event, where the trusted list is sent again and the request handler is installed"
  - "[code://src/bridges/data.ts#L499-L528](../../../../src/bridges/data.ts#L499-L528) - the event loop that sees every action echo"
  - "[code://src/resources/sessions/New.tsx#L434-L464](../../../../src/resources/sessions/New.tsx#L434-L464) - `start`, the only place ahpw creates a session"
  - "[code://src/shell/notify/confirm.ts](../../../../src/shell/notify/confirm.ts) - the confirm dialog, which answers only yes or no today"
  - "[code://src/resources/folders/added.ts](../../../../src/resources/folders/added.ts) - a per-host list kept in the store and in storage"
  - "[code://src/resources/host/Info.tsx](../../../../src/resources/host/Info.tsx) - the host page"
  - file:///github/ahpd/packages/sdk/src/host/trust.ts - `trusted`: a folder is trusted when a trusted URI is it or a parent; `requireTrust` asks the client with `vscode/requestWorkspaceTrust`
  - file:///github/ahpd/packages/sdk/src/host/gate.ts - `workspaceTrust` is kept per connection and needs `trust:push`
  - file:///github/ahpd/packages/sdk/src/host/actions.ts - the push replaces the list and is echoed to the sender
  - file:///github/ahpd/packages/agent-acp/src/session/opening.ts - an ACP agent without `honoursTrust` refuses an untrusted folder
  - file:///github/ahpd/docs/sdk/AUTHENTICATION.md - "Trusted folders"
  - file:///github/ahpapp/src/trust-store.ts - the answers per host, `folderUri`, `trustAction`, `keepYes`
  - file:///github/ahpapp/app/new.tsx - the folder is asked about before `createSession`
  - file:///github/ahpapp/.project/decisions/a-folder-is-trusted-when-the-person-says-so-once.md - ahpapp's decision
---

## Goal

ahpd treats every folder as untrusted until the connection says otherwise, and ahpw never says, so an ACP agent such as Codex cannot start from ahpw, and Claude loads none of a project's own settings, hooks or MCP servers.
ahpw asks once per folder and host whether to trust it, keeps the answer in this browser, and tells the host the trusted folders on every connect.
It answers the host's own question when a session moves to, or adds, a folder, with the same prompt.
The host page lists the answers, and one can be taken back.

## Reconnaissance

The files read and the patterns to reuse are the `refs` above, each with its note.

### Runtime path

```
connect -> data.ts 'connected' -> send root/configChanged { workspaceTrust: { enabled: true, trustedUris } } on ahp-root://
                                -> rawClient().setServerRequestHandler: vscode/requestWorkspaceTrust -> prompt -> { trusted }
New session -> folder unanswered? -> prompt -> yes: send the list, wait for its echo -> createSession
Host page -> Trusted folders -> remove -> send the new list
```

### Gaps

- ahpw sends no `workspaceTrust`, and answers `vscode/requestWorkspaceTrust` with method-not-found, which the host reads as a no.
- `hostBridge.dispatch` is fire-and-forget, so a refused push is not seen.
- The confirm dialog cannot tell "Don't trust" from closing it.

## Answers

| What | Source | Task |
| --- | --- | --- |
| A folder is asked about once per host, when a session would start in it, and the answer is kept in this browser; the trusted folders go to the host on every connect. | Softov, 2026-10-16, asked "How should ahpw decide a folder is trusted?" and chose "Ask once per folder" | 01, 02 |
| The host's `vscode/requestWorkspaceTrust` is answered with the same prompt. | Softov, 2026-10-16, asked "Should ahpw also answer the host's own trust request?" and chose "Yes, with the same prompt" | 02 |
| The host page lists the answers, and removing one sends the new list. | Softov, 2026-10-16, asked "Where should you see and undo your trust answers?" and chose "On the host page" | 03 |
| A no is kept as well as a yes, so a folder is not asked about again; only yeses are sent. Closing the prompt keeps nothing and creates nothing. | file:///github/ahpapp/app/new.tsx | 01, 02 |
| A yes is kept only once the host takes the list; a refused push shows the host's words and creates no session. | file:///github/ahpapp/src/trust-store.ts | 01, 02 |
| A folder is kept as its URI with no trailing slash, as `bare` spells it. | [`code://src/resources/folders/roots.ts`](../../../../src/resources/folders/roots.ts) | 01 |

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - the answers, sent on every connect](task-01-the-answers-sent-on-every-connect.md) | done | - |
| [02 - the prompt](task-02-the-prompt.md) | done | 01 |
| [03 - trusted folders on the host page](task-03-trusted-folders-on-the-host-page.md) | done | 01 |

## Risks and tradeoffs

- A connection opened with a person's own token is nobody until ahpw sends `authenticate`, and a push from nobody is refused - the refusal is shown; see organization/01's deferred list.
- The answers are per browser - another browser or the desk asks again, as VS Code asks per window.

## Resume state

- **Done so far:** tasks 01 to 03, 2026-10-16.
- **Next action:** none; what waits is in [deferred.md](deferred.md).
- **Open questions:** none.
- **Watch out for:** a reconnect makes a new protocol client, so the request handler is installed on every connect; the push must reach the host before a session's first turn.

## Final verification checklist

- [ ] A Codex or other ACP session starts from ahpw in a folder answered yes, and after a reconnect.
- [ ] A folder answered no is not asked again, and its ACP session is refused as before.
- [ ] Moving a session to an unanswered folder asks, and a yes lets the move happen.
- [ ] The host page lists the answers, and removing a yes stops trusting it.
- [ ] `pnpm test` and `pnpm typecheck` pass.
