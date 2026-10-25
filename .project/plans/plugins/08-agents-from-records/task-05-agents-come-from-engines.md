---
title: Agents come from engines
status: implemented
depends: [task-04-add-agent.md]
layer: "bridges, resources/agents, i18n"
refs:
  - "[code://src/bridges/agents.ts#L26-L27](../../../../src/bridges/agents.ts#L26-L27) - the scheme `x-ahpd-agent-kinds`"
  - "[code://src/bridges/agents.ts#L58-L70](../../../../src/bridges/agents.ts#L58-L70) - `AgentRow` and its `kind` field"
  - "[code://src/bridges/agents.ts#L118-L136](../../../../src/bridges/agents.ts#L118-L136) - `putAgent` sends `kind`"
  - "[code://src/resources/agents/state.ts#L4](../../../../src/resources/agents/state.ts#L4) - `AGENT_KINDS_SERVED`"
  - "file:///github/ahpd/.project/plans/host/123-agent-kinds-on-their-own-channel/task-03-agent-kinds-are-engines.md - the ahpd rename this task follows"
---

## Objective

ahpw reads agent engines from `x-ahpd-engines`, and says "engine" where it said "kind" for an agent.
The agent record field is `engine`, and `x-ahpd/agents/put` takes `engine`.
ahpw keeps no fallback to `x-ahpd-agent-kinds` or to `kind`, because no released ahpd serves them.

## Files

- `UPDATE: src/bridges/agents.ts` - `ENGINES` with the scheme `x-ahpd-engines`, `EngineRow`, `enginesReducer` and `servesEngines`; `AgentRow.engine`; `putAgent` sends `engine`.
- `UPDATE: src/bridges/agents.test.ts` - the new names and the scheme.
- `CREATE: src/resources/agents/EnginePicker.tsx` - the picker from `KindPicker.tsx`, with the new names.
- `DELETE: src/resources/agents/KindPicker.tsx` - `EnginePicker.tsx` replaces it.
- `UPDATE: src/resources/agents/state.ts:4` - `ENGINES_SERVED` at `$/ahp/agents/enginesServed`.
- `UPDATE: src/resources/agents/index.ts` - read `servesEngines` and `ENGINES_SERVED`.
- `UPDATE: src/resources/agents/AgentForm.tsx` - read `ENGINES`, and write `engine` on a new record.
- `UPDATE: src/resources/agents/NewAgentPage.tsx` - use `EnginePicker`.
- `UPDATE: src/resources/agents/Page.tsx` - read `ENGINES` and `EngineRow`.
- `UPDATE: src/resources/agents/Explorer.tsx` - read `ENGINES` and `EngineRow`.
- `UPDATE: src/resources/agents/Overview.tsx` - show the record's engine.
- `UPDATE: src/resources/agents/form.ts` - the new names.
- `UPDATE: src/resources/agents/form.test.ts` - the new names.
- `UPDATE: src/i18n/en.json` - the agent strings say "engine" where they say "kind".
- `UPDATE: src/i18n/es.json` - the same strings, with "motor".
- `UPDATE: src/i18n/pt.json` - the same strings, with "motor".

## Steps

1. Rename the scheme in the bridge to `x-ahpd-engines`.
2. Rename the agent kind names in the Files list to engine names.
3. Read `engine` on each agent row, and send `engine` in `putAgent`.
4. Change "kind" to "engine" in each agent string, in en, es and pt.
5. Keep "kind" in strings that are not about agents, such as the customization kinds.
6. Keep the string keys that other code reads, and change only those under the agents section.
7. Run `npx tsc -b`, `npx vitest run` and `npm run build`.

## Validation

- `git grep -nE "AgentKind|agentKind|AGENT_KINDS|agent-kinds|KindPicker" -- src` prints nothing.
- `npx tsc -b`, `npx vitest run` and `npm run build` pass.
- By hand, on a test ahpd with host 123 task 03: the agents page lists each engine with its icon.
- Check that page in light and dark.
- By hand: add a `cofold` agent, and check that its record on `x-ahpd-agents` has `engine` and no `kind`.
