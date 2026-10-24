---
title: An agents bridge
status: implemented
depends: []
layer: "bridges"
refs:
  - "[code://src/bridges/connectors.ts](../../../../src/bridges/connectors.ts) - the bridge to copy"
  - file:///github/ahpd/packages/sdk/src/agents/channel.ts - the rows and the three commands
---

## Objective

ahpw reads `x-ahpd-agents` and `x-ahpd-agent-kinds`, and calls `put`, `remove` and `check` on an agent.

## Files

- `CREATE: src/bridges/agents.ts` - the channel names, `AgentRow`, `AgentKindRow`, the reducers, `servesAgents`, `servesAgentKinds`, `putAgent`, `removeAgent`, `checkAgent`.
- `CREATE: src/bridges/agents.test.ts` - the tests.

## Steps

1. Copy the shape of `src/bridges/connectors.ts`.
2. Define `AgentRow` as `id`, `kind`, `owner`, `name`, `description?`, `icon?`, `model?`, `config`, `state` and `health?`.
3. Define `AgentKindRow` as `name`, `title`, `description`, `schema`, `plugin`, `icons?`, `templates?`, `hostOnly?` and `keyVariables?`.
4. Make the reducers with `recordsReducer`, and the two `serves` tests from the offers.
5. Make `putAgent`, `removeAgent` and `checkAgent` over `x-ahpd/agents/put`, `remove` and `check`.
6. Check each answer, as `putConnector` does.

## Validation

- `src/bridges/agents.test.ts` tests the reducers, the offer tests, and a put answer without a row.
- `npx tsc -b` and `npx vitest run` pass.

## Resume

Implemented 2026-10-24. The bridge and its 7 tests pass. It waits for review.
