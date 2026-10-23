---
title: The host's plugins, in an explorer and a page that enables them and sets their options
domain: plugins
status: active
priority: medium
created: 2026-10-22
revalidated: 2026-10-22
requires:
  - plans/plugins/01-computers-and-bots/plan.md
refs:
  - "[code://src/resources/policies/index.ts#L68-L116](../../../../src/resources/policies/index.ts#L68-L116) - the resource this one copies: served, the Group choice, explorer, page, commands, sidebar mount"
  - "[code://src/shell/register-shell.tsx#L288-L293](../../../../src/shell/register-shell.tsx#L288-L293) - an activity bar item shown while its channel is served"
  - "[code://src/shell/explorer/ExplorerList.tsx#L12-L30](../../../../src/shell/explorer/ExplorerList.tsx#L12-L30) - `Row`, what an explorer row holds"
  - "[code://src/shell/explorer/choice.ts#L46-L58](../../../../src/shell/explorer/choice.ts#L46-L58) - `registerChoice`, the header's Group menu"
  - "[code://src/bridges/people.ts#L53](../../../../src/bridges/people.ts#L53) - `recordsReducer`, which folds a records channel"
  - "[code://src/resources/host/Settings.tsx#L35-L80](../../../../src/resources/host/Settings.tsx#L35-L80) - the root config's schema and values, and the `root/configChanged` a save dispatches"
  - "[code://src/resources/host/sections.ts#L45-L59](../../../../src/resources/host/sections.ts#L45-L59) - the settings window's Plugins group, one `plugins.<id>` key each"
  - "[code://src/resources/computers/Page.tsx#L102-L122](../../../../src/resources/computers/Page.tsx#L102-L122) - a page head with a state badge and actions"
  - "[code://src/resources/agents/Customizations.tsx#L23](../../../../src/resources/agents/Customizations.tsx#L23) - 🧩, which names an agent's own plugins, not the host's"
  - file:///github/ahpd/packages/server/src/pluginschannel.ts - `x-ahpd-plugins://` and `x-ahpd/plugins/enable`, `/disable`, `/options`, at main 18bac1c2
  - file:///github/ahpd/packages/server/src/rootconfig.ts - `plugins.<id>`: `{ enabled, options }`, its schema and how a change is checked
  - file:///github/ahpd/packages/sdk/src/types/plugin.ts - `PluginManifest` and `PluginContracts`
  - file:///github/ahpd/docs/plugins/PLUGINS.md - "What a client sees", the plugins channel and its grants
  - file:///github/opendoop/packages/web-next/src/resources/plugins/Detail.tsx - the header, Overview and Settings tabs this page follows
---

## Goal

A person who may read the host's configuration sees its plugins in an explorer, grouped by state or by category.
A plugin's page shows what it is, its state and problem, and what it says it provides, each linking to where that shows in ahpw.
A person who may change the configuration enables or disables a plugin, and sets its options in a form.
After such a change, the page and the row say the host needs a restart to apply it.

## Reconnaissance

The files read and the patterns to reuse are the `refs` above, each with its note.

### Searches performed

- `grep -rn "plugin" src` in ahpw - only an agent's own plugins (🧩, the agent page) and the settings window's `plugins.<id>` sections; no list of the host's plugins.
- `grep -rn "restartNeeded" src` in ahpw - not read today.
- `rg "x-ahpd-plugins|x-ahpd/plugins" packages` in ahpd - the channel and three methods, all in `pluginschannel.ts`.
- `rg "version" packages/server/src/plugins.ts` in ahpd - a row carries no package version.

### Runtime path

```
handshake ahpd.channels has x-ahpd-plugins -> trackServed -> 🔣 in the activity bar
explorer: useChannelOnEach(x-ahpd-plugins://) -> recordsReducer -> rows grouped by state or category -> ahp.openPlugin
page: the row (state, problem, spec, manifest) -> Overview; root channel config.schema/values['plugins.<id>'] -> Options SchemaForm
Enable / Disable -> x-ahpd/plugins/enable|disable { id } -> restart: true
Options Save -> root/configChanged { 'plugins.<id>': { options } } -> ahpd.restartNeeded on the root -> the restart note
```

### Gaps

- ahpw has no plugins bridge, explorer, page, command or store path.
- A plugins row has no package version, and no live load status: a plugin whose `apply` failed reads `ready`.
- A row has no options schema; it is the root config's `plugins.<id>`.
- `ahpd.restartNeeded` is on the root state's `_meta`, and ahpw does not read it.
- `Not found: install, update and remove over AHP - searched pluginschannel.ts and the methods list; they are HTTP only, with the deployment token.`

## Answers

