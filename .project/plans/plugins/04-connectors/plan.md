---
title: Connectors in an explorer, a form to make one, and a page to see and change it
domain: plugins
status: active
priority: medium
created: 2026-10-22
revalidated: 2026-10-22
requires:
  - plans/plugins/03-plugins-explorer-and-page/plan.md
refs:
  - "[code://src/resources/plugins/index.ts](../../../../src/resources/plugins/index.ts) - the resource this one copies: served, the Group choice, explorer, page, sidebar mount"
  - "[code://src/resources/plugins/rows.ts](../../../../src/resources/plugins/rows.ts) - grouped rows with ranks, a row under each of its groups"
  - "[code://src/resources/plugins/PluginPage.tsx](../../../../src/resources/plugins/PluginPage.tsx) - a head with a state badge over Overview and a second tab"
  - "[code://src/resources/plugins/provides.ts](../../../../src/resources/plugins/provides.ts) - `linkOf`, where a plugin's connector kinds will link"
  - "[code://src/bridges/tokens.ts](../../../../src/bridges/tokens.ts) - a bridge of `x-ahpd/*` commands with answers checked"
  - "[code://src/bridges/people.ts](../../../../src/bridges/people.ts) - `selfId` and `readOwnUser`, for the owner choices"
  - file:///github/ahpd/packages/sdk/src/connectors/channel.ts - `x-ahpd-connectors://`, its kind and connector rows, `put`, `remove`, the owner rule, at main 18bac1c2
  - file:///github/ahpd/packages/sdk/src/types/connectors.ts - `Connector`, `ConnectorKind`, `Capability`, `ConnectorOwner`
  - file:///github/ahpd/packages/webhook/src/kind.ts - the first kind, `webhook`, and its schema
  - file:///github/ahpd/docs/plugins/WEBHOOKS.md - the endpoint connector, its fields, vault names and states
  - file:///github/opendoop/packages/web-next/src/resources/connectors/Form.tsx - one form: the type as a select over the type's own schema
  - file:///github/opendoop/packages/web-next/src/resources/connectors/Detail.tsx - a header over Overview and Settings, Settings reusing the form
---

## Goal

A person sees the host's connectors in a 🔌 explorer, grouped by kind, owner or state.
They make one on a form whose first field picks the kind, with the kind's own fields below it.
A connector's page shows what it is and whether it is open, and its Settings tab changes it on the same form.
A person deletes a connector from its page, after a confirm.

## Reconnaissance

The files read and the patterns to reuse are the `refs` above, each with its note.

### Searches performed

- `grep -rn "connector" src` in ahpw - only the settings key `mcpConnectorsEnabled`; nothing lists connectors.
- `rg "x-ahpd-connectors|x-ahpd/connectors" packages` in ahpd - the channel and two commands, in `connectors/channel.ts`.
- `rg "registerConnector" packages` in ahpd - one kind, `webhook`.

### Runtime path

```
handshake ahpd.channels has x-ahpd-connectors -> trackServed -> 🔌 in the activity bar
explorer: useChannelOnEach(x-ahpd-connectors://) -> rows: kind:<name> are kinds, the rest connectors -> grouped -> ahp.openConnector
form: kind select (kinds' titles) + id, title, owner -> the kind's schema as a SchemaForm -> x-ahpd/connectors/put -> the row, with its state
page: head (title, id, state) -> Overview (kind, plugin, owner, capabilities) | Settings (the form, kind and id fixed) -> Delete -> x-ahpd/connectors/remove
```

### Gaps

- ahpw has no connectors bridge, explorer, form or page.
- Kind rows need `config:read`, so a person without it sees their own connectors but cannot pick a kind to make one.
- A secret field reads `{ "$secret": "<vault name>" }`; a put with an empty string keeps the stored secret.
- A kind says nothing of where it receives, so the page cannot show a webhook's URL without knowing the kind.

## Answers

