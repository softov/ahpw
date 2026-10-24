---
title: Add agent
status: implemented
depends: [task-03-the-agent-page-in-two-tabs.md]
layer: "resources/agents"
refs:
  - "[code://src/resources/connectors/AdapterPicker.tsx](../../../../src/resources/connectors/AdapterPicker.tsx) - the picker to copy"
  - "[code://src/resources/connectors/NewConnectorPage.tsx](../../../../src/resources/connectors/NewConnectorPage.tsx) - the new page to copy"
  - "[code://src/resources/connectors/index.ts](../../../../src/resources/connectors/index.ts) - `ahp.newConnector` and the `+` action"
---

## Objective

A `+` on the agents explorer opens a page that makes a record from a kind, or from one of its templates.

## Files

- `CREATE: src/resources/agents/KindPicker.tsx` - kinds grouped by plugin, with search, and the templates under the picked kind.
- `CREATE: src/resources/agents/NewAgentPage.tsx` - the picker over `AgentForm`.
- `UPDATE: src/resources/agents/AgentForm.tsx` - a new record: kind, template, id from the name, and owner choices.
- `UPDATE: src/resources/agents/index.ts` - `ahp.newAgent`, the `+` action, and the `NewAgentPage` component.
- `UPDATE: src/i18n/` - the new page strings in en, es and pt.

## Steps

1. Register `ahp.newAgent` like `ahp.newConnector`, for a shown host that serves the kinds.
2. Add the `+` action to the explorer's header.
3. Copy `AdapterPicker` to `KindPicker` over `AgentKindRow`.
4. Show the picked kind's templates, plus a blank choice.
5. Fill name, description, icon, model and config from a picked template.
6. Make the id from the name until a person types one.
7. Offer the owners me, my teams and the host, as the connector form does.
8. Put the record, then open its page.

## Validation

- A test covers a record filled from a template and the id from the name.
- `npx tsc -b`, `npx vitest run` and `npm run build` pass.
- By hand on a daemon with ahpd host 123: add a `cofold` record and open it from the list.

## Resume

Implemented 2026-10-24. `KindPicker` uses the connector `AdapterPicker`, which is now generic and takes its own words, instead of a copy. The `+` shows while a host lists its agent kinds (`AGENT_KINDS_SERVED`). Checked by hand on a test ahpd with host 123: a cofold record was made from its template, checked, and removed. It waits for review.
