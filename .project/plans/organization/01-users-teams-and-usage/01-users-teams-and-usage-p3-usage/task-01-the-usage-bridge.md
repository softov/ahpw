---
title: The usage bridge
status: done
depends: []
layer: "src/bridges"
refs:
  - "[code://src/bridges/served.ts](../../../../../src/bridges/served.ts) - `trackServed` and `useServingHosts`"
  - file:///github/ahpd/packages/sdk/src/usage.ts - the commands and `usage://` answers
  - file:///github/ahpapp/src/usage.ts - the fallback to `usage://`
---

## Objective

One module asks a host for its usage: the pools, a pool's periods, a range, its records, and the groups, by the command where the host offers it, else by reading `usage://`.
A host serves usage when it offers `x-ahpd/usage/pools` or the `usage` provider.

## Files

- `CREATE: src/bridges/usage.ts` - the calls and the totals' words.
- `CREATE: src/bridges/usage.test.ts`.
- `UPDATE: src/bridges/served.ts` - `trackServed` and `useServingHosts` take a test, `(offers: Offers) => boolean`, as well as a channel scheme.

## Steps

1. `export function servesUsage(offers: Offers): boolean`.
2. `usagePools(host, offers): Promise<UsagePool[]>`, `usagePeriods(host, offers, pool): Promise<UsagePeriods>`, `usageRange(host, offers, pool, from, until): Promise<UsageTotal>`, `usageRecords(host, offers, pool, from, until): Promise<UsageEntry[]>`, `usageGroups(host, offers, by: ('user' | 'team' | 'project')[], from, until): Promise<UsageNamedGroup[]>`.
3. Each sends `x-ahpd/usage/<name>` when `offers.methods` has it, else reads `usage://`, `usage://<pool>`, `usage://<pool>/range?from=&until=`, `usage://<pool>/records` or `usage://groups?by=`.
4. `export function totalWords(total: UsageTotal): { cost?: string; tokens?: string; calls?: string; hours?: string }` - the cost in the person's locale, tokens and calls counted, computer hours.
5. Types come from `@ahpd/sdk` as `import type`.

## Validation

- `usage.test.ts`: `servesUsage` on a method and on a provider; `totalWords` with and without a cost.
- `pnpm test` and `pnpm typecheck` pass.

## Resume
