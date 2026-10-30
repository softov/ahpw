---
title: A custom agent is made and edited
created: 2026-10-30
refs:
  - git://47e9215 - the commit of ahpw the facts were checked at
  - "[code://src/resources/agents/Overview.tsx#L104-L109](../../src/resources/agents/Overview.tsx#L104-L109) - the agent page's customizations, drawn only when the host sends some"
  - "[code://src/resources/agents/Customizations.tsx#L84-L115](../../src/resources/agents/Customizations.tsx#L84-L115) - `FileBody` and `DetailModal`, which show a Markdown file read-only"
  - "[code://src/resources/agents/words.ts#L201-L206](../../src/resources/agents/words.ts#L201-L206) - `fileSpotOf`, the file a customization is"
  - "[code://src/resources/agents/words.ts#L226-L235](../../src/resources/agents/words.ts#L226-L235) - `metaOf`, which shows read-only for `writable: false` and reads `writable` nowhere else"
  - "[code://src/resources/files/FilePage.tsx#L35-L75](../../src/resources/files/FilePage.tsx#L35-L75) - the text editor, which saves with `ifMatch` and says when the host refuses"
  - "[code://src/resources/folders/actions.ts#L54-L65](../../src/resources/folders/actions.ts#L54-L65) - `askFor` and `newFile`, which ask a name and write with `createOnly`"
  - "[code://src/bridges/data.ts#L378-L380](../../src/bridges/data.ts#L378-L380) - `writeResource`, with `createOnly`"
  - https://github.com/microsoft/agent-host-protocol/blob/main/types/channels-session/state.ts - `DirectoryCustomization`: a client MAY write into a writable directory with `resourceWrite`
  - https://github.com/microsoft/vscode/blob/171e90619c7/src/vs/workbench/contrib/chat/browser/agentSessions/agentHost/agentCustomizationItemProvider.ts#L200-L234 - `provideSourceFolders`, the writable directory containers VS Code offers for a new file
  - https://github.com/microsoft/vscode/blob/171e90619c7/src/vs/workbench/contrib/chat/browser/promptSyntax/newPromptFileActions.ts#L211-L223 - the Claude agent template VS Code writes
  - file:///github/ahpd/.project/briefs/a-written-agent-shows-without-a-restart.md - the ahpd half, which makes a written agent show without a restart
---

# A custom agent is made and edited

Softov wants to make a custom agent in ahpw and to edit one, as he can from VS Code's Agent Customizations.
ahpw writes the agent file through the host, and the host then lists the new agent.

## What others do

VS Code at `171e90619c7`, on an agent host session:

- The `+` of Agents offers the session's directory containers with `writable: true` and `contents` `agent`.
  A container under a working directory goes in the Workspace group, and any other goes in the User group.
- VS Code asks for a file name, writes its Claude agent template with `resourceWrite`, and opens the file in its editor.
- Each save is one more `resourceWrite`.
- An existing agent opens in the same editor.

The protocol says a client MAY write a new customization into a writable directory, and the host then surfaces the child through the customization actions.

## What ahpw has today

- The agent page draws its customizations in a tree, and only when the host sends some ([`code://src/resources/agents/Overview.tsx`](../../src/resources/agents/Overview.tsx#L104-L109)).
- It reads only the agent's root customizations, `agent.customizations` in root state, which the ahpd daemon's probe fills. It never reads a session's customizations.
- A row opens `DetailModal`. A Markdown file, such as an agent, shows there read-only, without its frontmatter ([`code://src/resources/agents/Customizations.tsx`](../../src/resources/agents/Customizations.tsx#L84-L115)).
- Any other file gets an Open file button, which runs `ahp.openFile` and opens the text editor.
- `writable` is read only to show read-only when it is `false` ([`code://src/resources/agents/words.ts`](../../src/resources/agents/words.ts#L226-L235)).
  No action makes a file in a writable directory.
- The text editor saves with `resourceWrite` and `ifMatch`, and shows when the host refuses the write ([`code://src/resources/files/FilePage.tsx`](../../src/resources/files/FilePage.tsx#L35-L75)).
- The folders view already asks a name and writes an empty file with `createOnly` ([`code://src/resources/folders/actions.ts`](../../src/resources/folders/actions.ts#L54-L65)).

What ahpd sends, from the ahpd brief:

- The Claude backend sends `~/.claude/agents` as a writable directory, but leaves it out when it has no agents.
- A written agent shows only after an ahpd restart.

## Who writes

- No branch or worktree other than `main` exists in ahpw at `47e9215`.
- The custom agent picker plan, `.project/plans/composer/20261028-0951-a-custom-agent-picker`, reads the same customizations for the composer. It does not change the agent page.

## The change

- A writable directory whose `contents` is `agent` gets a New agent action on its row in the Customizations tree.
- A writable directory whose `contents` is `skill` gets a New skill action on its row.
- Commands get no New action for now.
- New agent asks a name with `askFor`, writes ahpw's own agent template with `createOnly`, and opens the file in the editor.
- New skill asks a name, writes ahpw's own skill template as `<name>/SKILL.md` with `createOnly`, and opens the file in the editor.
- An agent or skill file in `DetailModal` gets an Edit button, which opens it in the editor.
- A file in a directory with `writable: false` gets no New action and no Edit.
- The editor opens as a new panel or in a modal. A UI setting chooses, and the default is a new panel.
  The setting copies `ui.botChatOpens`: a `chatChoice` in its resource, listed in [`code://src/shell/ui-settings/settings.ts`](../../src/shell/ui-settings/settings.ts).
- The agent page shows the Customizations section when the host sends only empty writable directories, so New agent is there before the first agent.
- The agent page shows the new agent when the host sends a new root state with it. ahpw adds no reload of its own.

## Answers

| What | Source |
| --- | --- |
| The editor opens as a new panel or a modal, by a UI setting, default a new panel | Softov, 2026-10-30: "can be a new panel. or it can be a ui settings. default for a new panel or a modal." |
| New agent and New skill sit on the writable directory's row | Softov, 2026-10-30: "On the directory row" |
| The empty Customizations section shows | Softov, 2026-10-30: "show the empty section." |
| The templates are ahpw's own | Softov, 2026-10-30: "template... own." |
| Skills get a New action | Softov, 2026-10-30: "skills get a new action too." |
| A plugin file, which the host sends as not writable, gets no Edit | (defaulted: the host refuses the write) |
| Commands get no New action for now | Softov, 2026-10-30: "command I don't think so for now." |

