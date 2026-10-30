---
title: The custom agents of a customization tree
status: implemented
depends: []
layer: "composer"
refs:
  - "[code://src/resources/agents/words.ts#L114](../../../../src/resources/agents/words.ts#L114) - `enabledOf`, reused for the enabled test"
---

## Objective

`customAgents(tree)` returns the enabled `AgentCustomization` children of a customization tree, in order.

## Files

- `CREATE: src/resources/sessions/custom-agents.ts` - `customAgents(tree)`: `{ uri, name, description }` for each enabled agent child.
- `CREATE: src/resources/sessions/custom-agents.test.ts` - cases for `customAgents`.

## Steps

1. Walk each customization's children.
2. Keep a child whose `type` is `CustomizationType.Agent` and that `enabledOf` accepts.
3. Return its `uri`, its name and its description.
4. Drop a second child with the same `uri`.

## Validation

- `custom-agents.test.ts`: an empty tree, agents in two plugins, a disabled agent, a skill child, a repeated `uri`.
- `pnpm typecheck` and `pnpm test` pass.

## Resume
