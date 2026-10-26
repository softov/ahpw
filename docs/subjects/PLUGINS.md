# Plugins

Plugins lists the plugins a host is configured with, whether each one loaded, and what each provides. You can turn a plugin on or off, import it again, and set its options. This is ahpd's plugin list; another host shows it only if it serves the same channel.

## Where it is

Plugins has the 🔣 icon in the activity bar. It shows while a host lists its plugins to you, which takes the `plugin:list` grant on ahpd. The sidebar lists the plugins; a plugin opens as a page in the main area.

From the [Command palette](../use/PALETTE.md): **Show plugins**.

<Shot id="plugins-list" alt="The plugins list in the sidebar, grouped by state" />

## The list

Each row shows the plugin's icon and title, then its id, version and categories, and what is wrong with it, if anything. A red dot marks a plugin that did not load or has errors. With several hosts, the row also names the host. Type in **Filter plugins** to narrow the list.

The buttons on the section header:

| Button | |
|---|---|
| **Reload** | Reads the list again. |
| **Apply the configuration** | Matches each host's running plugins to its configuration file. Shown when the host offers it. |
| **Group** | **By state** or **By category**. |
| **Hosts** | Picks which hosts to show, when there are several. |

A plugin is **Error**, **Missing**, **Incompatible**, **Unconfigured**, **Ready** or **Disabled**. Its categories are **Agent**, **Channel**, **Connector**, **Storage**, **Tool** and **Other**; grouped by category, a plugin shows under each category it names.

Right-click a row for **Open**, **Enable** or **Disable**, and **Import again**. Each shows when the host offers it.

When the host holds a change it applies only at its next start, the list says "Restart the host to apply the last change."

## The page

The head shows the state, with **Import again** and **Enable** or **Disable**. A change that waits for a restart is shown at the top. The page has two tabs, **Overview** and **Options**.

<Shot id="plugins-page" alt="A plugin page on its Overview tab" />

### Overview

The plugin's description, and what is wrong with it if anything, come first. The facts list its **Id**, **State**, **Version**, whether it is **Running**, and its **Module**, **Path** and **URL**, with the links its manifest gives. Its categories follow.

| Section | |
|---|---|
| **Alerts** | The plugin's errors, warnings, infos and notices. |
| **Provides** | What it provides: **Agents**, **Adapters**, **Channels**, **Commands**, **Resource schemes**, **Tools** and **Trigger kinds**. An agent opens its page in [Agents](AGENTS.md), an adapter opens [Connectors](CONNECTORS.md). A plugin that has not loaded, or whose manifest names nothing, says so. |
| **As configured** | Its entry in the host's configuration, as JSON. Folded at first. |

### Options

The plugin's options, as a form drawn from what the plugin takes. A secret option reads `<set>` and is sent only once you type a new value. **Save** sends the changed options one at a time, and the host checks each one; if it refuses one, the form keeps your edits and says why. **Reset** goes back to what the host holds.

The host applies saved options at its next start. A plugin that is off, or did not load, has no options here.
