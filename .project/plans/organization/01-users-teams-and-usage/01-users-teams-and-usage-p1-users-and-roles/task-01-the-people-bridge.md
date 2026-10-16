---
title: The people bridge
status: done
depends: []
layer: "src/bridges"
refs:
  - "[code://src/resources/computers/machines.ts](../../../../../src/resources/computers/machines.ts) - `computersReducer` and the method-or-resource calls"
  - "[code://src/bridges/offers.ts](../../../../../src/bridges/offers.ts) - `allows(provider, 'write')`"
  - file:///github/ahpd/packages/sdk/src/people.ts - `peopleChannels` and the `x-ahpd/<domain>/put` and `/remove` commands
---

## Objective

One module says, for each of the four people domains, its scheme, channel and commands.
It folds the domain's channel, and writes and removes a record: the command where the host offers it, else the resource write.

## Files

- `CREATE: src/bridges/people.ts` - the four domains, the reducer and the calls.
- `CREATE: src/bridges/people.test.ts` - the reducer and the body a write sends.
- `UPDATE: src/bridges/offers.ts` - `Offers.principal?: string`, read by `offersOf` from `ahpdKey(meta, 'principal')`; `NO_OFFERS` has none.
- `UPDATE: src/bridges/offers.test.ts` - `offersOf` reads `ahpd.principal` and leaves it out when absent.

## Steps

1. `export type PeopleDomain = 'users' | 'teams' | 'projects' | 'roles'` and `PEOPLE: Record<PeopleDomain, { scheme: 'user' | 'team' | 'project' | 'role'; channel: string; put: string; remove: string }>`, with `channel: 'x-ahpd-users://'`, `put: 'x-ahpd/users/put'`, `remove: 'x-ahpd/users/remove'`, and so for each.
2. `export interface PeopleState<R> { records: { id: string; record: R }[] }` and `peopleReducer(domain)`, folding `x-ahpd-<domain>/added`, `/changed` and `/removed` as `computersReducer` does.
3. `export function servesPeople(offers: Offers, domain: PeopleDomain): boolean` - the domain's channel scheme is in `offers.channels`.
4. `export function writesPeople(offers: Offers, domain: PeopleDomain): boolean` - the provider for the scheme exists and `allows(provider, 'write')`.
5. `export async function putPerson(host: string, offers: Offers, domain: PeopleDomain, id: string, record: Record<string, unknown>, createOnly: boolean): Promise<void>` - `hostBridge(host).request(put, { id, record, createOnly })` when `offers.methods` has it, else `writeResource('<scheme>://<id>', JSON.stringify(record), { createOnly })`.
6. `export async function removePerson(host: string, offers: Offers, domain: PeopleDomain, id: string): Promise<void>` - `request(remove, { id })`, else `deleteResource('<scheme>://<id>')`.
7. `export function userBody(record: UserRecord): Record<string, unknown>` - only `roles`, `issuer`, `rolesFrom`, `memberships` and `primary`, with an empty text sent as `null`.
8. Types come from `@ahpd/sdk` as `import type { UserRecord, Role, Named, Grant }`.

## Validation

- `people.test.ts`: the reducer folds added, changed and removed; `userBody` drops `grants`, `trusted` and `token`, and sends `null` for an empty issuer.
- `pnpm test` and `pnpm typecheck` pass.

## Resume

- Done 2026-10-16: `src/bridges/people.ts` with its test; `Offers.principal`. Also `membershipOptions`, `BUILT_IN_ROLES` and `everyRole`, since the roles channel lists only the roles a users file writes.
- A person signed in with their own token is still nobody to ahpd until `authenticate`; ahpw never sends it, so a person (not the deployment token) is refused the people channels. See the parent plan's open questions.
