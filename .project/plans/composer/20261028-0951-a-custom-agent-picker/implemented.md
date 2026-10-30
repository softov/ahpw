---
title: A custom agent picker in both composers - implemented
date: 2026-10-30
refs:
  - git://e913bae
  - git://7e4edfe
  - "[code://src/resources/sessions/custom-agents.ts#L16](../../../../src/resources/sessions/custom-agents.ts#L16)"
  - "[code://src/resources/sessions/Composer.tsx#L67](../../../../src/resources/sessions/Composer.tsx#L67)"
---

Both composers have an Agent pill that opens the `/agent` list: Agent, the default, then the harness's enabled custom agents, then Configure Custom Agents. A message sent after a choice names the agent in `agent.uri`. The harness list moved to `/harness`. Configure Custom Agents opens the harness's agent page at its customizations.

## What was built

- [`code://src/resources/sessions/custom-agents.ts`](../../../../src/resources/sessions/custom-agents.ts) - `customAgents(tree)`: the enabled agent children of a customization tree, in order, with no repeated `uri`.
- [`code://src/resources/sessions/AgentPicker.tsx`](../../../../src/resources/sessions/AgentPicker.tsx) - the pill, hidden when the harness has no custom agents.
- [`code://src/resources/sessions/composer-commands.ts`](../../../../src/resources/sessions/composer-commands.ts) - the `/agent` list.
- [`code://src/resources/sessions/Composer.tsx`](../../../../src/resources/sessions/Composer.tsx) - `messageOf` takes an optional agent `uri`; the session composer lists from `SessionState.customizations`.
- [`code://src/resources/sessions/New.tsx`](../../../../src/resources/sessions/New.tsx) - the new session box lists from `AgentInfo.customizations`.
- [`code://src/resources/sessions/Page.tsx`](../../../../src/resources/sessions/Page.tsx) - passes `SessionState.customizations` to the composer.
- [`code://src/resources/agents/state.ts`](../../../../src/resources/agents/state.ts) - `AGENT_SECTION`, the ask to show a part of the agent page.
- [`code://src/resources/agents/index.ts`](../../../../src/resources/agents/index.ts), [`code://src/resources/agents/Page.tsx`](../../../../src/resources/agents/Page.tsx) and [`code://src/resources/agents/Overview.tsx`](../../../../src/resources/agents/Overview.tsx) - `ahp.openAgent` takes `section`; the page opens the Overview tab and scrolls to the customizations.
- [`code://src/i18n/en.json`](../../../../src/i18n/en.json), [`code://src/i18n/es.json`](../../../../src/i18n/es.json) and [`code://src/i18n/pt.json`](../../../../src/i18n/pt.json) - Agent, Configure Custom Agents and the pill's hint.

## Verified

- [`code://src/resources/sessions/custom-agents.test.ts`](../../../../src/resources/sessions/custom-agents.test.ts) - an empty tree, agents in two plugins, a disabled agent, a skill child, a repeated `uri`.
- [`code://src/resources/sessions/message.test.ts`](../../../../src/resources/sessions/message.test.ts) - `messageOf` with an agent, and without one.
- `pnpm typecheck`, `pnpm test` (613 passed) and `pnpm build` passed after the rebase, and CI passed on PR #18.
- By hand on the test ahpd, the menu lists the Claude Code custom agents in both composers. Configure Custom Agents opens the page at the customizations.
- Not verified: a message with an agent chosen carries `agent.uri`, and the reply comes from that agent. That check waits in [composer-agent-send-check.md](../../../pending/composer-agent-send-check.md).

## Departures from the plan

- None.

## Left for later

- Nothing.
