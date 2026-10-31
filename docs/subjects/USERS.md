# Users and roles

The people a host lets sign in, and the roles that say what each of them may do. ahpw shows them only when the host offers its users, and lets you change them only when your grants allow it.

## Where it is

The **Users** icon in the lower part of the activity bar opens the **Users** list in the left sidebar. The icon is there only when the host offers users, teams, projects or roles.

<Shot id="users-list" alt="The Users list with its Users and Roles groups" />

The list has two groups:

- **Users**: each row is a person, with their roles on the line under the name.
- **Roles**: each row is a role, with "built in" for one of ahpd's own and the number of grants it holds.

Type in "Filter users and roles" to narrow the list. A host that offers no users shows "None of your hosts list users."

| Action | |
| --- | --- |
| **New** | A menu with **New user** and **New role** |
| **Reload** | Read the list from the host again |
| **Hosts** | Pick which hosts the list shows, when the window shows several hosts |

Each row's menu has **Open** and **Delete**. Delete asks first: a deleted user can no longer sign in to the host, and the people who hold a deleted role lose what it grants.

The palette has **New user**, **New role** and **Show users**.

## Change a user

**Open** a user, or pick **New user**, to get the user page.

<Shot id="users-user" alt="A user page with its roles, teams and sign-in" />

- **Id**: on a new user only. It is how they sign in and how the host names them, and it cannot be changed later.
- **Roles**: one pill per role. ✕ takes a role away. **Add a role** offers the host's roles and the built-in ones.
- **Teams and projects**: one row per membership, naming the team and "every project", "the team, without a project" or one project. **Add to a team**, then **Which projects**, adds one. The **primary** chip marks the membership that work naming no team or project is charged to. ✕ takes them out.
- **Sign-in**: **Issuer** is `github` or an issuer URL, and empty removes it. **Roles from** is the issuer's claim that gives roles, such as `groups`.

ahpw never shows a user's token. Make one on the host with `ahpd user token <id>`.

**Create user** or **Save** writes the user. **Cancel** and **Discard changes** drop your edits, and **Delete** removes the user. Taking admin away from yourself asks first, because you may not be able to change users or roles on that host again.

### Keys

An existing user's page has a **Keys** section when the host keeps keys and lets you change users. It lists the extra keys of that user, each limited and revoked on its own, and makes new ones the same way as [Profile and keys](PROFILE.md). Their main secret is still made on the host with `ahpd user token <id>`. If the host refuses the list, only its note shows.

## Change a role

**Open** a role, or pick **New role**, to get the role page. On a new role, **Id** is the name users hold it by, and it cannot be changed later.

<Shot id="users-role" alt="A role page with its grants as controls" />

**Grants** has two views:

- **controls**: one card per subject, which folds open and closed and shows how many of its operations are granted. The **read**, **write** and **all** chips grant a group at once, and the operation chips grant one each. ✕ takes the subject out of the role. **Add subject** adds one, and `*` grants every subject the host has, now and later. A subject the host does not serve now says so.
- **text**: one grant a line, as `subject:operation`, such as `session:write`. The operation is a name, `read`, `write` or `*`. A line that is not a grant is marked, and **controls** stays off until it is fixed.

The subjects and operations come from the host.

ahpd has three built-in roles: `admin`, `member` and `guest`. Saving a built-in writes a role of that name to the host, which then replaces the built-in. Deleting that role brings the built-in back. A built-in that is not replaced has no **Delete**.

**Create role** or **Save** writes the role. **Cancel**, **Discard changes** and **Delete** work as on a user.

## When you cannot change them

If the host does not let you write users or roles, the pages show "This host doesn't allow changes here." and are read only.
