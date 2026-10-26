# Profile and keys

What a host knows about you, and the keys you make to sign in to it from elsewhere. There is one profile per host you are signed in to as a person.

## Where it is

There is no activity bar icon. Open the **Manage** gear at the foot of the activity bar and pick your id in its account group. With several hosts each entry names the host too. The palette has **Open your profile**, which opens it for the first host you are signed in to.

The profile opens as a **Profile** tab with two tabs of its own, **Info** and **Keys**.

A connection that is not signed in as a person has no profile, and the page says so.

## Info

<Shot id="profile-info" alt="The Info tab with roles, teams, usage and limits" />

Info is read only. ahpd lets a person read their own record.

- **Roles**: the roles you hold.
- **Teams and projects**: your memberships, with the primary one marked.
- **Sign-in**: **Issuer**, or "This host's own", and **Roles from**.
- **Usage**: what was charged to you **Today**, **This week** and **This month**. It shows only when the host keeps usage.
- **Limits**: the limits that hold you, each with a meter, or "No limits hold you."

Each part is read on its own, so one that fails does not hide the rest.

## Keys

A key is a secret you use to sign in to the host, limited and revoked on its own. The tab needs a host that keeps keys. Otherwise it shows "This host keeps no keys."

<Shot id="profile-keys" alt="The Keys tab with the new key form and the key list" />

**New key** opens a form:

| Field | |
| --- | --- |
| **Label** | What it is for, so the list can tell it apart, such as laptop or ci |
| **Expires** | In 7 days, 30 days, 90 days (the default) or a year, **Never**, or **On a day** with a date |
| **Grants** | **Every grant you hold**, or pick from the grants your record lists |

A grant a role gives you at sign-in is not in the pick list. A key with every grant follows your roles as they change.

**Make key** makes it. The host shows the secret this once and keeps only its hash, so use **Copy the secret** before **Done**.

The list shows the newest key first, with its label or "Unnamed key", its grants, and when it was made and expires. **Revoke** asks first, then whatever uses the key can no longer sign in with it.

If the host refuses the list, for example when you signed in with a key made here, the tab shows the host's answer and no **New key**.
