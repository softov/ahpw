# Host

The host is the AHP server ahpw is connected to, such as ahpd. Its pages show the connection and what the host offers, and edit the host's settings.

## Where it is

There is no activity bar icon. Open the **Manage** gear at the foot of the activity bar:

- **Host** opens the host information page.
- **Settings** opens the settings.

The palette has **Host information**, **Host settings** and **Interface settings**.

## Host information

<Shot id="host-info" alt="The Host page with its connection and offers" />

The **Host** page shows the connection's status. While it is not connected, **Reconnect now** tries again at once. **Settings** opens the settings.

- **Connection**: the status, host, protocol, when it connected, the client, the server's sequence, how many channels it follows, and the last error.
- **Offers**: **Agents**, which opens the [Agents](AGENTS.md) list, the default folder, how many sessions are active, and whether the host takes automations, and how often they may run.
- **Trusted folders**: what this browser answered when a session started in a folder. The trusted ones are sent to the host on every connect. **Forget** drops an answer, and forgetting a yes tells the host at once.
- **Terminals**: each terminal's title, and whether it is running or has exited.

## Settings

<Shot id="host-settings" alt="The settings with the Host tab open" />

Settings has two tabs.

**Host** edits the settings the host publishes, in groups for the host, the daemon, each plugin and VS Code. The fields come from the host, and can be shown as fields, JSON or sections. **Save** sends what you changed, and **Reset** drops your edits. A host that publishes no settings says so.

**Interface** holds this browser's own settings, which apply as you change them. See [Interface](../use/INTERFACE.md).

### Where settings open

Settings open where you last put them, a **Floating window** at first. **Open in** moves them to a **Floating window**, an **Editor tab**, the **Right sidebar** or the **Bottom panel**. It is on the floating window's title bar, on the settings tab, and in the tab's context menu. Unsaved edits move with them.

The floating window drags by its title bar and resizes from its corner. **Maximize** and **Restore** are on its bar, and so is a double click. **Close** or Escape closes it. It remembers where it was.

When the window shows several hosts, each host has its own pages, titled with the host's name.
