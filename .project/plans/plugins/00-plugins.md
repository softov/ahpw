---
title: Plugins - what exists today
domain: plugins
refs:
  - file:///github/ahpd/packages/computer - the computer plugin
  - file:///github/ahpd/packages/bot - the bot plugin
---

ahpd plugins add things AHP does not have: computers and bots among them.
A client reaches them through resource commands on their scheme, `x-ahpd/...` methods and `x-ahpd-*://` channels.
A host names what it serves in the `_meta` of its `initialize` answer: `ahpd.methods`, `ahpd.channels` and `ahpd.resourceProviders`.

## Today in ahpw

- [`code://src/bridges/offers.ts`](../../../src/bridges/offers.ts) reads the offers into `ahpPaths(host).offers`, off the same answer as `serverInfo`.
- [`code://src/bridges/served.ts`](../../../src/bridges/served.ts) says which hosts serve a channel; a plugin's entry shows only while one does.
- [`code://src/resources/computers/`](../../../src/resources/computers/) lists, opens and makes computers.
- [`code://src/resources/bots/`](../../../src/resources/bots/) lists, opens, makes and edits bots, drawn by `@cofold/bood`, and floats them at the window's edges.
