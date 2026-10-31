---
title: Customizations by kind, with the file beside the list
created: 2026-10-30
refs:
  - git://b811758 - the commit of ahpw the facts were checked at
  - "[code://src/resources/agents/Customizations.tsx#L134-L170](../../src/resources/agents/Customizations.tsx#L134-L170) - `CustomizationTrees`, the tree that this change replaces"
  - "[code://src/resources/agents/Customizations.tsx#L113-L132](../../src/resources/agents/Customizations.tsx#L113-L132) - `DetailModal`, the detail that opens over the page"
  - "[code://src/resources/agents/words.ts#L255-L280](../../src/resources/agents/words.ts#L255-L280) - `customizationRows`, which builds one row per plugin, folder or MCP server"
  - "[code://src/resources/agents/Page.tsx#L50-L110](../../src/resources/agents/Page.tsx#L50-L110) - the agent page and its tabs"
  - "[code://src/resources/agents/Overview.tsx#L103-L108](../../src/resources/agents/Overview.tsx#L103-L108) - the Customizations section of the agent page"
  - "[code://src/resources/agents/custom-files.ts](../../src/resources/agents/custom-files.ts) - New, Edit and the `ui.customFileOpens` setting, which stay"
  - npm://@microsoft/agent-host-protocol@1.0.0 - the customization types and `session/customizationToggled`
  - https://github.com/microsoft/vscode/blob/171e90619c7/src/vs/workbench/contrib/chat/browser/aiCustomization/aiCustomizationManagementEditor.ts - VS Code's customization editor, sections by kind and a preview of the selected item
---

# Customizations by kind, with the file beside the list

Softov wants the customizations on the agent page sorted by kind, not by the plugin or folder they come from.
He chose layout B from two mockups on 2026-10-30: "ok, layout B."
Customizations get a tab on the agent page. Kinds are tabs over a list, and the selected item shows beside the list with its actions.
The detail modal goes away.

## What others do

VS Code's customization editor at `171e90619c7` has one section per kind: Agents, Skills, Instructions, Prompts, Hooks, MCP Servers, Plugins.
A section lists its items by source, such as user, workspace or plugin.
The editor shows a preview of the selected item, with its frontmatter and its body, and opens an embedded editor to edit it.
Layout B follows this shape, with tabs in place of VS Code's sidebar of sections.

## What ahpw has today

- `CustomizationTrees` draws one tree. A top row is a plugin, a folder or a bare MCP server, and its children are under it.
- `customizationRows` builds the rows by source, so a skill from a plugin and a skill from `~/.claude/skills` are in different branches of the tree.
- A plugin with no children shows as its own row, with the word "Empty".
- A click on a child opens `DetailModal` over the page. The modal shows the copy buttons, the flags, the description, Edit, and the Markdown body.
- The agent page has the tabs Overview and Settings. An agent with no record shows its Overview only.
- The tree is one section of the Overview, after the models table, under the heading Customizations.
- New on a writable folder and Edit on a written file go through `custom-files.ts`. `ui.customFileOpens` opens the file in a panel or a modal.
- The agent page reads `agent.customizations` from the root state. No session exists there.

## Who writes

- ahpw `main` at `b811758` holds the files. No open branch changes `src/resources/agents/` or the customization styles in `src/style/app.css`.
- The branches `agents/page-icons` and `agents/row-icons` change icons only, not these files.

## The change

- Customizations move from the Overview to a tab of their own on the agent page, after Overview and Settings. Softov, 2026-10-30: "Can be a tab inside agent?"
- The Overview keeps a one-line summary of the customizations, with the counts by kind and a link to the tab. Softov, 2026-10-31: "ok on the summary on the overview."
- `ahp.openAgent` with `section: 'customizations'` opens the tab, not a place in the Overview.
- An agent that the host serves with no record shows the tabs when it has customizations.
- The tab shows one kind tab per kind that has items: Agents, Skills, Prompts, Rules, Hooks, MCP servers, Plugins. A tab shows its count.
- The kinds with no items show as one line of text after the tabs, not as tabs.
- A tab lists its items in groups by source. A folder is a group with its short path. The items of a plugin show in a Plugins group, each with the plugin name as a tag.
- The Plugins tab lists the plugins, with their state and their count of children.
- Each item shows its name and one line of its description. An item that is off is dimmed, as today.
- A search field and the New button are over the list. Search filters the names and descriptions in the current kind only, as in VS Code. New shows on the Agents and Skills tabs when a writable folder for that kind exists.
- The selected item shows beside the list: its name, its source path, Edit, the copy buttons, the frontmatter and the Markdown body.
- At 420 px the list and the selected item are two views. The item view has a back link to the list.
- `DetailModal` is removed. Edit still follows `ui.customFileOpens`.
- The state of an item shows as a word or a dot, as today. A switch is not added, because `session/customizationToggled` is a session action and the agent page has no session.
