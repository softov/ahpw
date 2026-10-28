---
title: The Agent picker sends the chosen agent with each message
status: todo
depends: [task-01-the-custom-agents-of-a-tree.md]
layer: "composer"
refs:
  - "[code://src/resources/sessions/pills.tsx](../../../../src/resources/sessions/pills.tsx) - `Pill`, the control the picker draws"
---

## Objective

Both composers draw an Agent pill; a message sent after a choice carries `agent: { uri }`.

## Files

- `CREATE: src/resources/sessions/AgentPicker.tsx` - the pill and its menu: Agent with a check, the custom agents, Configure Custom Agents.
- `UPDATE: src/resources/sessions/Composer.tsx:63-70` - `messageOf` takes an optional agent `uri`.
- `UPDATE: src/resources/sessions/Composer.tsx` - draw the picker from `SessionState.customizations` and pass the choice to `messageOf`.
- `UPDATE: src/resources/sessions/New.tsx` - draw the picker from `AgentInfo.customizations` and pass the choice to `messageOf`.
- `CREATE: src/resources/sessions/message.test.ts` - `messageOf` with and without an agent.
- `UPDATE: src/i18n/en.json` - Agent, Configure Custom Agents and the pill's hint; the same keys in `es.json` and `pt.json`.

## Steps

1. Add the optional agent `uri` to `messageOf`, and add `agent` only when it is set.
2. Draw the menu with a scena `ContextMenu`, with a check on the chosen row.
3. Show the description of each agent in its row.
4. Hide the pill when `customAgents` returns none.
5. Place the pill where the approved mockup puts it, in both composers.
6. Keep the choice in the composer's state after a send.

## Validation

- `message.test.ts`: `messageOf` with an agent, and without one.
- `pnpm typecheck` and `pnpm test` pass.
- By hand on the test ahpd: the frame of `chat/turnStarted` carries `agent.uri`.

## Resume
