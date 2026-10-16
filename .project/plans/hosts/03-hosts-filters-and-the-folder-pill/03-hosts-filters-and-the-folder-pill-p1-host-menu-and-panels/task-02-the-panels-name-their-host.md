---
title: The session, automation and agent panels name their host
status: done
depends: []
layer: "src/resources"
refs:
  - "[code://src/resources/sessions/Details.tsx#L47-87](../../../../../src/resources/sessions/Details.tsx#L47-87) - where the Host fact goes, first"
  - "[code://src/resources/automations/Page.tsx#L44-67](../../../../../src/resources/automations/Page.tsx#L44-67) - `factsOf`"
  - "[code://src/resources/agents/Page.tsx#L32-44](../../../../../src/resources/agents/Page.tsx#L32-44) - the agent's facts"
---

## Objective

In multi, the session panel, the automation page and the agent page show a Host fact first, with its connection dot.
Mono shows no Host fact, since the window is one host.

## Files

- `UPDATE: src/resources/sessions/Details.tsx:47` - a Host row first, from `hostNameOf` and the host's state.
- `UPDATE: src/resources/automations/Page.tsx:44` - a Host fact first in `factsOf`.
- `UPDATE: src/resources/agents/Page.tsx:32` - a Host fact first in the agent's facts.
- `UPDATE: src/i18n` - `common/host` if no such word exists, in every locale.

## Steps

1. Add the Host row to the session panel in multi.
2. Add the Host fact to the automation and agent pages in multi.

## Validation

- `pnpm test` and `pnpm typecheck` pass.
- By hand: a session, an automation and an agent of the second host each name it.

## Resume

- Done 2026-10-16: `HostTag` in `src/shell/explorer/HostLines.tsx` draws a host's dot and name.
- In multi, the session panel, the automation page and the agent page show it first, as Host.
- Verified: the suite and `pnpm typecheck` pass; checked by hand in p4's run.
