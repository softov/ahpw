---
title: A person with connector:list sees an empty list, and a page says where a connector receives
status: done
depends: [task-06-adapters-and-connector-grants.md]
layer: "ahpw connectors"
refs:
  - file:///github/ahpd/.project/plans/plugin/55-connectors-open-to-a-list-reader/plan.md - the empty snapshot, the advert and refusal naming `connector:list`, and `path` on a receive capability; builds after plan 54
  - file:///github/ahpd/.project/plans/plugin/54-a-webhook-takes-what-real-senders-send/plan.md - the webhook adapter's new schema: senders' proofs, bodies, an automation by name
  - "[code://src/bridges/connectors.ts](../../../../src/bridges/connectors.ts) - `Capability`, which gains `path`"
---

## Objective

A person with `connector:list` and no connector sees an empty list and makes their first connector.
A connector's page shows the URL where it receives, with a copy button, when its adapter names a path.

## Blocked on

ahpd plan plugin 55, which builds after plan 54.
ahpd's builder answered on 2026-10-22, and plan 55 says:

- `x-ahpd-connectors` takes `connector:list` to subscribe, so a reader with no readable connector gets an empty snapshot.
- A `connector:all` holder without `connector:list` still subscribes and reads every row.
- The handshake's `ahpd.channels` and a refusal both name `connector:list`.
- The handshake is the same list for every reader; a client hides an entry by comparing the channel's grant with the reader's grants.
- A `receive` capability may carry `path`, relative to the daemon's HTTP root, with `{id}` for the connector id.
- The webhook's is `/plugins/webhook/{id}`.

Hiding the 🔌 entry by grant is [organization/05 task 07](../../organization/05-a-profile-and-roles-as-pills/task-07-the-hosts-own-profile-on-me.md), with every other entry.
Read the shape ahpd ships, and correct these steps before starting.

## Files

- `UPDATE: src/bridges/connectors.ts` - `path?` on `Capability`, and `receiveUrl(httpRoot, capability, id)`.
- `CREATE: src/bridges/connectors-url.test.ts` - `{id}` filled in, a root with and without a trailing `/`, no path.
- `UPDATE: src/resources/connectors/Overview.tsx` - the URL under a receive capability, with copy.
- `UPDATE: src/i18n/en.json` - `connectors/page/url` and `connectors/page/copied`.
- `UPDATE: src/i18n/es.json` - the same keys.
- `UPDATE: src/i18n/pt.json` - the same keys.

## Steps

1. Read what ahpd shipped in plans 54 and 55, and correct these steps to it.
2. Find where ahpw holds the daemon's HTTP root for a host, and use it as the URL's base.
3. Write `receiveUrl`, which fills `{id}` with the connector id, encoded.
4. Show the URL under each receive capability that has a path, with a copy button.
5. Check that an empty list shows the explorer's empty note and its `+`.
6. Make a webhook on plan 54's schema, and check that every new field draws.

## Validation

- `src/bridges/connectors-url.test.ts` passes.
- `npx tsc -b` and `npx vitest run` pass.
- By hand: a person with `connector:list` and `connector:put` and no connector sees an empty list, then makes one.
- By hand: a webhook's page shows its URL, and a POST to it reaches the bot.

## Resume

Done on 2026-10-23, against ahpd main at d16692d5.
The HTTP root comes from `httpRoot(host)` in `src/bridges/data.ts`.
In an embedder it is the host's own address.
Behind `ahpw serve` or the dev server it is the `daemon` that `ahpw.json` now names.
Elsewhere it is the page's origin, which is the daemon when its web plugin served the page.
A routes listener on another port is not known yet; task 07 asks ahpd to advertise its public root.
By hand: bob, with `connector:list` and `connector:put` and no connector, saw the empty note and made `bob-hook`.
Its page showed `http://127.0.0.1:9199/plugins/webhook/bob-hook`, Copy put it on the clipboard, and a wrong token there answered 401.
Plan 54's webhook schema draws, but `match` is a free map that scena's `SchemaForm` cannot add a key to; the JSON view can.