| What | Source | Task |
| --- | --- | --- |
| Connectors have their own 🔌 entry, after 🔣 Plugins. | Softov, 2026-10-22: "Their own 🔌 entry" | 02 |
| The explorer groups by kind, owner or state from a Group menu; kind is the default. | Softov, 2026-10-22: "Group menu: kind, owner, state" | 02 |
| A connector is made on one form page whose first field selects the kind, as doop's form does. | Softov, 2026-10-22: "one form page, kind as select... see how in doop we did some of that." | 03 |
| The owner choices are me, each of my teams, and the host. | Softov, 2026-10-22: "Me, my teams, the host" | 03 |
| A connector's page is a head over Overview and Settings, Settings reusing the form, as doop's detail does. | (defaulted: doop's `Detail.tsx`, and the plugin page) | 04 |
| On a new connector, a change of kind clears the kind's fields. | (defaulted: doop's form does so; one kind's values do not fit another) | 03 |
| Once made, a connector's kind and id are fixed on its Settings form. | (defaulted: a new kind or id is a new connector) | 04 |
| A secret field is empty on the form, and an empty value keeps the stored secret. | ahpd's `put`: "An empty-string writeOnly field keeps the stored secret" | 03 |
| A row's line is its id, kind and owner; its dot is its state: `open` ok, `invalid` attention, `unavailable` failed. | (defaulted: as the plugin rows) | 02 |
| A plugin's *Connector kinds* opens the connectors section. | (defaulted: as its channels open theirs) | 02 |
| ahpd is asked for kind rows a maker may read without `config:read`, and for where a kind receives. | (defaulted: both are gaps a client cannot close) | 05 |
| The row types are written in ahpw until `@ahpd/sdk` carries them past 0.13. | (defaulted: as the plugin rows) | 01 |

## Proposed architecture

- **Data flow** - The explorer, form and page read `x-ahpd-connectors://`; the form reads the person's own record for their teams.
- **Event flow** - The channel sends added, changed and removed, so a put or a remove shows without a refresh.
- **State flow** - The grouping is kept by `registerChoice`; the open connector is `ACTIVE_CONNECTOR`.
- **Layer responsibilities** - `src/bridges/connectors.ts` holds the channel, the row types and the two commands.
  `src/resources/connectors/` holds the explorer, the form, the page and the commands.
- **Source-of-truth files** - ahpd's `connectors/channel.ts` and `types/connectors.ts`.

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - A connectors bridge](task-01-a-connectors-bridge.md) | done | - |
| [02 - The connectors explorer and its 🔌 entry](task-02-the-connectors-explorer.md) | done | 01 |
| [03 - The connector form](task-03-the-connector-form.md) | done | 02 |
| [04 - A connector's page, Settings and Delete](task-04-a-connectors-page.md) | done | 03 |
| [05 - An empty list for connector:list, and where a connector receives](task-05-kinds-for-a-maker.md) | done | 06 |
| [06 - Adapters, and the connector grants](task-06-adapters-and-connector-grants.md) | done | 04 |
| [07 - The host's public root](task-07-the-hosts-public-root.md) | blocked | 05 |

## Risks and tradeoffs

- A person without `config:read` sees no kinds - the form says so and points at the host's admin, until task 05.
- A kind's schema may use `oneOf` and `allOf`, as `webhook` does - scena's `SchemaForm` follows both.
- A connector whose kind changed its schema is `invalid` - the page says so, and Settings shows what the host holds.

## Resume state

- **Done so far:** tasks 01 to 04.
- **Next action:** [task-07-the-hosts-public-root.md](task-07-the-hosts-public-root.md), once ahpd advertises its public root.
- **Since:** task 06 moved ahpw to ahpd's adapters and connector grants at main 13b19150.
- **Open questions:** none.
- **Blocked:** task 05 waits for ahpd.
- **Watch out for:** the channel's ids mix kinds (`kind:<name>`) and connectors; a connector id never starts with `kind:`, since it is a slug.

## Final verification checklist

- [x] `npx tsc -b`, `npx vitest run` and `npm run build` pass.
- [x] By hand, on ahpd main at port 9199, in Chromium, light and dark: the explorer by kind, owner and state.
- [x] By hand: make a webhook connector for a bot, owned by me, and one owned by a team; see each open.
- [x] By hand: change its settings, keep its secret, and delete it.
- [x] By hand: a reader without `config:read` sees their own connectors and the form's note.
- [ ] `plans/index.md` updated.
