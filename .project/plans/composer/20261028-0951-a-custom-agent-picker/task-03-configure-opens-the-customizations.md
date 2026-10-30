---
title: Configure Custom Agents opens the agent page at its customizations
status: implemented
depends: [task-02-the-picker-sends-the-agent.md]
layer: "agents"
refs:
  - "[code://src/resources/agents/index.ts#L80-L96](../../../../src/resources/agents/index.ts#L80-L96) - `ahp.openAgent`"
  - "[code://src/resources/agents/Overview.tsx#L96-L101](../../../../src/resources/agents/Overview.tsx#L96-L101) - the customizations heading"
---

## Objective

`ahp.openAgent` takes an optional `section: 'customizations'`, and the page scrolls to that heading.

## Files

- `UPDATE: src/resources/agents/index.ts:80-96` - pass `section` to the page.
- `UPDATE: src/resources/agents/state.ts` - `AGENT_SECTION`, the ask to show a part of the page.
- `UPDATE: src/resources/agents/Page.tsx` - an ask opens the Overview tab.
- `UPDATE: src/resources/agents/Overview.tsx:96-101` - scroll to the customizations heading on an ask.
- `UPDATE: src/resources/sessions/composer-commands.ts` - Configure Custom Agents runs `ahp.openAgent` with `section`.

## Steps

1. Add `section` to the command's arguments and to the page's resource.
2. Scroll to the customizations heading after the page draws.
3. Scroll again when the page is already open and the command runs.
4. Run the command from Configure Custom Agents with the harness's `host` and `provider`.

## Validation

- `pnpm typecheck` and `pnpm test` pass.
- By hand: Configure Custom Agents opens the page at the customizations, open or not.

## Resume
