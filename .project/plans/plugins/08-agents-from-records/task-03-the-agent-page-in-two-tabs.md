---
title: The agent page in two tabs
status: todo
depends: [task-02-one-merged-agents-list.md]
layer: "resources/agents"
refs:
  - "[code://src/resources/agents/Page.tsx](../../../../src/resources/agents/Page.tsx) - the page today, which becomes Overview"
  - "[code://src/resources/connectors/ConnectorPage.tsx](../../../../src/resources/connectors/ConnectorPage.tsx) - the head and the tabs to copy"
  - "[code://src/resources/connectors/ConnectorForm.tsx](../../../../src/resources/connectors/ConnectorForm.tsx) - the form to copy"
---

## Objective

An agent with a record opens on Overview and Settings tabs, and Settings edits, checks and removes the record.

## Files

- `UPDATE: src/resources/agents/Page.tsx` - a `PageTitle` head with the icon and a state badge, over the tabs.
- `CREATE: src/resources/agents/Overview.tsx` - the page body of today, plus kind, owner, plugin and state.
- `CREATE: src/resources/agents/AgentForm.tsx` - name, description, model, and the kind's schema below them.
- `UPDATE: src/resources/agents/index.ts` - `ahp.openAgent` opens a record that is not in the root list.
- `UPDATE: src/i18n/` - the page and form strings in en, es and pt.

## Steps

1. Find the agent in the root list and the record on the channel by the same id.
2. Draw the head with `PageTitle`, the record's icon and a state badge with the connector tones.
3. Draw Overview from the root `AgentInfo`, and the record's kind, owner, plugin and state when it has one.
4. Show a standby agent's Overview without models, and an `Alert` with its reason.
5. Draw Settings with `AgentForm`, the kind and id fixed.
6. Keep a secret field empty, and send `""` to keep the stored one.
7. Add Check, which shows the health, and Remove, after a confirm.
8. Show a standalone agent with no tabs and no Settings.

## Validation

- A test covers the form's put values with a kept secret.
- `npx tsc -b` and `npx vitest run` pass.

## Resume

