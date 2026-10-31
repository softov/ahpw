# Command palette

The command palette lists every command you can run from the keyboard, with its key, and the host's terminals. Type to narrow the list, then pick a row.

<Shot id="palette-commands" alt="The command palette with its list of commands" />

## Open it

| Key | |
| --- | --- |
| Ctrl+P | Opens the palette |
| Ctrl+Shift+P | Opens the palette |
| Escape | Goes back from a sub-list, else closes the palette |

A click outside the palette closes it too.

The box reads "Type a command or a terminal". Some commands open a sub-list, such as **Change language…** and **Change theme…**. The search in a sub-list ignores accents, so "portugues" finds "Português".

## Terminals

The palette lists the host's terminals under **Terminals**, each by its title, with who holds it on the second line. Pick one to open it in the bottom panel. See [Terminals and log](../subjects/TERMINALS.md).

## Commands

Commands that belong to a feature the host does not serve are left out of the list.

### View

| Command | Key |
| --- | --- |
| **Toggle left sidebar** | Ctrl+B |
| **Toggle right sidebar** | Ctrl+Alt+B |
| **Toggle activity bar** | |
| **Toggle status bar** | |
| **Toggle title bar** | |
| **Toggle panel** | Ctrl+J, Ctrl+` |
| **Show log** | |
| **Clear log** | While the log tab shows |
| **Change language…** | |
| **Change theme…** | |
| **Customize layout** | |
| **Customize layout: Default** | Ctrl+K D |
| **Customize layout: Focus** | Ctrl+K F |
| **Customize layout: Zen** | Ctrl+K Z |
| **Customize layout: Wide** | Ctrl+K W |
| **Customize layout: Split view** | Ctrl+K S |

See [Window](WINDOW.md) for what each layout mode shows.

### Notifications

| Command | |
| --- | --- |
| **Notify me when this tab is in the background** | Asks the browser to allow background notifications |
| **Notify me when this tab is closed** | Asks the host to notify this browser with no tab open |
| **Stop notifications when this tab is closed** | Removes this browser from the host |
| **Notify me only about sessions this device opened** or **Notify me about all my sessions** | Switches which sessions notify this browser; the title names the other choice |
| **Ask in the page's own dialog** or **Ask in the browser's dialog** | Switches where questions are asked; the title names the other choice |
| **Dismiss all notifications** | |

See [Interface](INTERFACE.md).

### Host and interface

| Command | |
| --- | --- |
| **Host information** | See [Host](../subjects/HOST.md) |
| **Host settings** | |
| **Interface settings** | See [Interface](INTERFACE.md) |

### Sessions, terminals and files

| Command | Key |
| --- | --- |
| **Show sessions** | |
| **New session** | Ctrl+N, Alt+N |
| **New terminal** | |
| **Show the explorer** | |

The browser keeps Ctrl+N for a new window, so Alt+N is there too. With every host shown, **New terminal** first asks which host.

### Host features

| Command | |
| --- | --- |
| **Show agents**, **New agent** | [Agents](../subjects/AGENTS.md) |
| **Show automations**, **New automation** | [Automations](../subjects/AUTOMATIONS.md) |
| **Show bots**, **New bot** | [Bots](../subjects/BOTS.md) |
| **Show computers**, **New computer** | [Computers](../subjects/COMPUTERS.md) |
| **Show connectors**, **New connector** | [Connectors](../subjects/CONNECTORS.md) |
| **Show plugins** | [Plugins](../subjects/PLUGINS.md) |
| **Show policies**, **New policy** | [Policies](../subjects/POLICIES.md) |
| **Show users**, **New user**, **New role** | [Users and roles](../subjects/USERS.md) |
| **Open your profile** | [Profile and keys](../subjects/PROFILE.md), when you signed in as a person |
| **Show teams**, **New team**, **New project** | [Teams and projects](../subjects/TEAMS.md) |
| **Show usage** | [Usage](../subjects/USAGE.md) |
