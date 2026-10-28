---
title: A connector page says it is signed in and what it serves
domain: plugins
status: active
priority: medium
created: 2026-10-28
revalidated: 2026-10-28
requires:
  - plans/plugins/09-a-connector-signs-in-from-its-form/plan.md
refs:
  - file:///github/ahpw/.project/briefs/a-connector-page-says-what-it-serves.md - the brief this plan covers, never committed
  - git://efe9867 - the commit Softov's plugins 09 tree sits on; this plan builds on that tree, in the same PR
  - "[code://src/resources/connectors/SignInStep.tsx](../../../../src/resources/connectors/SignInStep.tsx) - the sign-in step, which gets its done state"
  - "[code://src/resources/connectors/Overview.tsx](../../../../src/resources/connectors/Overview.tsx) - the facts, which get the health, and the capability groups, which get `models`"
  - "[code://src/resources/connectors/ConnectorPage.tsx](../../../../src/resources/connectors/ConnectorPage.tsx) - the tabs, which get Models"
  - "[code://src/resources/agents/Overview.tsx#L66-L94](../../../../src/resources/agents/Overview.tsx#L66-L94) - the agent's models table, the pattern for the connector's"
  - "[code://src/shell/controls/CopyButton.tsx](../../../../src/shell/controls/CopyButton.tsx) - the copy with its fallback, shared with the capability row"
  - "[code://src/resources/log/LogPage.tsx#L130](../../../../src/resources/log/LogPage.tsx#L130) - a search field over a list"
  - file:///github/ahpd.worktrees/connector-models/.project/plans/plugin/20261028-2151-a-connector-lists-its-models/plan.md - the host half, `x-ahpd/connectors/models`
---

## Goal

A connector page says the connector works and lists what it serves.
Softov signed in to OpenRouter, and the form said only "Saved.", the page said only "Ready", and no screen listed a model.
After this plan, the sign-in step says it is done, the page shows the last check, and a Models tab lists the models.

## Reconnaissance

The files read and the patterns to reuse are the `refs` in the frontmatter, each with its note.

### Searches performed

- `rg -n "health" src/bridges/connectors.ts` - no match. `ConnectorRow` drops the row's `health`.
- `rg -n "<table" src --glob "*.tsx"` - the agent and host pages draw a `web-runs web-table` table, not scena's `DataTable`.
- `rg -n "navigator.clipboard" src` - `CopyButton.tsx` has the fallback, and the capability row copies without it.

### Runtime path

```
x-ahpd-connectors row { health } -> Overview facts: last check, last failure
SignInStep finish -> signin-finish -> row -> the step says "Signed in with <adapter>" and offers to sign in again
Models tab -> readConnectorModels(host, id) -> x-ahpd/connectors/models { id } -> { models, at } -> search, table
```

### Gaps

- The row's `health` is not read.
- The sign-in step goes back to its button after a sign-in.
- No screen reads a connector's models.

## Answers

| What | Source | Task |
| --- | --- | --- |
| The models list is a Models tab beside Overview and Settings, shown only when the adapter has a `models` capability | Softov, 2026-10-28: "write the brief build both plans and implement", on the suggestion | 01 |
| The tab is a table with a search field: the proxy name with Copy, the provider's name, the context and the price | Softov, 2026-10-28, same message | 01 |
| A model the reader may not call is dimmed, not hidden | Softov, 2026-10-28, same message | 01 |
| The page's health check is how a new connector shows its sign-in worked | Softov, 2026-10-28, same message | 01 |
| A price shows in dollars per million tokens, prompt then answer | (defaulted: a price per token is too small to read) | 01 |
| This plan is built in Softov's checkout, on the plugins 09 tree, for one PR | Softov, 2026-10-28: "In your checkout (Recommended)" | 01 |

## Proposed architecture

- **Data flow** - the bridge reads the row's `health` and calls `x-ahpd/connectors/models`. The page draws what the host sends.
- **Event flow** - the Models tab reads once when it opens. A Read again button reads again.
- **State flow** - the models list lives in the tab's state only.
- **Layer responsibilities** - bridge: the types and the call · Overview: the health · Models: the tab · SignInStep: the done state.
- **Source-of-truth files** - [`code://src/bridges/connectors.ts`](../../../../src/bridges/connectors.ts)

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - The page shows the health and the models](task-01-the-page-shows-health-and-models.md) | implemented | - |

## Risks and tradeoffs

- A host without the ahpd half refuses `x-ahpd/connectors/models`. The tab then shows the host's error.
- An OpenRouter list has some hundreds of rows. The table draws them all, and the search narrows them.

## Resume state

- **Done so far:** task 01, built on 2026-10-28 in `/github/ahpw`, not committed. A test host showed the Overview and the Models tab at two widths. The done sign-in step and a dimmed row were not seen.
- **Next action:** Softov checks the page with the ahpd half running. Then a commit with plugins 09.
- **Open questions:** none.
- **Watch out for:** the ahpd answer's shape. A change there changes the bridge.

## Final verification checklist

- [x] `pnpm typecheck` passes.
- [x] `pnpm test` passes.
- [ ] Softov sees the health, the done sign-in step and the Models tab, at two widths.
