---
title: A custom agent picker in both composers
domain: composer
status: active
priority: medium
created: 2026-10-28
revalidated: 2026-10-28
requires:
  - plans/composer/20261028-0951-the-line-above-the-new-session-box/plan.md
refs:
  - "[code://src/resources/sessions/Composer.tsx#L63-L70](../../../../src/resources/sessions/Composer.tsx#L63-L70) - `messageOf`, the message both composers send"
  - "[code://src/resources/sessions/New.tsx#L464-L465](../../../../src/resources/sessions/New.tsx#L464-L465) - the new session box's first message"
  - "[code://src/resources/sessions/Composer.tsx#L292-L298](../../../../src/resources/sessions/Composer.tsx#L292-L298) - the session composer's send"
  - "[code://src/resources/agents/Overview.tsx#L96-L101](../../../../src/resources/agents/Overview.tsx#L96-L101) - the agent page's customizations"
  - "[code://src/resources/agents/index.ts#L80-L96](../../../../src/resources/agents/index.ts#L80-L96) - `ahp.openAgent`, which opens the agent page"
  - npm://@microsoft/agent-host-protocol@^1.0.0 - `AgentSelection` and `AgentCustomization` in `channels-session/state.ts`
  - https://code.visualstudio.com/docs/copilot/customization/custom-agents - VS Code's Agent menu and Configure Custom Agents
---

## Goal

Both composers get an Agent picker that lists the harness's custom agents.
Each message names the chosen agent.
The menu shows Agent, the default, then the custom agents, then Configure Custom Agents.

## Reconnaissance

### Searches performed

- `rg "agent:" src/resources/sessions` - no message names an agent.
- `rg "customizations" src` - only the agent page and the automations page read customizations.

### Runtime path

```
Agent pill -> menu: Agent | custom agents | Configure Custom Agents
  -> chosen uri -> messageOf(..., agent) -> chat/turnStarted { message.agent: { uri } }
  -> ahpd switches the agent for the turn
```

### Gaps

- `messageOf` takes no agent.
- No code collects the `AgentCustomization` children from a customization tree.
- `ahp.openAgent` cannot scroll to the customizations.

## Answers

| What | Source | Task |
| --- | --- | --- |
| The picker is in the new session box and in a running session's composer | Softov, 2026-10-28 | 02 |
| Each message can name a custom agent | Softov, 2026-10-28 | 02 |
| Configure Custom Agents opens the harness's agent page at its customizations | Softov, 2026-10-28 | 03 |
| The new session box lists from `AgentInfo.customizations`; a running session from `SessionState.customizations` | `(defaulted: a session's tree is its effective one; before a session there is only the agent's)` | 01 |
| Agent, the default, sends no `agent` | `(defaulted: the protocol says a message with no agent uses the provider's default)` | 02 |
| The pill hides when the harness has no custom agents | `(defaulted: a menu with one item chooses nothing)` | 02 |
| A disabled agent is not listed | `(defaulted: the host would not run it)` | 01 |
| The choice stays for the next message in the same composer | `(defaulted: VS Code keeps it)` | 02 |
| The custom agent list is `/agent`; the harness list moves to `/harness`, titled Harness | Softov, 2026-10-30: "/agent custom, /harness" | 02 |
| The pill opens the shared `/agent` list, not a `ContextMenu` | `(defaulted: the sibling pills open their slash command lists)` | 02 |
| An ask for the customizations also opens the Overview tab | `(defaulted: the customizations are on that tab)` | 03 |
| No ahpd or protocol change | ahpd reads `message.agent` in `packages/sdk/src/host/lifecycle.ts` | - |

## Proposed architecture

- **Data flow** - the customization tree in, a list of `{ uri, name, description }` out.
- **Event flow** - the pill opens the `/agent` list; a choice sets the composer's agent.
- **State flow** - each composer holds its chosen `uri` in React state.
- **Layer responsibilities** - `src/resources/sessions/custom-agents.ts`: the list. The pill: `src/resources/sessions/AgentPicker.tsx`. `src/resources/agents/`: open at the customizations.
- **Source-of-truth files** - [`code://src/resources/sessions/Composer.tsx`](../../../../src/resources/sessions/Composer.tsx)

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - the custom agents of a tree](task-01-the-custom-agents-of-a-tree.md) | implemented | - |
| [02 - the picker sends the agent](task-02-the-picker-sends-the-agent.md) | implemented | 01 |
| [03 - configure opens the customizations](task-03-configure-opens-the-customizations.md) | implemented | 02 |

## Risks and tradeoffs

- An agent pinned to a model runs on that model; the model pill does not show it.
- A host that ignores `agent` runs the default with no error.

## Resume state

- **Done so far:** tasks 01 to 03 are implemented and merged in PR #18. See [implemented.md](implemented.md).
- **Next action:** Softov does the send check in [composer-agent-send-check.md](../../../pending/composer-agent-send-check.md), then the plan closes.
- **Open questions:** none.
- **Watch out for:** the place of the pill comes from the mockup of plan `the-line-above-the-new-session-box`.

## Final verification checklist

- [x] On the test ahpd, the menu lists the Claude Code custom agents in both composers.
- [ ] A message with that agent chosen carries `agent.uri`, and the reply comes from it.
- [x] Configure Custom Agents opens the agent page at its customizations.
- [x] Checked at 1280 and 760 wide, in both themes; `pnpm typecheck` and `pnpm test` pass.
