---
title: Agents from records, with Add agent and a Settings tab
domain: plugins
status: active
priority: high
created: 2026-10-24
revalidated: 2026-10-24
requires:
  - plans/plugins/04-connectors/plan.md
refs:
  - "[code://src/resources/agents/Explorer.tsx](../../../../src/resources/agents/Explorer.tsx) - the explorer today, from the root list only"
  - "[code://src/resources/agents/Page.tsx](../../../../src/resources/agents/Page.tsx) - the agent page today, which becomes the Overview tab"
  - "[code://src/resources/agents/index.ts](../../../../src/resources/agents/index.ts) - the agents commands and components"
  - "[code://src/bridges/connectors.ts](../../../../src/bridges/connectors.ts) - the bridge an agents bridge copies"
  - "[code://src/resources/connectors/index.ts](../../../../src/resources/connectors/index.ts) - `ahp.newConnector`, the `+` action and the page commands to copy"
  - "[code://src/resources/connectors/ConnectorPage.tsx](../../../../src/resources/connectors/ConnectorPage.tsx) - a head with a state badge over Overview and Settings"
  - "[code://src/resources/connectors/ConnectorForm.tsx](../../../../src/resources/connectors/ConnectorForm.tsx) - one form for new and made, picker on top, owner choices, the schema below"
  - "[code://src/resources/connectors/AdapterPicker.tsx](../../../../src/resources/connectors/AdapterPicker.tsx) - the picker grouped by plugin, with search"
  - "[code://src/shell/explorer/ExplorerList.tsx#L14-L34](../../../../src/shell/explorer/ExplorerList.tsx#L14-L34) - `Row.icons`, a host icon with the dot on its corner"
  - file:///github/ahpd/packages/sdk/src/agents/channel.ts - `x-ahpd-agents`, its rows, `put`, `remove`, `check`, grants and owners
  - file:///github/ahpd/packages/sdk/src/types/agents.ts - `AgentRecord`, `AgentKind`, `AgentTemplate`, `AgentHealth`
  - file:///github/ahpd/.project/plans/host/123-agent-kinds-on-their-own-channel/plan.md - `x-ahpd-agent-kinds`, which Add agent reads
  - file:///github/ahp-review/briefs/ahpw-agents.md - the brief this plan answers
  - file:///github/ahpw/.scratch/mockups/agents.html - the mockup Softov approved
---

## Goal

The agents explorer shows one list that merges the root list's agents with the records on `x-ahpd-agents`.
Each row shows the agent's icon and a status: standalone, configured or standby.
An `+` button adds an agent from a kind, and an agent page has Overview and Settings tabs, like a connector page.

## Reconnaissance

The files read and the patterns to reuse are the `refs` above, each with its note.

### Searches performed

- `rg -n "x-ahpd-agents" src` - ahpw reads nothing from the agents channel.
- On a test daemon, `bot-chat` is in the root list only, and `claude` is in both.
- A record of kind `pi` with no plugin is on the channel only, as `unavailable`.
- `rg -n "templates|icons:" packages/agent-*/src` in ahpd - no kind registers templates or icons yet.

### Runtime path

```
root list (AgentInfo[]) + x-ahpd-agents:// rows -> merge by provider = id -> explorer rows with icon and status
+ -> NewAgentPage -> kind picker over x-ahpd-agent-kinds:// -> AgentForm -> x-ahpd/agents/put -> row on the channel
AgentPage -> Overview (root AgentInfo, record facts) | Settings (AgentForm, Check, Remove) -> x-ahpd/agents/check | remove
```

### Gaps

- `x-ahpd-agent-kinds` is not served until ahpd host 123 is merged.
- `AgentInfo` has no icon, so a standalone agent shows the default agent icon.

## Answers

| What | Source | Task |
| --- | --- | --- |
| One list merges the root list and the agents channel, by `provider` = record `id` | Softov, 2026-10-24: "merge the agents from host root config with the agents from the agents channel" | 02 |
| standalone: in the root list only; configured: in both; standby: on the channel only | Softov, 2026-10-24 | 02 |
| A record of another owner, read with `agent:all`, shows as configured, with the owner in its line | Softov, 2026-10-24: "Owner line" | 02 |
| A row draws the record's icon, and the default agent icon when it has none | Softov, 2026-10-24: "use icon to show the icon" | 02 |
| A row's line says its status in words, and a standby row says why from `state` | Softov, 2026-10-24: "a line to say" | 02 |
| An agent page has `Overview` and `Settings` tabs, as a connector page | Softov, 2026-10-24, on the brief | 03 |
| A standalone agent has no record, so its page has no tabs and no Settings | (defaulted: nothing to edit) | 03 |
| A `+` on the explorer opens a new agent page, as `ahp.newConnector` does | Softov, 2026-10-24: "a add option initially. to add a agent." | 04 |
| The new agent form picks a kind first, grouped by plugin, then a template or a blank record | Softov, 2026-10-24: approved mockup | 04 |
| The owner choices are me, my teams and the host, as the connector form | (defaulted: the connector form) | 04 |
| A made record's kind and id are fixed on Settings | (defaulted: the connector form) | 03 |
| A secret field is empty on the form, and an empty value keeps the stored secret | (defaulted: the connector form; ahpd keeps it the same way) | 03 |
| The icon is drawn, not picked; the form has no icon picker yet | (defaulted: Softov asked to show the icon; `icon` is an `Icon` URL, not an emoji) | 03 |
| The row types are written in ahpw, as the connector rows are | (defaulted: `@ahpd/sdk` 0.13 has no agent record types) | 01 |
| The new UI strings go in en, es and pt | (defaulted: every ahpw string is in the three) | 02-04 |

## Proposed architecture

- **Data flow** - `src/bridges/agents.ts` holds both channels, the row types, `putAgent`, `removeAgent` and `checkAgent`.
- **Event flow** - the channels send added, changed and removed; the root list sends `root/agentsChanged`.
- **State flow** - the open agent stays `ACTIVE_AGENT`; the page tab is kept as the connector tab is.
- **Layer responsibilities** - bridge: wire and types. `src/resources/agents/`: merge, explorer, page, form, picker.
- **Source-of-truth files** - ahpd's `agents/channel.ts` and `types/agents.ts`.

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - An agents bridge](task-01-an-agents-bridge.md) | implemented | - |
| [02 - One merged agents list](task-02-one-merged-agents-list.md) | implemented | 01 |
| [03 - The agent page in two tabs](task-03-the-agent-page-in-two-tabs.md) | implemented | 02 |
| [04 - Add agent](task-04-add-agent.md) | implemented | 03 |

## Risks and tradeoffs

- Task 04 needs ahpd host 123. Until a host serves `x-ahpd-agent-kinds`, `+` is hidden, as `ahp.newConnector` is hidden without connectors.
- A host before ahpd host 122 serves no `x-ahpd-agents`. The explorer then lists the root list alone, every row standalone.

## Resume state

- **Done so far:** tasks 01 to 04 are implemented and wait for review.
- **Next action:** review the four tasks, then close the plan.
- **Open questions:** none.
- **Watch out for:** the root list is filtered per caller, and the channel with `agent:all` is not. Do not call a row standby only because the root list lacks it; see the owner answer.

## Final verification checklist

- [x] `npx tsc -b`, `npx vitest run` and `npm run build` pass.
- [x] By hand, on a test ahpd with host 123, in light and dark: the list shows `bot-chat`, `claude` and a standby record.
- [ ] By hand: add a `cofold` record, edit its name, check it, and remove it.
- [x] `plans/index.md` updated.
