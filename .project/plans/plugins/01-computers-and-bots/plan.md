---
title: Computers and bots
domain: plugins
status: active
priority: medium
created: 2026-10-16
revalidated: 2026-10-16
requires:
  - plans/hosts/03-hosts-filters-and-the-folder-pill/plan.md
refs:
  - "[code://src/bridges/server-info.ts](../../../../src/bridges/server-info.ts) - reads `serverInfo` off the `initialize` answer; the offers are read the same way"
  - "[code://src/bridges/data.ts#L15-L70](../../../../src/bridges/data.ts#L15-L70) - `ahpPaths`, `hostBridge` with `follow`, `request`, `writeResource`, `deleteResource`"
  - "[code://src/bridges/channel.ts](../../../../src/bridges/channel.ts) - `useChannelOnEach`, a channel followed on every shown host"
  - "[code://src/resources/automations/index.ts](../../../../src/resources/automations/index.ts) - the resource pattern: components, commands, the sidebar mount, `registerChoice`"
  - "[code://src/resources/automations/Explorer.tsx](../../../../src/resources/automations/Explorer.tsx) - a list over every shown host, grouped, sorted and filtered"
  - "[code://src/resources/automations/Edit.tsx](../../../../src/resources/automations/Edit.tsx) - a hand-written form page with `web-form` fields"
  - "[code://src/resources/host/Settings.tsx#L40](../../../../src/resources/host/Settings.tsx#L40) - `SchemaForm` from a host-given schema"
  - "[code://src/shell/register-shell.tsx#L172-L231](../../../../src/shell/register-shell.tsx#L172-L231) - the activity bar mounts and the register calls"
  - file:///github/ahpw/.project/research/computers-and-bots.md - what exists, and Softov's answers
  - file:///github/ahpd/packages/computer/src/provider.ts - `computer://`, its four leaves and the `x-ahpd/computers/*` methods
  - file:///github/ahpd/packages/computer/src/manifest.ts - `MANIFEST_SCHEMA`, sent as the provider's `manifest`
  - file:///github/ahpd/packages/sdk/src/recordschannel.ts - the records channel: snapshot `{records}`, added, changed and removed
  - file:///github/ahpd/packages/bot/src/record.ts - `BotRecord`, `BOT_BODIES`, `BOT_COLORS`, the slug rule
  - file:///github/ahpd/packages/bot/src/catalogue.ts - `x-ahpd-bots://`: snapshot `{bots}`, added and changed with `bot`, removed with `id`
  - file:///github/ahpapp/src/computers.ts - the method-or-resource fallback and the docker inspect reading
  - file:///github/ahpapp/src/components/ComputerDetail.tsx - the computer panel
  - file:///github/ahpapp/src/bots.ts - `recordBody`, `slugOf`, the colour names
  - file:///github/ahpapp/src/components/BotEditor.tsx - the bot form
  - file:///github/ahpapp/src/components/BotLayer.tsx - the floating bots and their pucks
  - file:///github/cofold/packages/bood/src/dom.ts - `mountBood`, `BoodView`
  - npm://@cofold/bood@^0.1.0 - the creature drawing; Softov publishes it
---

## Goal

A host's computers and bots show in ahpw as resources: a list in the side bar, a page, and a form to make one.
Bots are drawn with cofold's bood, and also float at the window's edge, where a click talks to the bot.

## Reconnaissance

The files read and the patterns to reuse are the `refs` above, each with its note.

### Runtime path

```
initialize answer _meta -> ahpPaths(host).offers -> does the host serve computer / bot?
x-ahpd-computers:// | x-ahpd-bots:// -> hostBridge.follow -> channelPath -> Explorer rows, Page, BotLayer
form -> x-ahpd/computers/create | resourceWrite bot:// (createOnly | ifMatch) -> channel update -> list
```

### Gaps

- ahpw keeps no `_meta` from a host, so it cannot tell which plugins a host serves.
- `@cofold/bood` is not on npm yet, and ahpw has no React component for it.
- No computers or bots list, page or form.
- `BOT_BODIES` says `semicircle`, which bood calls `jelly`; `BOT_COLORS` are names, bood's colours are hex.
- Both plugin packages import Node built-ins, so ahpw may only take their types.

## Answers

