---
title: A plugin is turned on, turned off, configured and imported again while the host runs
domain: plugins
status: built
priority: medium
created: 2026-10-23
revalidated: 2026-10-23
requires:
  - plans/plugins/03-plugins-explorer-and-page/plan.md
refs:
  - "[code://src/bridges/offers.ts#L20-L26](../../../../src/bridges/offers.ts#L20-L26) - `Offers`, which keeps only each method's name"
  - "[code://src/bridges/plugins.ts#L94-L120](../../../../src/bridges/plugins.ts#L94-L120) - the enable, disable and options requests, whose comments say a restart applies them"
  - "[code://src/resources/plugins/actions.ts](../../../../src/resources/plugins/actions.ts) - `togglePlugin` and `rereadAfterChange`"
  - "[code://src/resources/plugins/index.ts#L56-L68](../../../../src/resources/plugins/index.ts#L56-L68) - the explorer's actions"
  - "[code://src/resources/plugins/PluginPage.tsx#L48-L58](../../../../src/resources/plugins/PluginPage.tsx#L48-L58) - the page's actions"
  - git://b27cb152 - ahpd main with PR 81, where every plugin command applies at once
  - file:///github/ahpd/packages/server/src/pluginschannel.ts - the five commands, their grants, their `describe()` and their replies
  - file:///github/ahpd/packages/sdk/src/host/root.ts - `ahpd.methods` sends each command's `title`, `description` and `grant`
---

## Goal

ahpd now applies a plugin command while it runs.
ahpw offers the two new commands, `reload` and `apply`, and says what each command does in the host's words.
A restart note shows only when the host says a restart is needed.

## Reconnaissance

The files read and the patterns to reuse are the `refs` above, each with its note.

### Searches performed

- `rg "plugins/reload|plugins/apply" src` in ahpw - nothing calls them.
- `rg "description" src/bridges/offers.ts` in ahpw - `offersOf` drops a method's title and description.
- `git grep "restartNeeded()" origin/main -- packages/server/src/pluginschannel.ts` in ahpd - the root is marked only when a reply says `restart: true`.

### Runtime path

```
initialize _meta ahpd.methods [{ method, title, description, grant }] -> Offers.described -> a button's tooltip
button -> x-ahpd/plugins/<command> -> { restart } -> x-ahpd-plugins and root read again -> rows and restart note
```

### Gaps

- ahpw does not call `x-ahpd/plugins/reload` or `x-ahpd/plugins/apply`.
- `Offers` has no method descriptions.
- The comments on the enable, disable and options requests say that a restart applies the change.

## Answers

| What | Source | Task |
| --- | --- | --- |
| A button keeps ahpw's own translated label, and the host's `description` is its tooltip. | Softov, 2026-10-23: "ahpw words, host tooltip" | 01, 02 |
| The restart note follows the root's `ahpd.restartNeeded`, which the host sets only for a reply with `restart: true`. | [code://src/resources/plugins/PluginPage.tsx#L60](../../../../src/resources/plugins/PluginPage.tsx#L60) | 02 |
| `reload` is on a plugin's page and in its row menu, as "Import again". | (defaulted: the list's "Reload" already reads the list again) | 02 |
| `apply` is an action of the explorer, shown when a host offers it. | (defaulted: it acts on every plugin of a host) | 02 |
| A button shows only when the host offers its command. | (defaulted: as `mayToggle` does) | 02 |
| After each command, ahpw reads the plugins and the root again. | [code://src/resources/plugins/actions.ts](../../../../src/resources/plugins/actions.ts) | 02 |
| No plugin is named in code. | Peer session for Softov, 2026-10-23: "do not hardcode labels or plugin names" | 01, 02 |

## Proposed architecture

- **Data flow** - `offersOf` keeps each method's description beside its name.
- **State flow** - The rows and the root are read again after a command, as today.
- **Layer responsibilities** - `src/bridges/plugins.ts` sends the commands. `src/resources/plugins/actions.ts` runs one and reports a refusal. The page, the row menu and the explorer draw the buttons.
- **Source-of-truth files** - ahpd's `packages/server/src/pluginschannel.ts`.

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - The host's description of each command, and the two new requests](task-01-descriptions-and-requests.md) | done | - |
| [02 - Import again and apply, with the host's tooltips](task-02-import-again-and-apply.md) | done | 01 |

## Risks and tradeoffs

- A host before `b27cb152` offers neither new command - ahpw shows neither button.
- A live adapter change keeps the old adapter tools until a restart - this is ahpd's gap, and ahpw says nothing about it.

## Resume state

- **Done so far:** tasks 01 and 02, the check by hand, and [implemented.md](implemented.md).
- **Next action:** none.
- **Watch out for:** nothing.

## Final verification checklist

- [x] `npx tsc -b`, `npx vitest run` and `pnpm build` pass.
- [x] By hand, on an isolated ahpd at `b27cb152` or later: enable, disable, import again and apply, with no restart note.
- [x] `plans/index.md` updated.
