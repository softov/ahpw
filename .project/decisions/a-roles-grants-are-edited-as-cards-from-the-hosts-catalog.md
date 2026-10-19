---
title: A role's grants are edited as one card per subject, drawn from the grant catalog the host advertises, with the text kept as a second view
status: accepted
date: 2026-10-19
refs:
  - file:///github/ahpd/packages/sdk/src/users.ts - `SUBJECTS`, `OPERATIONS`, `operationsOf`, `groupOf`: what a grant may name
  - file:///github/ahpd/packages/sdk/src/host/root.ts - `advertisedGrants`, the root state's `_meta["ahpd.grants"]`
  - "[code://src/resources/users/RolePage.tsx](../../src/resources/users/RolePage.tsx) - the role page, a textarea of grants today"
---

## Context

A role's grants were a textarea, one `<subject>:<operation>` a line.
Softov asked on 2026-10-19 to "put the permissions on a ui with control", showing a card per subject with its read and write operations as chips in three states (granted, covered by a group, not granted) and a read | write | all switch.
The host advertises every subject a grant may name with its title, description, operations and groups, so a client draws the editor from the host.
Asked "Which subjects does a role's page show as cards?", Softov answered "The role's own, plus Add".
Asked what clicking an operation only a group covers does, Softov answered "Splits the group".
Asked whether to keep the plain text as a second view, Softov answered "Controls + text view".
Asked where the three-state chip lives, since neither scena nor web-next draws one, Softov answered "scena: a new Chip".

## Decision

A role's page shows one card per subject its grants name, in the catalog's order, and an *Add subject* menu of the rest.
A card shows the subject's title, how many of its operations the role reaches, its description, its read and write operations as chips, a read | write | all switch for its groups and `*`, and × to take the subject out.
A chip is granted when the role names the operation, covered when a group or a wildcard reaches it, and not granted otherwise; clicking a granted chip takes it out, an ungranted one adds it, and a covered one splits the group that covers it into its other operations.
An operation only a wildcard subject covers, `*:read`, cannot be split for one subject, since a grant only adds; its chip says what covers it.
A view switch offers the controls and the text, both editing the same grants.
The chip is scena's `Chip`.

## Consequences

A subject the host adds is offered without a change here.
A grant naming a subject the host does not advertise, a plugin not loaded, still shows, as a card with the operations it names.

## Options

- Every subject, folded: lost, Softov chose the role's own plus Add.
- A covered chip that does nothing: lost, Softov chose to split the group.
- Controls only: lost, Softov kept the text.
- The chip in ahpw only: lost, Softov chose scena.
