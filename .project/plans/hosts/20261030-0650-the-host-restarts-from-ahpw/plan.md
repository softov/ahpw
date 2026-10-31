---
title: The host restarts from ahpw
domain: hosts
status: active
priority: medium
created: 2026-10-30
revalidated: 2026-10-30
refs:
  - git://e139d05 - the commit of `main` the facts were checked at
  - git://55c4d420 - the ahpd plan that adds `x-ahpd/restart`, in `.project/plans/daemon/20261030-0635-a-client-restarts-the-daemon/`
  - "[code://src/bridges/plugins.ts#L131-L145](../../../../src/bridges/plugins.ts#L131-L145) - `applyPlugins` and `restartNeeded`, the request and the root mark"
  - "[code://src/resources/plugins/index.ts#L54-L83](../../../../src/resources/plugins/index.ts#L54-L83) - `plugins.apply`, a command drawn only when a host offers its method, the pattern to copy"
  - "[code://src/bridges/served.ts#L24-L35](../../../../src/bridges/served.ts#L24-L35) - `trackServed`, which keeps a `when` flag from the offers"
  - "[code://src/resources/host/index.ts#L49-L62](../../../../src/resources/host/index.ts#L49-L62) - the host commands, in the palette's Host category"
  - "[code://src/resources/host/Info.tsx#L122-L125](../../../../src/resources/host/Info.tsx#L122-L125) - the host page's buttons"
  - "[code://src/resources/plugins/Explorer.tsx#L87](../../../../src/resources/plugins/Explorer.tsx#L87) - the short restart note in the plugins list"
  - "[code://src/resources/plugins/PluginPage.tsx#L71](../../../../src/resources/plugins/PluginPage.tsx#L71) - the restart alert on a plugin page"
---

## Goal

A person restarts the host from ahpw, where ahpw says that a restart is needed.
Today ahpw says "Restart the host to apply it" and gives no way to do it.
After this plan, a Restart button calls the host's `x-ahpd/restart`.
A refusal while a turn runs shows the host's words and a button that forces the restart.

## Reconnaissance

The files read and the patterns to reuse are the `refs` in the frontmatter, each with its note.

### Searches performed

- `rg -n "restart" src --include=*.tsx` - two notes say a restart is needed, and no control restarts the host.
- `rg -n "offers.methods.includes" src` - a command that a host may not offer is drawn behind a `when` flag.

### Runtime path

```
Restart button -> ahp.restartHost { host } -> bridge.request('x-ahpd/restart', {})
  -> answer { restarting: true } -> the bridge connects again
  -> refusal -> an alert with the host's words and "Restart anyway" -> { force: true }
```

### Gaps

- ahpw has no request for `x-ahpd/restart`.
- The two restart notes have no button.

## Answers

| What | Source | Task |
| --- | --- | --- |
| ahpw calls the host's `x-ahpd/restart` | Softov, 2026-10-30: "AHP command" | 01 |
| The button shows only when the host offers `x-ahpd/restart` | (defaulted: a client draws only what the host sends) | 01 |
| The button is in the palette, on the host page, and in the two restart notes | (defaulted: the notes are where ahpw asks for a restart) | 01 |
| A refusal shows the host's own words, and "Restart anyway" sends `force: true` | (defaulted: the host decides, and the second press is the confirmation) | 01 |

## Proposed architecture

- **Data flow** - `src/bridges/restart.ts` holds the method name and `restartHost(host, force)`.
- **Event flow** - The command `ahp.restartHost` calls it. The bridge connects again when the host comes back.
- **Layer responsibilities** - bridges: the request · host: the command and the page button · plugins: the button in the notes.
- **Source-of-truth files** - [`code://src/resources/host/index.ts`](../../../../src/resources/host/index.ts)

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - A Restart button calls the host](task-01-a-restart-button-calls-the-host.md) | implemented | - |

## Risks and tradeoffs

- A host without the ahpd plan shows no button, and the notes stay as they are.

## Resume state

- **Done so far:** task 01 is implemented. See [implemented.md](implemented.md).
- **Next action:** Softov does the checks in [hosts-restart-checks.md](../../../pending/hosts-restart-checks.md), then the plan closes.
- **Open questions:** none.
- **Watch out for:** the answer comes before the host stops, so the page goes to the reconnect state after a success.

## Final verification checklist

- [ ] Against a test daemon from `ahpd start`, Restart on the host page restarts it, and ahpw connects again.
- [ ] With a turn running, the alert names the session, and "Restart anyway" restarts the host.
- [ ] Against a host with no `x-ahpd/restart`, no Restart button shows.
