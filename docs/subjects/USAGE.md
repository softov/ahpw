# Usage

What the host charged, by user, team, project, host or plugin, and the limits that hold you. Usage is read only.

## Where it is

The **Usage** icon in the lower part of the activity bar opens the **Usage** list in the left sidebar. The icon is there only when the host keeps usage. What you see depends on your grants.

<Shot id="usage-pool" alt="The Usage list with limits and pools" />

The list starts with **Limits**, your limits as meters, red when one is full. Then come the pools, grouped by kind and sorted by cost. Each line reads cost, tokens, calls and hours, or "Nothing charged". A host that refuses shows under **Not read**.

Type in "Filter usage" to narrow the list. Usage and limits are read when shown and on **Reload**, not as they change.

| Action | |
| --- | --- |
| **Reload** | Read usage again |
| **Period** | **Today**, **This week**, **This month** (the default) or **Range**, which adds **From** and **Until** |
| **Group** | **By user**, **By team** and **By project**, which combine |
| **Hosts** | Pick which hosts the list shows, when the window shows several hosts |

This browser remembers the period and grouping.

The palette has **Show usage**.

## A pool

A row's **Open** opens its pool. A sum by several keys has nothing to open.

<Shot id="usage-records" alt="A pool page with totals and its records" />

The title opens the owner's user, team or project page. Under it are the totals for **Today**, **This week** and **This month**, and **Over a range** with **From** and **Until**.

**Records** lists each charge, newest first: when, the model or computer, the tokens or hours, the cost, and **Open session**. Click a record to see all of it:

| Group | |
| --- | --- |
| **Origin** | Source, kind, model, provider, agent, computer and owner |
| **Tokens** or **Time** | Input, output, cache read and cache written, or the hours |
| **Cost** | What was charged, and what the provider said it cost |
| **Where** | The session, chat, turn, team, project and pools it went to |

See [Policies](POLICIES.md) for the limits themselves.
