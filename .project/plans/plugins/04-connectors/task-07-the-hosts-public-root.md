---
title: A connector's URL starts with the root the host says it is reached at
status: blocked
depends: [task-05-kinds-for-a-maker.md]
layer: "ahpw connectors"
refs:
  - "[code://src/bridges/data.ts](../../../../src/bridges/data.ts) - `httpRoot`, which works the root out from how the page was served"
  - file:///github/ahpd/docs/plugins/WEBHOOKS.md - "put the daemon's HTTP root, or the routes listener's, before it"
---

## Objective

A connector's URL starts with the root a sender reaches the host at, the routes listener's included.

## Blocked on

ahpd advertises no HTTP root, so a host with `routes.port` set, or a public name behind a proxy, shows the wrong URL.
Softov chose on 2026-10-23 that ahpw works the root out now, and that ahpd is asked to advertise it.
Read the shape ahpd ships, and correct these steps before starting.

## Files

- `UPDATE: src/bridges/offers.ts` - the advertised root.
- `UPDATE: src/bridges/data.ts` - `httpRoot` reads the advertised root first.

## Steps

1. Read what ahpd shipped, and correct these steps to it.
2. Keep the advertised root in `Offers`.
3. Make `httpRoot` answer it before working one out.

## Validation

- `npx tsc -b` and `npx vitest run` pass.
- By hand: a host with a routes listener shows that listener's URL.

## Resume

