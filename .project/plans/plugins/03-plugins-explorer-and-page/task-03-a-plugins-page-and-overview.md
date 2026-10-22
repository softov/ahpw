---
title: A plugin's page has a header with its state, and an Overview of what it is and provides
status: done
depends: [task-02-the-plugins-explorer.md]
layer: "ahpw plugins"
refs:
  - "[code://src/resources/computers/Page.tsx#L102-L122](../../../../src/resources/computers/Page.tsx#L102-L122) - a page head with a badge and actions"
  - "[code://src/resources/profile/ProfilePage.tsx](../../../../src/resources/profile/ProfilePage.tsx) - a header over scena's `Tabs`"
  - file:///github/ahpd/packages/sdk/src/types/plugin.ts - `PluginContracts`, the register methods a plugin names
  - file:///github/opendoop/packages/web-next/src/resources/plugins/Detail.tsx - the Overview's facts and sections
---

## Objective

`ahp.openPlugin { host, id }` opens a plugin's page in a main tab.
The header shows 🔣, the title, the id and a state badge, over Overview and Options tabs.
Overview shows the description, the facts, the problem, and what the plugin provides, each linking where ahpw shows it.

## Files

- `CREATE: src/resources/plugins/PluginPage.tsx` - the header and the `Tabs`.
- `CREATE: src/resources/plugins/Overview.tsx` - the Overview tab.
- `CREATE: src/resources/plugins/provides.ts` - `providedGroups(contracts)` and `linkOf(kind, name)`.
- `CREATE: src/resources/plugins/provides.test.ts` - the groups, a `*` entry, and the links.
- `UPDATE: src/style/app.css` - `.web-plugin` and its provides list.
- `UPDATE: src/i18n/en.json` - `plugins/page/*` and `plugins/provides/*`.
- `UPDATE: src/i18n/es.json` - the same keys.
- `UPDATE: src/i18n/pt.json` - the same keys.

## Steps

1. Render the head as `web-page__head`, with the title, the id in `web-role__uri`, and a `Badge` toned by state.
2. Render `Tabs` with `overview` and `options`, the chosen one kept in memory as the profile's is.
3. Show the description as Markdown, and the problem as an `Alert` toned by state.
4. Show the facts in a `DetailList`: state, module, path, URL, the host in multi mode.
5. Show the categories as still pills, and the links as links.
6. Group `contracts` by register method: agents, channels, methods, connectors, resource providers, and the rest.
7. Link each agent to `ahp.openAgent`, each `x-ahpd-bots` or `x-ahpd-computers` channel to its section.
8. Show an entry with no place in ahpw as its name, with no link.
9. Say the plugin declares nothing when `undeclared` is true.
10. Show the configured `spec` as JSON in a closed `details`, secrets as the host masks them.
11. Say ahpd reads the state from the configuration, until task 05 brings the live status.

## Validation

- `src/resources/plugins/provides.test.ts`: the groups, a `*` entry, a link and an entry with none.
- `npx tsc -b` and `npx vitest run` pass.
- By hand, light and dark: the header, each state's badge, Overview, and each link opening its place.

## Resume

Done on 2026-10-22.
The id sits beside the title, as on the role and user pages, when the title is not the id.
Only the provide kinds ahpw knows are translated; any other shows as its register method.
Checked by hand: the agent link opens `bot-chat`, and `x-ahpd-bots` opens the Bots section.
