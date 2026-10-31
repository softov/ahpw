---
title: A browser gets a push
---

Plan: [a browser gets a push](../plans/shell/20261031-0804-a-browser-gets-a-push/plan.md).

- [ ] Against an ahpd with the push plan, run **Notify me when this tab is closed** in Chrome, and check that `push://devices` has the browser.
- [ ] Close the tab, start a turn that waits on you from another client, and check that a notification shows.
- [ ] Click it, and check that ahpw opens on that session.
- [ ] With a tab open but hidden, click a notification, and check that the open tab shows the session.
- [ ] Do the same in Firefox.
- [ ] Reload, and check that the host still matches the browser to the sessions it opened.
- [ ] Switch to **Notify me only about sessions this device opened**, and check that a session from another client sends nothing.
- [ ] Run **Stop notifications when this tab is closed**, and check that the device leaves `push://devices`.
- [ ] In Safari, run the enable command, and check that it subscribes.
- [ ] In ahp-desk with a fake `notifications`, check that the push commands are absent and a waiting session reaches `show`.

The checks need a browser push service and a real host, so they wait for Softov.
