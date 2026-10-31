---
title: A browser gets a push
domain: shell
status: draft
priority: medium
created: 2026-10-31
revalidated: 2026-10-31
requires: []
changes: []
creates: []
refs:
  - git://3c5bc7e - the commit of ahpw this plan was checked at
  - file:///github/ahpd.worktrees/web-push/.project/plans/plugin/20261031-0804-a-browser-gets-a-push/plan.md - the ahpd plan this one needs: the `web` device, `push://vapid` and `audience`
  - "[code://src/shell/notify/index.ts#L13-L64](../../../../src/shell/notify/index.ts#L13-L64) - `registerNotifications`, its channels and `notifications.enableAlerts`, the command to copy"
  - "[code://src/shell/notify/browser-channel.ts](../../../../src/shell/notify/browser-channel.ts) - the browser channel: `ALERT_TYPES`, the away rule, and `present`"
  - "[code://src/shell/embed/index.ts#L84-L120](../../../../src/shell/embed/index.ts#L84-L120) - `Embedder`, with its optional members"
  - "[code://src/bridges/data.ts#L546-L560](../../../../src/bridges/data.ts#L546-L560) - `greet`, which runs on every connect"
  - "[code://src/bridges/data.ts#L765](../../../../src/bridges/data.ts#L765) - `new MultiHostClient()`, with no `clientIdStore`"
  - "[code://src/bridges/offers.ts#L66-L81](../../../../src/bridges/offers.ts#L66-L81) - `offersOf`, which reads `ahpd.resourceProviders`"
  - "[code://src/resources/sessions/index.ts#L239-L265](../../../../src/resources/sessions/index.ts#L239-L265) - `ahp.openSession`, which takes a host and a session"
  - "[code://plugin/static.ts#L5-L30](../../../../plugin/static.ts#L5-L30) - the types and the CSP that `ahpw serve` and the daemon both send"
  - npm://@microsoft/agent-host-protocol@1.0.0 - `MultiHostClient` takes `clientIdStore`, a store of one client id per host
  - https://www.w3.org/TR/push-api/ - `PushManager.subscribe()`, `getSubscription()` and `toJSON()`
  - https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerContainer/register - a registration's scope sits under the script's folder
  - https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable - the manifest members
  - https://developer.apple.com/documentation/usernotifications/sending-web-push-notifications-in-web-apps-and-browsers - Safari: a gesture, and no invisible push
  - https://github.com/MicrosoftEdge/WebView2Feedback/issues/308 - the Push API fails in WebView2
---

## Goal

ahpw gets a notification from a host when its tab is closed, through the browser's Web Push service.
Each device chooses whether it hears every session of its person or only the sessions this device opened.
In an embedder such as ahp-desk, ahpw uses no Web Push and hands its alerts to the embedder.

## Reconnaissance

The files read and the patterns to reuse are the `refs` in the frontmatter, each with its note.

### Searches performed

- `ls public; rg -n "serviceWorker|manifest" index.html src` - no service worker, no manifest and no `public/` folder.
- `rg -n "location|search|URLSearchParams" src/main.tsx src/App.tsx` - the page reads nothing from its address.
- `rg -n "clientIdStore" node_modules/@microsoft/agent-host-protocol/dist/client/hosts/multi.d.ts` - the option exists, and its default keeps the id in memory.

### Runtime path

```
command -> read push://vapid -> register sw.js at <base>/push/<host id>/ -> subscribe -> resourceWrite push://devices/<install id>
host push -> push service -> sw.js push event -> showNotification
click -> sw.js notificationclick -> an open window gets a message, or a new window opens <base>/?host=<id>&session=<uri> -> ahp.openSession
embedder: alert -> embedder channel -> embedder.notifications.show
```

### Gaps

- The client id is new on each page load, so a host cannot match a browser device to its sessions after a reload.
- No service worker, so a closed tab gets nothing.
- No route from an address to a session.
- `Not found: a notifications member in Embedder - searched src/shell/embed/index.ts`.

## Answers