| What | Source | Task |
| --- | --- | --- |
| ahpw depends on `@cofold/bood`, with a small React `Bood` over `mountBood`. | Softov, 2026-10-16: "Depend on @cofold/bood" | p1 |
| Softov publishes `@cofold/bood` 0.1.0; ahpw adds `^0.1.0`, and builds against a local link until then, never committed. | Softov, 2026-10-16: "You publish it" | p1 |
| Computers get a side bar list, a page, and a create form drawn from the host's manifest schema. | Softov, 2026-10-16: "add the resources to computer, explorer listing and panel" | p2 |
| Bots get a side bar list, a page, and a form to create and edit. | Softov, 2026-10-16: "a bot explorer and panel and form to create" | p3 |
| The bot form has the look (body, colour, preview), name, labels, description and owner. | Softov, 2026-10-16, all four field groups chosen | p3 |
| Instructions are in the form on create and on edit, with a hint that only later chats use a change. | Softov, 2026-10-16: "Editable too" | p3 |
| Bots float at the window's edge: first pucks on the right edge with a popover, then dragging. | Softov, 2026-10-16: "Core, then drag" | p4, p5 |
| No drift, no side bar placement, no placement chips in the form. | Softov, 2026-10-16: "Core, then drag", as the option said | p4, p5 |
| ahpw reads a host's offers from the `_meta` of its `initialize` answer, as it reads `serverInfo`. | [`code://src/bridges/server-info.ts`](../../../../src/bridges/server-info.ts) | p1 |
| A computer action calls the `x-ahpd/computers/*` method when the host offers it, else the resource write ahpapp falls back to. | file:///github/ahpapp/src/computers.ts | p2 |
| The computer create form is scena's `SchemaForm`, with the manifest's `x-choices` read as `x-enumOptions`. | [`code://src/resources/host/Settings.tsx#L40`](../../../../src/resources/host/Settings.tsx#L40) | p2 |
| Computers list grouped by host or state, and filtered by running, stopped or problem, as ahpapp does. | `(defaulted: ahpapp's computers list, with plan 03's header buttons)` | p2 |
| The activity bar gets 💻 for computers and 👾 for bots, at the bottom after agents. | `(defaulted: 🤖 is the agents' icon)` | p2, p3 |
| A bot's page shows its look, facts and session, with Open chat, Edit and Delete. | `(defaulted: ahpapp has no bot page; its popover and editor hold the same facts)` | p3 |
| Pucks and placements are kept per browser, never sent to a host. | file:///github/ahpapp/src/bots-store.ts | p5 |

## Proposed architecture

- **Data flow** - Each host's two channels are followed with `hostBridge(host).follow`, and their state lands at `channelPath`, as automations do.
- **Event flow** - Actions are commands; writes go through `hostBridge(host).request`, and the channel brings the change back.
- **State flow** - The lists' choices and the bots' pucks live in the store and in storage, per browser.
- **Layer responsibilities** - `src/bridges`: the offers; `src/resources/computers`, `src/resources/bots`: lists, pages, forms; `src/resources/bots/layer`: the floating bots.
- **Source-of-truth files** - `src/bridges/offers.ts` (new in p1).

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [p1 - Offers and bood](01-computers-and-bots-p1-offers-and-bood/plan.md) | active | - |
| [p2 - Computers](01-computers-and-bots-p2-computers/plan.md) | built | p1 |
| [p3 - Bots](01-computers-and-bots-p3-bots/plan.md) | built | p1 |
| [p4 - The bot layer](01-computers-and-bots-p4-the-bot-layer/plan.md) | built | p3 |
| [p5 - Dragging bots](01-computers-and-bots-p5-dragging-bots/plan.md) | built | p4 |

## Risks and tradeoffs

- The computers channel only refreshes on ahpd's own changes - a page re-reads `status` after an action, and polls `stats` while running.
- Until bood is published, the dependency is a local link - it is never committed, and p1 is not closed until `^0.1.0` installs.

## Resume state

- **Done so far:** p2 to p5 built, 2026-10-16; p1 in code, waiting on the bood publish.
- **Next action:** once `@cofold/bood` 0.1.0 is on npm, swap the local link for `^0.1.0` and close p1, then this plan.
- **Open questions:** none.
- **Watch out for:** take only types from `@ahpd/bot` and `@ahpd/computer`, since their code imports `node:fs`.

## Final verification checklist

- [x] With a host serving both plugins, computers and bots list, open and are made from ahpw, mono and multi.
- [x] A host serving neither shows no computers or bots entry, and no error.
- [x] Bots float on the right edge; a click talks to the bot; a drag moves it.
- [ ] `plans/index.md` updated.
