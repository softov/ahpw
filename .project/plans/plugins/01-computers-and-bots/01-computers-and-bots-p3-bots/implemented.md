---
title: Bots - implemented
date: 2026-10-16
refs:
  - git://main
  - "[code://src/resources/bots/catalogue.ts](../../../../../src/resources/bots/catalogue.ts)"
  - "[code://src/resources/bots/Edit.tsx](../../../../../src/resources/bots/Edit.tsx)"
---

A host's bots list in the side bar, each drawn by bood, open in a page, and are made, edited and deleted from a form.

## What was built

- [`code://src/resources/bots/`](../../../../../src/resources/bots/) - the catalogue, the list, the page, the form, and their tests.
- [`code://src/shell/explorer/ExplorerList.tsx`](../../../../../src/shell/explorer/ExplorerList.tsx) - `Row.icon`, a figure in place of the dot.

## Verified

- The suite and `pnpm typecheck` pass.
- ahpd 27fbbc75, in a browser with every host: make, edit, Open chat, delete, and a new bot under a tombstoned slug.

## Departures from the plan

- The owner choice is the maker or this host; ahpd names no teams to the client.

## Left for later

- ahpd reads a blank description or instructions as absent, so an edit cannot clear either.
