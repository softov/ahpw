---
title: Budget policies - an activity item, an explorer and a page per row - deferred
date: 2026-10-19
---

Each waits on another package, or was not checked by hand.

| What | Why it waits | Where it goes |
| --- | --- | --- |
| The form offers every match type and measure whatever the kind | `SchemaForm` reads `properties` and not the manifest's `allOf` `if`/`then`; the host refuses what the kind does not take, in its own words | scena, unplanned |
| `LimitFigure` and `PolicyLimits` are copied in `bridges/policies.ts` | `@ahpd/sdk` 0.12.0 does not export them; main does | swap at the next `@ahpd/sdk` release |
| A row's `pool` or `cap` cannot be taken away | ahpd refuses `null` for both (`checkPolicy` in `policies.ts`), so a merge keeps the old value | ahpd, unplanned |
| A person's own limits, `usage://limits` | the page reads one row's limits, for a reader who may read every row | organization, unplanned |
| The read-only page, for a host or a person without `policy:put` | not checked by hand; the isolated host signs in an admin | the next check against a host with a reader role |