| What | Source | Task |
| --- | --- | --- |
| ahpw in an embedder uses no Web Push; the embedder shows ahpw's alerts natively | Softov, 2026-10-31, chose "Desk shows them natively (Recommended)" | 04 |
| A device's setting is `person` or `device`, and the default is `person`; ahpw shows the switch | Softov, 2026-10-31, chose "A setting per device (Recommended)": "ahpd changes the record and the audience check. ahpapp and ahpw each show the switch." | 03 |
| ahpw keeps one client id per host in `localStorage`, as `ahpw.clientId.<host id>` | (defaulted: ahpapp keeps one id per host the same way, and the `device` setting needs a stable id) | 01 |
| One service worker script, `sw.js`, registered once per host at the scope `<base>/push/<host id>/` | (defaulted: a subscription has one `applicationServerKey`, and each host has its own key) | 02, 03 |
| `sw.js` and `manifest.json` are plain files in a new `public/` folder | (defaulted: Vite copies `public/` as it is, and the service worker must keep its name) | 02 |
| The manifest is `manifest.json`, so the existing `.json` type serves it | (defaulted: no new type in `plugin/static.ts`) | 02 |
| A click focuses an open ahpw window and sends it the session; with none open, it opens `<base>/?host=<id>&session=<uri>` | (defaulted: `ahp.openSession` takes a host and a session) | 02 |
| The push commands copy `notifications.enableAlerts`: `notifications.enablePush`, `notifications.disablePush` and `notifications.pushAudience` | [`code://src/shell/notify/index.ts#L36-L64`](../../../../src/shell/notify/index.ts#L36-L64) | 03 |
| A push is turned on for every connected host that serves `push`, and for each host that connects later | (defaulted: ahpapp registers on every host that serves `push`) | 03 |
| On every connect, ahpw writes the device again; with no subscription left, it subscribes again | (defaulted: the page cannot write from the service worker, which has no socket to the host) | 03 |
| The embedder channel uses the away rule of the browser channel | (defaulted: [`code://src/shell/notify/browser-channel.ts`](../../../../src/shell/notify/browser-channel.ts)) | 04 |

## Proposed architecture

- **Data flow** - `src/shell/notify/push.ts` reads `push://vapid`, subscribes and writes `push://devices/<install id>` with `{ platform: 'web', endpoint, keys, lang, audience }`.
- **Event flow** - `greet` calls the push module on each connect. `sw.js` shows each push and handles the click.
- **State flow** - `localStorage` keeps `ahpw.push` (`on` or absent), `ahpw.pushAudience`, `ahpw.pushInstall` and `ahpw.clientId.<host id>`.
- **Layer responsibilities** - `public/sw.js`: push and click · `push.ts`: subscribe and register · `index.ts`: commands · `embed-channel.ts`: alerts to an embedder · `data.ts`: client ids and the connect hook.
- **Source-of-truth files** - [`code://src/shell/notify/index.ts`](../../../../src/shell/notify/index.ts), [`code://src/shell/embed/index.ts`](../../../../src/shell/embed/index.ts)

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - A host keeps this browser's client id](task-01-a-host-keeps-the-client-id.md) | todo | - |
| [02 - A service worker shows a push](task-02-a-service-worker-shows-a-push.md) | todo | - |
| [03 - A browser subscribes to a host's push](task-03-a-browser-subscribes.md) | todo | 01, 02 |
| [04 - An embedder shows ahpw's alerts](task-04-an-embedder-shows-alerts.md) | todo | - |
| [05 - The docs say how to turn push on](task-05-docs.md) | todo | 03, 04 |

## Risks and tradeoffs

- Web Push needs HTTPS, or `localhost`. A remote host served over plain HTTP gets no push.
- Safari revokes the permission when the service worker shows no notification, so `sw.js` shows one for every push.
- Two tabs of one browser share one client id per host after task 01.
- The desk gets no notification while it is closed, because it has no Web Push.

## Resume state

- **Done so far:** drafted 2026-10-31.
- **Next action:** Softov reviews the plan. Build after the ahpd plan's task 02, which serves `push://vapid`.
- **Open questions:** none.
- **Watch out for:**
  - Not checked: what a host does with two connections that give the same client id.
  - Not checked: whether a host id in ahpw is the same after a reload, which the scope and the click address need.
  - Not checked: whether Safari accepts `subscribe()` after an `await` in a command, or only inside the gesture's own handler.
  - Not checked: whether iOS needs more manifest members than the Chromium list.

## Final verification checklist

- [ ] With the tab closed, Chrome and Firefox show a notification when a session waits, and a click opens that session.
- [ ] After a reload, the host still matches the browser to the sessions it opened.
- [ ] `notifications.disablePush` removes the device on every host.
- [ ] `notifications.pushAudience` changes the device's `audience` on every host.
- [ ] In ahp-desk, the push commands are absent and an alert reaches `embedder.notifications`.
- [ ] `pnpm typecheck` and `pnpm test` pass.
