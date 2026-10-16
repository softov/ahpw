---
title: Computers - implemented
date: 2026-10-16
refs:
  - git://main
  - "[code://src/resources/computers/machines.ts](../../../../../src/resources/computers/machines.ts)"
  - "[code://src/bridges/served.ts](../../../../../src/bridges/served.ts)"
  - "[code://src/shell/explorer/choice.ts](../../../../../src/shell/explorer/choice.ts)"
---

A host's computers list in the side bar, open in a page, and are made from a form drawn from the host's manifest.

## What was built

- [`code://src/resources/computers/`](../../../../../src/resources/computers/) - the list, the page, the form, and their tests.
- [`code://src/bridges/served.ts`](../../../../../src/bridges/served.ts) - which hosts serve a plugin channel.
- [`code://src/shell/explorer/choice.ts`](../../../../../src/shell/explorer/choice.ts) - a list's header choice, shared with automations.
- [`code://src/shell/view/Field.tsx`](../../../../../src/shell/view/Field.tsx) - the form field, moved out of the automation form.

## Verified

- The suite and `pnpm typecheck` pass.
- ahpd 27fbbc75 with an ssh box: the list, the page and the form, in a browser with every host.
- The create call reached the host, which refused it for want of Docker.

## Departures from the plan

- The page reads the channel's record rather than the `status` leaf; the record carries the same object.
- Machine actions show only where the record has docker's `State`, since ssh boxes are only listed.

## Left for later

- Start, Stop, Restart, Remove, Usage and a made computer need a machine with Docker to check by hand.
- ahpd could send `x-show-if` on `devcontainer`, so the form hides it while Source is Image.
- ahpd's router reports the default runtime's `capabilities` for every machine.
