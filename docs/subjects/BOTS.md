# Bots

A bot is a named agent with its own look and instructions that you chat with. Bots float at the edges of the window, and each one has a chat of its own. The host keeps the bots and runs their chats.

## Where it is

Bots has the 👾 icon in the activity bar. It shows while a host serves bots, which ahpd does. The sidebar lists the bots; a bot, its form and its chat open as pages in the main area.

From the [Command palette](../use/PALETTE.md): **Show bots** and **New bot**.

## The list

Each row shows the bot's figure, its name, the host and its labels, and its description. Type in **Filter bots** to narrow the list.

The section header has **New bot** (+), **Reload**, and **Hosts** when there are several.

Right-click a row for its menu:

| Action | |
|---|---|
| **Open** | Opens its page. |
| **Open chat** | Opens your chat with it. |
| **Edit** | Opens the form. |
| **Delete** | Deletes it after you confirm. Its name cannot be given to another bot on this host. |

<Shot id="bots-list" alt="The bots list in the sidebar" />

## The page

The page shows the bot's figure, name and description, with **Open chat**, **Edit** and **Delete**. The facts list its **Labels**, **Owner**, **Agent**, **Model**, **Computer**, **Workspace**, and when it was created and changed. Its **Instructions** come last.

## Make or edit one

**New bot** and **Edit** open the same form.

| Field | |
|---|---|
| **Colour** | One of the swatches. |
| **Body** | One of the bodies, or a name typed in **Body name**. A body ahpw does not know is drawn as a square. |
| **Host** | Which host keeps it. New bots only, with more than one host. |
| **Name** | Its name. An empty name, or the one the old body gave, follows the body when you change it; a name you typed stays. |
| **Owner** | **Me** or **This host**, when the host lets you pick. A bot keeps its owner, so it cannot change on edit. |
| **Labels** | Separated by commas. |
| **Description** | A line about it. |
| **Instructions** | What the bot is told in its first chat. A change reaches the next chats, not the one already started. |

A new bot starts with a random look. **Create** or **Save** sends it; **Cancel** closes the form.

## Chat

**Open chat** opens your own chat with the bot, started the first time you open it. It is a [session](SESSIONS.md) drawn as message bubbles: the bot's replies carry its name and figure. A file in a reply has a row that saves it. Questions and approvals the agent asks are drawn in the bubble, where you answer them.

While it works, the chat says so; type in the box at the bottom to send the next message. The header has the session's buttons and the raw view.

If you may not chat with the bot, or the host does not run bot chats, the page says so.

<Shot id="bots-chat" alt="A chat with a bot, drawn as bubbles" />

## Bots at the window edges

The bots of every shown host sit in small groups at the edges of the window. A group draws a few bots and a count of the rest; click the count for the full list.

| Do this | What happens |
|---|---|
| Point at a bot | It looks up. |
| Click it, or press Enter on it | A popover opens with its name, labels and description. Click the name to open the bot. Type in **Say something to** and **Send** to send a message; the chat then opens. |
| Right-click it, or press and hold | A menu with **Open chat**, **Open bot**, **Edit** and **Delete**. |
| Drag it | It moves to the nearest edge, or joins the group you drop it on. |
| Hold, then drag | The whole group moves. |

A bot whose chat is on screen leaves its place, and comes back when the chat is closed. Where the bots rest is kept in this browser.

<Shot id="bots-edges" alt="Bots resting in a group at the edge of the window" />
