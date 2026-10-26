# Connectors

A connector links the host to an outside service. Each one is made from an adapter that a plugin registers, and holds that adapter's settings and secrets. This page lists them, shows what each can do, and makes, changes and deletes them.

## Where it is

Connectors has the 🔌 icon in the activity bar. It shows while a host lists connectors to you, which takes the `connector:list` grant on ahpd. The sidebar lists the connectors; a connector opens as a page in the main area.

From the [Command palette](../use/PALETTE.md): **Show connectors** and **New connector**.

<Shot id="connectors-list" alt="The connectors list in the sidebar, grouped by adapter" />

## The list

Each row shows a state dot, the title, and a line with its id (when the title differs), its adapter and its owner. With several hosts, the row also names the host. Type in **Filter connectors** to narrow the list.

The section header has **New connector** (+), **Reload**, **Group** and **Hosts**. **Group** sorts the list **By adapter** (the default), **By owner** or **By state**.

A connector is:

| State | |
|---|---|
| **Ready** | It is open. |
| **Invalid** | Its settings do not fit its adapter, or the adapter refused to open it. Change its settings to open it again. |
| **Unavailable** | No plugin registers its adapter now. Enable the plugin that offers it to open it again. |

Right-click a row for **Open** and **Delete**. Delete asks first: the host closes the connector and forgets its secrets, and you cannot undo it.

## The page

The head shows the adapter's icon, the title and the state, with **Delete**. A connector that is not ready says why. The page has two tabs, **Overview** and **Settings**.

<Shot id="connectors-page" alt="A connector page with its capabilities" />

### Overview

The adapter's description comes first. The facts list the **Id**, **State**, **Adapter**, **Owner**, and the **Plugin** that offers the adapter, which opens it in [Plugins](PLUGINS.md).

**Capabilities** lists what the adapter declares, grouped as **Receives**, **Commands**, **Actions** and **Interfaces**. Click one to open it: its description, the URL that outside calls go to with a **Copy** button (for one that receives), and the values it takes, with the required ones marked.

### Settings

The same form as a new connector, with the adapter and id fixed. **Save** sends your changes, **Reset** goes back to what the host holds. A secret the host already holds reads "Kept. Type a new value to replace it."

## Make one

**New connector** opens a form.

| Field | |
|---|---|
| **Adapter** | Search the adapters, grouped by the plugin that registers them, and pick one. **Change** picks another; it clears the adapter's settings. |
| **Title** | What the list shows. Empty, it shows the id. |
| **Id** | A slug, made from the title until you change it. It cannot change later. |
| **Owner** | **Me**, **The host**, or a team or user you may name. |

Below come the adapter's own settings. **Create** makes the connector and opens its page.

If the host lists no adapters to you, or you do not hold the `connector:put` grant, the form says so.
