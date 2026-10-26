# Policies

The rules a host checks work against: which models, agents and computers people may use, and the limits on what they spend. ahpw shows them when the host offers its policies.

## Where it is

The **Policies** icon in the lower part of the activity bar opens the **Policies** list in the left sidebar.

<Shot id="policies-list" alt="The Policies list grouped by kind" />

Each row is one policy, named by its id. The dot is green for allow and red for deny, and hollow when the policy is outside its from and until days. Under the name are its effect, who it holds or what kind it is, what it matches, and its limits, such as "$400.00 a week" or "Unlimited".

Type in "Filter policies" to narrow the list. Limits are read when shown and on **Reload**.

| Action | |
| --- | --- |
| **New policy** | Write a new policy |
| **Reload** | Read the policies again |
| **Group** | **By kind** (the default), **By scope** or **None** |
| **Hosts** | Pick which hosts the list shows, when the window shows several hosts |

Each row's menu has **Open**, and **Delete** when the host takes changes.

The palette has **Show policies** and **New policy**.

## Write a policy

**Open** a policy, or pick **New policy**.

<Shot id="policies-page" alt="A policy page with its form and what its limits used" />

The form comes from the host's own description of a policy. A host that has none shows "This host does not describe how a policy is written." Each field can also be edited as JSON.

- **ID**: on a new policy only. A name unique on the host, with no spaces and no slash.
- A new policy starts as one that allows any model to everybody.

**What the limits used** shows each limit's use so far, when it resets or ends, and for a limit on each member, what each one used.

**Create policy** or **Save** writes it, and stays off while the JSON is not valid. **Cancel** and **Discard changes** drop your edits. **Delete** asks first. Nobody is checked against a deleted policy, and what its limits counted stays in the usage records.

If the host does not take changes to its policies here, the page says so and is read only.

See [Usage](USAGE.md) for what was charged.
