---
title: The host is told the language
domain: hosts
status: active
priority: medium
created: 2026-10-30
revalidated: 2026-10-30
refs:
  - git://19769ec - the commit of `main` the facts were checked at
  - git://cab37d1e - the ahpd plan that reads `locale`, in `.project/plans/host/20261030-1037-host-text-in-the-clients-language/`
  - "[code://src/bridges/protocol-versions.ts#L30-L59](../../../../src/bridges/protocol-versions.ts#L30-L59) - `offeringEveryVersion` and `offering`, which rewrite the outgoing `initialize`, the place to add `locale`"
  - "[code://src/bridges/data.ts#L659](../../../../src/bridges/data.ts#L659) - the transport chain of each host"
  - "[code://src/bridges/data.ts#L693-L706](../../../../src/bridges/data.ts#L693-L706) - `reconnectHost`, which drops the socket and connects again"
  - "[code://src/i18n/messages.ts#L23-L33](../../../../src/i18n/messages.ts#L23-L33) - `setLocale` and `subscribeI18n`, the chosen language and its change"
---

## Goal

A person who reads ahpw in Portuguese reads the host's text in Portuguese too.
ahpw today sends no `locale`, because the AHP multi-host client leaves it out of `initialize`.
After this plan, ahpw sends its language in `initialize` and `reconnect`.
A change of language connects each host again, so the host hears the new one.

## Reconnaissance

The files read and the patterns to reuse are the `refs` in the frontmatter, each with its note.

### Searches performed

- `rg -n "locale" node_modules/@microsoft/agent-host-protocol/dist/client/hosts` - the runtime sends `initialize` and `reconnect` with no `locale`.
- `rg -n "offeringEveryVersion" src` - ahpw already rewrites the outgoing `initialize` in one place.

### Runtime path

```
transport send -> initialize or reconnect -> params.locale = getLocale()
subscribeI18n -> the language changed -> reconnectHost for each connected host
```

### Gaps

- No frame carries `locale`.
- A change of language does not reach a host.

## Answers

| What | Source | Task |
| --- | --- | --- |
| ahpw sends its language as `locale` in `initialize` | Softov, 2026-10-30: plan the host's language | 01 |
| A change of language connects each host again | Softov, 2026-10-30: "Client reconnects" | 01 |
| `reconnect` carries `locale` too, which ahpd reads | Softov, 2026-10-30: "Also on reconnect" | 01 |

## Proposed architecture

- **Data flow** - `offeringEveryVersion` adds `locale: getLocale()` to `initialize` and `reconnect`.
- **Event flow** - `subscribeI18n` calls `reconnectHost` for each connected host when the language changes.
- **Layer responsibilities** - bridges: the frame and the reconnect.
- **Source-of-truth files** - [`code://src/bridges/protocol-versions.ts`](../../../../src/bridges/protocol-versions.ts)

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - ahpw sends its language](task-01-ahpw-sends-its-language.md) | implemented | - |

## Risks and tradeoffs

- A host without the ahpd plan ignores `locale`, and nothing changes there.
- A change of language drops each connection once, which a person sees as a short reconnect.

## Resume state

- **Done so far:** task 01 is implemented. See [implemented.md](implemented.md).
- **Next action:** Softov does the checks in [hosts-locale-checks.md](../../../pending/hosts-locale-checks.md), then the plan closes.
- **Open questions:** none.
- **Watch out for:** the first `subscribeI18n` call at load is not a change, and must not reconnect.

## Final verification checklist

- [ ] The ahpw log shows `locale` in the `initialize` frame.
- [ ] A change to Portuguese reconnects each host, and the new session form comes in Portuguese from a host with the ahpd plan.
