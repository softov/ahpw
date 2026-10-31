# Agents

An agent is what runs a session: a provider the host serves, such as a coding agent. This page lists the host's agents, shows what each can do, and lets you add and set up agents when the host supports it.

## Where it is

Agents has the 🤖 icon at the bottom of the activity bar. It is always there. The sidebar lists the agents; an agent opens as a page in the main area.

From the [Command palette](../use/PALETTE.md): **Show agents**, and **New agent** when the host lets you add agents.

<Shot id="agents-list" alt="The agents list in the sidebar" />

## The list

The list joins two things the host says: the agents it serves now, and the agent records it keeps (on ahpd). So an agent can be:

| Status | |
|---|---|
| **configured** | It has a record and the host serves it. |
| **standalone** | The host serves it, with no record behind it. |
| **standby** | It has a record the host does not serve: its engine is not loaded, or its settings do not fit the engine. |

Each row shows the agent's icon and name, then a line with its status, owner, why it is on standby, how many models and sessions it has, and **needs sign-in** when it does. The description comes last. With several hosts, the row also names the host.

Type in **Filter agents** to narrow the list. A host with no agents shows "This host doesn't offer any agents."

Right-click a row for **Open** and **New session**. **New session** shows only for an agent the host serves, and starts a session with it in [Sessions](SESSIONS.md).

## The page

The head shows the status, **Needs sign-in** when the agent asks for it, and a **New session** button. A standby agent shows why it is not served.

An agent with a record has two tabs, **Overview** and **Settings**. An agent with no record shows only the overview.

<Shot id="agents-page" alt="An agent page on its Overview tab" />

### Overview

The facts name the provider, engine, owner and plugin, the state (**Ready**, **Invalid** or **Unavailable**, with the last health check), the models, the sessions, and what it can do, such as "Multiple chats per session, with forks" or "One chat in one folder per session".

| Section | |
|---|---|
| **Models** | Each model's name, id and limits. A model can be marked "Turned off by a policy" or "Not set up". An agent that lists no models picks its own. |
| **Customizations** | The plugins, folders and MCP servers the agent loads, as a tree. Click one to see it, with **Copy the name**, **Copy the description** and **Open file**; a Markdown file is shown in place. |
| **Sign-in** | The resources it asks you to sign in to, with their scopes, and whether each is required or optional. |

### Settings

The top line says when the agent was last checked, or "Not checked yet". **Check** asks the host to check it now.

Below is the agent's form, drawn from what its engine takes. **Save** sends it, **Reset** goes back to what the host holds. **Remove** deletes the record after you confirm: the host stops serving the agent and forgets its secrets, and you cannot undo it.

## Add an agent

**New agent** (the + on the section header) opens a form. It shows only while the host serves engines, which ahpd does.

| Field | |
|---|---|
| **Engine** | What runs the agent. Type in **Search engines** to find one. |
| **Start from** | One of the engine's templates, or **Blank**. |
| **Name** | Its name. |
| **Id** | Lowercase letters, digits and dashes. It follows the name until you type one. It cannot change later. |
| **Owner** | **Me**, **The host**, or a team or user you may name. |
| **Description** | Shown under the name in the list. |
| **Model** | Leave empty and the agent picks its own. |

Below come the engine's own settings. **Create** makes the agent and opens its page.

If the host lists no engines, the form says "This host doesn't list any engines." If you may not add one, it says "You don't have permission to add agents on this host."
