---
title: Agents from records, with Add agent and a Settings tab - implemented
date: 2026-10-30
refs:
  - git://23b26f4
  - "[code://src/bridges/agents.ts](../../../../src/bridges/agents.ts)"
  - "[code://src/resources/agents/merge.ts](../../../../src/resources/agents/merge.ts)"
  - "[code://src/resources/agents/Page.tsx](../../../../src/resources/agents/Page.tsx)"
  - "[code://src/resources/agents/AgentForm.tsx](../../../../src/resources/agents/AgentForm.tsx)"
  - "[code://src/resources/agents/EnginePicker.tsx](../../../../src/resources/agents/EnginePicker.tsx)"
---

The agents explorer shows one list that merges the root list's agents with the records on `x-ahpd-agents`.
Each row draws the agent's icon and says its status: standalone, configured or standby.
A `+` adds an agent from an engine on `x-ahpd-engines`, and an agent with a record has Overview and Settings tabs.

## What was built

- [`code://src/bridges/agents.ts`](../../../../src/bridges/agents.ts) - the agents and engines channels, their row types, `servesAgents`, `servesEngines`, `putAgent`, `removeAgent` and `checkAgent`.
- [`code://src/resources/agents/merge.ts`](../../../../src/resources/agents/merge.ts) - `mergeAgents`, which gives each agent its status.
- [`code://src/resources/agents/Explorer.tsx`](../../../../src/resources/agents/Explorer.tsx) - the merged list, with the icon and a status line.
- [`code://src/resources/agents/Page.tsx`](../../../../src/resources/agents/Page.tsx) - the page with its head and tabs.
- [`code://src/resources/agents/Overview.tsx`](../../../../src/resources/agents/Overview.tsx) - the Overview tab, with the record's engine.
- [`code://src/resources/agents/AgentForm.tsx`](../../../../src/resources/agents/AgentForm.tsx) - one form for a new and a made agent, with the last check and Check on Settings.
- [`code://src/resources/agents/form.ts`](../../../../src/resources/agents/form.ts) - the form's values, a template fill and a kept secret.
- [`code://src/resources/agents/EnginePicker.tsx`](../../../../src/resources/agents/EnginePicker.tsx) - the engine picker, on the shared `AdapterPicker`.
- [`code://src/resources/agents/NewAgentPage.tsx`](../../../../src/resources/agents/NewAgentPage.tsx) - the page that `+` opens.
- [`code://src/resources/agents/actions.ts`](../../../../src/resources/agents/actions.ts) - Remove.
- [`code://src/resources/agents/state.ts`](../../../../src/resources/agents/state.ts) - the tab keys and `ENGINES_SERVED`.

## Verified

- `npx tsc -b`, `npx vitest run` and `npm run build` passed.
- `agents.test.ts`, `merge.test.ts` and `form.test.ts` test the bridge, the three statuses and the form values.
- By hand, on a test ahpd with host 123, in light and dark: the list showed `bot-chat`, `claude` and a standby record.
- By hand, on the same host: a `cofold` record was made from its template, checked, and removed.
- No record shows a name edit on Settings, or the engines checks of task 05 by hand.

## Departures from the plan

- The engine picker uses the connector `AdapterPicker`, which takes its own words now, and not a copy.
- A row with no icon draws the resource emoji through a new `Row.emoji` in [`code://src/shell/explorer/ExplorerList.tsx`](../../../../src/shell/explorer/ExplorerList.tsx).
- `ownerChoices` in [`code://src/resources/connectors/form.ts`](../../../../src/resources/connectors/form.ts) takes the subject whose grants it reads.

## Left for later

- None.