| What | Source | Task |
| --- | --- | --- |
| The plan lists, views, enables and disables plugins, and sets their options. | Softov, 2026-10-22: "List, view, enable/disable, options" | 01-04 |
| A plugin's page is a header over Overview and Options tabs, as web-next's. | Softov, 2026-10-22: "Header + Overview / Options tabs" | 03, 04 |
| The explorer groups by state or by category, from a Group menu; state is the default. | Softov, 2026-10-22: "optional grouping... state, category. default state." | 02 |
| The host's plugins have 🔣 in the activity bar; 🧩 stays an agent's own plugins. | Softov, 2026-10-22: "🔣 as web-next" | 02 |
| ahpd is asked for a version, a live load status and the options schema on a row; ahpw builds on today's fields. | Softov, 2026-10-22: "You pass it; plan builds on today" | 05 |
| A note on the page and on the row says a restart is needed while `ahpd.restartNeeded` says so. | Softov, 2026-10-22: "A note on the page" | 04 |
| By state, problems come first: error, missing, incompatible, unconfigured; then ready, then disabled. | (defaulted: what needs a person leads) | 02 |
| By category, a plugin shows under each category it names, and one with none under *Other*. | (defaulted: a plugin is found under every role it has) | 02 |
| The explorer follows the policies resource, with `ExplorerList`, not web-next's `Listable`. | (defaulted: every ahpw explorer is an `ExplorerList`) | 02 |
| A row's type is written in ahpw, since `PluginRow` is the server's and not in `@ahpd/sdk`. | (defaulted: as the bot record is, `catalogue.ts`) | 01 |
| Options save as one `root/configChanged` of `plugins.<id>`, as the settings window saves. | (defaulted: one Save for the whole form, checked by the host against the same schema) | 04 |
| Enable, Disable and Save show while the host offers their commands; a refusal shows the host's words. | (defaulted: the reader's grants are not known until `x-ahpd/me`) | 04 |
| 🔣 shows to a reader without `config:read`, whose list then shows the host's refusal. | (defaulted: ahpd lists the channel to every reader; hiding it needs `x-ahpd/me`) | 02 |
| A channel's error and a failure toast are the host's sentence, without `RPC error <code>:`. | (defaulted: the code means nothing to a person) | 02 |
| The restart note also follows a command's `restart: true` and an options save. | (defaulted: ahpd marks the root only for a settings change) | 04 |

## Proposed architecture

- **Data flow** - The explorer and the page read `x-ahpd-plugins://`; the Options tab also reads the root channel's `config`.
- **Event flow** - The plugins channel sends added, changed and removed; a change from the page is followed by a refresh.
- **State flow** - The chosen grouping is kept by `registerChoice`; the open plugin is `ACTIVE_PLUGIN`.
- **Layer responsibilities** - `src/bridges/plugins.ts` holds the channel, the row type and the three commands.
  `src/resources/plugins/` holds the explorer, the page, its tabs and its commands.
  `src/shell/register-shell.tsx` holds the activity bar item.
- **Source-of-truth files** - ahpd's `pluginschannel.ts` for the row and the commands; `rootconfig.ts` for `plugins.<id>`.

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - A plugins bridge](task-01-a-plugins-bridge.md) | done | - |
| [02 - The plugins explorer and its activity bar entry](task-02-the-plugins-explorer.md) | done | 01 |
| [03 - A plugin's page and its Overview tab](task-03-a-plugins-page-and-overview.md) | done | 02 |
| [04 - Enable, Disable, the Options tab and the restart note](task-04-enable-options-and-restart.md) | done | 03 |
| [05 - A plugin's version and live load status](task-05-version-and-live-status.md) | done | 03 |

## Risks and tradeoffs

- A `ready` row may hide a plugin that failed to load - Overview says the state is read from the configuration, until task 05.
- A disabled plugin has an empty options schema, as one that did not load has.
  The Options tab says the plugin must load before a person sets its options.
- The channel does not see a hand edit of the config file - the explorer's reload refreshes it.

## Resume state

- **Done so far:** tasks 01 to 05, on 2026-10-22.
- **Next action:** close the plan: write `implemented.md` and set `status: built`.
- **Open questions:** none.
- **Blocked:** nothing.
- **Watch out for:** "plugin" names two things in ahpw; this plan is the host's plugins, and the agent page's 🧩 plugins are an agent's own.

## Final verification checklist

- [ ] `npx tsc -b`, `npx vitest run` and `npm run build` pass.
- [ ] By hand, on an isolated ahpd from main at port 9199, in Chromium, light and dark: the explorer by state and by category.
- [ ] By hand: a plugin's Overview, and each *provides* link opening its section.
- [ ] By hand: Disable, Enable and an options change, each with the restart note, and a refusal without `config:write`.
- [ ] By hand: a reader without `config:read` sees the host's refusal in its words; no entry once `x-ahpd/me` gives the grants.
- [ ] `plans/index.md` updated.
