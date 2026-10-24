---
title: The host's plugins, in an explorer and a page that enables them and sets their options - implemented
date: 2026-10-23
refs:
  - git://f68b6c0
  - "[code://src/bridges/plugins.ts](../../../../src/bridges/plugins.ts)"
  - "[code://src/resources/plugins/](../../../../src/resources/plugins/)"
  - file:///github/ahpd/packages/server/src/pluginschannel.ts - the channel and the commands this builds on, at main 13b19150
---

A person sees the host's plugins under 🔣, grouped by state or by category.
A plugin's page shows its version, its load status, its problem and what it provides, each provide linked to where it shows in ahpw.
A person who may change the configuration enables or disables a plugin and sets its options.
The page and the explorer then say when the host needs a restart.

## What was built

- [`code://src/bridges/plugins.ts`](../../../../src/bridges/plugins.ts) - the `x-ahpd-plugins://` row and manifest types, the fold, `specEnabled`, and the enable, disable and options commands.
- [`code://src/resources/plugins/index.ts`](../../../../src/resources/plugins/index.ts) - `registerPlugins`, the explorer, the page and the commands.
- [`code://src/resources/plugins/rows.ts`](../../../../src/resources/plugins/rows.ts) - the explorer rows by state or by category, with the version and a failed load as `failed`.
- [`code://src/resources/plugins/PluginPage.tsx`](../../../../src/resources/plugins/PluginPage.tsx) - the header with *Enable* and *Disable*, the restart note, and the Overview and Options tabs.
- [`code://src/resources/plugins/Overview.tsx`](../../../../src/resources/plugins/Overview.tsx) - the state, the version, the load status, the problem and the provides list.
- [`code://src/resources/plugins/provides.ts`](../../../../src/resources/plugins/provides.ts) - what a plugin provides, grouped, and the ahpw link for each.
- [`code://src/resources/plugins/Options.tsx`](../../../../src/resources/plugins/Options.tsx) - the options form, from the row's schema and values.
- [`code://src/resources/plugins/actions.ts`](../../../../src/resources/plugins/actions.ts) - the commands and the restart marker.

## Verified

- `npx tsc -b`, `pnpm build` and `npx vitest run` (103 files, 544 tests) pass on 2026-10-23, after `pnpm install --frozen-lockfile` brought scena 0.5.11.
- The plugin tests are `plugins.test.ts`, `rows.test.ts`, `provides.test.ts` and `options.test.ts`: 16 tests.
- By hand in Chromium on ahpd main at port 9199, light and dark: the explorer by state and by category.
- By hand: the agent link opens `bot-chat`, and `x-ahpd-bots` opens the Bots section.
- By hand: Bot shows 0.13.0 and running; push enabled and disabled with the restart note; `lastChats` -5 refused in the host's words, and 20 saved.
- Not checked by hand: a refusal without `config:write`, and the list for a reader without `config:read`.

## Departures from the plan

- Task 05 - options save each changed key through `x-ahpd/plugins/options`, not one `root/configChanged`, since ahpd shipped that command; a refused value stays in the form.
- Task 05 - the schema and the values come from the row, not from the root config.
- Task 05 - after a command, ahpw reads the root again for `ahpd.restartNeeded`, and its own restart marker is gone.
- Task 02 - a channel error and a failure toast drop `RPC error <code>:` in all of ahpw, through `hostSaid`, not only in this resource.

## Left for later

- Hiding 🔣 from a reader without `config:read` waits for `x-ahpd/me`, in [organization/05 task 07](../../organization/05-a-profile-and-roles-as-pills/task-07-the-hosts-own-profile-on-me.md).
- The protocol client drops the `x-ahpd/restartNeeded` push, so the note follows only a read of the root.
- Install, update and remove are HTTP only in ahpd, with the deployment token, and ahpw does not offer them.
