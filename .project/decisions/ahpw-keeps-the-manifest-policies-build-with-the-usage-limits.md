---
title: ahpw keeps the policies build drawn from the host's manifest, with a person's limits in Usage from the other build
status: accepted
date: 2026-10-19
refs:
  - "[code://src/bridges/policies.ts](../../src/bridges/policies.ts) - the one policies bridge, with `ownLimits` and `limitWords` added"
  - "[code://src/resources/policies/PolicyPage.tsx](../../src/resources/policies/PolicyPage.tsx) - the page drawn from the manifest"
  - "[code://src/resources/usage/Limits.tsx](../../src/resources/usage/Limits.tsx) - a person's limits at the top of Usage"
  - git://880f062 - the other build, organization/02-policies-and-their-limits
---

## Context

Two builds of policies in ahpw were made apart: organization/02-budget-policies, whose page draws its form from the host's `policy:` manifest, and organization/02-policies-and-their-limits (`880f062`), whose page has its own form and which also lists a person's limits at the top of Usage.
Asked which to keep, Softov first chose the second, then said "sorry. your policies form was better."
Asked what to keep of the second, Softov answered "Mine, plus origin's Usage limits".

## Decision

The policies bridge, explorer and page are organization/02-budget-policies'.
A person's limits in Usage stay as organization/02-policies-and-their-limits built them, reading `usage://limits` through `ownLimits` and drawing each figure with `limitWords`, both now in the one bridge.
organization/02-policies-and-their-limits is dropped.

## Consequences

Its own form (`src/resources/policies/form.ts`) goes.
A limit's amount is worded twice: `limitWords` for Usage and `amountWord` in `src/resources/policies/words.ts` for the page.

## Options

- The second build whole: lost, Softov found the manifest form better.
- The first build alone: lost, the Usage limits are kept.
