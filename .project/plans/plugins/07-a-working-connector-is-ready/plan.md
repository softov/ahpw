---
title: A working connector shows as ready
domain: plugins
status: planned
priority: medium
created: 2026-10-24
revalidated: 2026-10-24
requires:
  - plans/plugins/04-connectors/plan.md
refs:
  - "[code://src/bridges/connectors.ts#L73-L75](../../../../src/bridges/connectors.ts#L73-L75) - `ConnectorState` and `CONNECTOR_STATES`, whose `open` becomes `ready`"
  - "[code://src/resources/connectors/ConnectorPage.tsx#L15](../../../../src/resources/connectors/ConnectorPage.tsx#L15) - `TONE`, the badge tone for each state"
  - "[code://src/resources/connectors/ConnectorPage.tsx#L55](../../../../src/resources/connectors/ConnectorPage.tsx#L55) - the page shows no note for a working connector"
  - "[code://src/resources/connectors/rows.ts#L11](../../../../src/resources/connectors/rows.ts#L11) - `DOT`, the dot for each state"
  - "[code://src/i18n/pt.json#L2283-L2287](../../../../src/i18n/pt.json#L2283-L2287) - `connectors.states`, where `open` is \"Aberto\""
  - file:///github/ahpd/.project/plans/plugin/62-a-working-connector-is-ready/plan.md - the host side of the rename
---

## Goal

ahpw reads the connector state `ready` in place of `open`, and shows it as "Ready", "Pronto" and "Listo".
It changes with ahpd's plugin plan 62, which renames the state on the wire.

## Reconnaissance

The files read and the patterns to reuse are the `refs` above, each with its note.

### Searches performed

- `rg -n "'open'" src` - the type, the state order, the page and `rows.test.ts` name the state.
- `rg -n '"ready"' src/i18n` - the plugin list already says "Ready" and "Pronto" for a plugin that loaded.

### Runtime path

```
x-ahpd/connectors row { state: 'ready' } -> ConnectorRow -> DOT, TONE, connectors/states/ready
```

### Gaps

- "Aberto" reads as a door left open, not as a connector that works.

## Answers

| What | Source | Task |
| --- | --- | --- |
| The state `open` is `ready` | Softov, 2026-10-24: "we need a better state name then 'open'... open means more like a connection." Then `ready`, from the options | 01 |
| The labels are the plugin list's words: "Ready", "Pronto" and "Listo" | (defaulted: one word has one meaning on both screens) | 01 |
| ahpw reads `ready` only, and does not also read `open` | (defaulted: ahpd and ahpw ship together) | 01 |

## Proposed architecture

- **Data flow** - the row's `state` is `ready`, `invalid` or `unavailable`.
- **Event flow** - none.
- **State flow** - none.
- **Layer responsibilities** - bridges: the type and the order.
  connectors screen: the dot, the tone and the note.
  catalogs: the three labels.
- **Source-of-truth files** - [`code://src/bridges/connectors.ts`](../../../../src/bridges/connectors.ts)

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - The connector state ready is read and drawn](task-01-the-connector-state-ready-is-drawn.md) | todo | - |

## Risks and tradeoffs

- A host from before ahpd's plugin 62 sends `open`, and this ahpw shows it as the raw word.

## Resume state

- **Done so far:** nothing.
- **Next action:** [task-01-the-connector-state-ready-is-drawn.md](task-01-the-connector-state-ready-is-drawn.md), with ahpd's plugin 62.
- **Open questions:** none.
- **Watch out for:** `connectors.actions.open` is the verb "Open connector", and stays.

## Final verification checklist

- [ ] A working connector shows "Pronto" against an ahpd with plugin 62.
- [ ] `plans/index.md` updated.
