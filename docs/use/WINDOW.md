# Window

The window has a title bar at the top, an activity bar on the left, a sidebar on each side, a bottom panel and the main area in the middle. Each part can be shown or hidden, and the main area can lay out its tabs in several ways.

<Shot id="window-overview" alt="The window with the activity bar, the left sidebar, a session in the main area and the right sidebar" />

## Title bar

The title bar shows the name ahpw on the left. When ahpw runs inside an app that embeds it, a host switcher follows the name.

The buttons on the right, in order:

| Button | |
| --- | --- |
| Light or dark | Switches between the light and the dark look |
| **Customize layout** | Opens the layout menu |
| **Toggle left sidebar** | Shows or hides the left sidebar (Ctrl+B) |
| **Toggle panel** | Shows or hides the bottom panel (Ctrl+J) |
| **Toggle right sidebar** | Shows or hides the right sidebar (Ctrl+Alt+B) |

When ahpw draws the window frame itself inside an embedding app, the window buttons (minimize, maximize or restore, and close) come last.

## Activity bar

Each icon on the activity bar opens its section in the left sidebar. Click the icon of the section that is already showing to close the sidebar. On the first visit the sidebar shows Sessions.

At the top:

| Icon | |
| --- | --- |
| **Sessions** | The session list. Its badges count the unread sessions and the working ones, leaving out archived sessions. See [Sessions](../subjects/SESSIONS.md) |
| **Explorer** | Open editors and the host's folders. See [Folders](../subjects/FOLDERS.md) |
| **Automations** | See [Automations](../subjects/AUTOMATIONS.md) |

At the bottom:

| Icon | |
| --- | --- |
| **Agents** | See [Agents](../subjects/AGENTS.md) |
| **Computers** | Only when the host serves computers. See [Computers](../subjects/COMPUTERS.md) |
| **Bots** | Only when the host serves bots. See [Bots](../subjects/BOTS.md) |
| **Users** | Only when the host lists users. See [Users and roles](../subjects/USERS.md) |
| **Teams** | Only when the host lists teams. See [Teams and projects](../subjects/TEAMS.md) |
| **Usage** | Only when the host keeps usage. See [Usage](../subjects/USAGE.md) |
| **Policies** | Only when the host lists policies. See [Policies](../subjects/POLICIES.md) |
| **Plugins** | Only when the host lets you read its plugins. See [Plugins](../subjects/PLUGINS.md) |
| **Connectors** | Only when the host lists connectors to you. See [Connectors](../subjects/CONNECTORS.md) |
| **Manage** | A menu: language, layout, theme, host and settings, your account, and **Sign out**. See [Interface](INTERFACE.md) |

## Left sidebar

The left sidebar shows the section picked on the activity bar. The Explorer stacks two panes, Open editors over the folders. Every other section shows one page under its header.

Lists in the sidebar share these controls:

| Action | |
| --- | --- |
| Filter | Type in the box at the top to narrow the list |
| Open a row | Click it, or press Enter or Space |
| Row menu | Right-click the row, or press the ContextMenu key or Shift+F10 |
| Fold a group | Click the group heading; it shows how many rows it holds |

## Right sidebar

The right sidebar shows its panes as tabs: **Session**, the details of the open session, and **Changes**, the files it changed. See [Sessions](../subjects/SESSIONS.md) and [Changes](../subjects/CHANGES.md).

Close a tab with its ×. The sidebar's "..." menu offers it again as **Show** followed by its name.

## Bottom panel

The bottom panel holds the **Log** tab, always first, and a tab for each terminal on the host. See [Terminals and log](../subjects/TERMINALS.md).

| Action | |
| --- | --- |
| **Toggle panel** | Shows or hides the panel (Ctrl+J or Ctrl+`) |
| **Show log** | Opens the panel on the log |
| **Hide panel** | The last button on the panel's tab strip |

## Main area

The main area shows sessions, files, diffs and pages as tabs. The tabs open last time come back on the next visit. With no tab open, the main area shows a start page with a **New session** button.

<Shot id="window-start" alt="The start page in an empty main area" />

The main area has six layouts:

| Layout | |
| --- | --- |
| **Tabs** | One strip of tabs. The default |
| **Tab groups** | Tabs in groups side by side |
| **Split** | Panes split side by side |
| **Spatial** | Pages placed on a surface |
| **Stack** | Pages stacked |
| **Single** | One page at a time |

Pick a layout from the layout menu or in the [interface settings](INTERFACE.md). The browser keeps the choice.

## Layout menu

**Customize layout** opens the layout menu. It has three groups.

**Show** lists each part of the window with a tick when it shows: **Title bar**, **Activity bar**, **Left sidebar**, **Right sidebar**, **Panel** and **Status bar**. Click one to show or hide it.

**Main layout** lists the six layouts, with the current one ticked.

**Modes** set several parts at once. They leave the bottom panel as it is.

| Mode | Key | Shows |
| --- | --- | --- |
| **Default** | Ctrl+K D | Title bar, activity bar, left sidebar and status bar |
| **Focus** | Ctrl+K F | The title bar only |
| **Zen** | Ctrl+K Z | Nothing but the main area |
| **Wide** | Ctrl+K W | Title bar, activity bar and status bar, no sidebars |
| **Split view** | Ctrl+K S | Everything, both sidebars included |

<Shot id="window-layout-menu" alt="The layout menu with its Show, Main layout and Modes groups" />

## Narrow screens

On a narrow screen both sidebars float over the page, and showing one hides the other. On the narrowest screens the left sidebar opens as a sheet and the activity bar changes to a bar. Opening a session or a page hides a sidebar that floats over it.

## Keys

Keys with Ctrl, Alt or Meta work while you type in a box. Keys without them do not fire while a box has the focus. The [command palette](PALETTE.md) lists every command with its key.
