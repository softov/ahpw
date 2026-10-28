---
title: Sign-in from the connector form, and what a connector serves, checks by hand
plans:
  - plans/plugins/09-a-connector-signs-in-from-its-form/plan.md
  - plans/plugins/20261028-2151-a-connector-page-says-what-it-serves/plan.md
refs:
  - "[code://src/resources/connectors/SignInStep.tsx](../../src/resources/connectors/SignInStep.tsx) - the button, the code step and the done step"
  - "[code://src/resources/connectors/Models.tsx](../../src/resources/connectors/Models.tsx) - the Models tab"
  - file:///github/ahpd/.project/pending/plugin-71-sign-in-checks.md - step 10, the host side of this check
---

Run these in the real app, against a host that serves the OpenRouter adapter with `signIn`.
Do each check at two window widths, in the light theme and the dark theme.

1. Open **New connector** and pick an adapter with no `signIn`. Make sure the form shows no sign-in button.
2. Pick the OpenRouter adapter. Make sure the form shows "Sign in with OpenRouter" and the note under it.
3. Fill the id and the owner, then click the button. Make sure a new tab opens on the provider's page.
4. Make sure the step shows the code field, **Finish**, **Cancel** and the "Open the page again" link.
5. Paste the code and click **Finish**. Make sure the form closes and the connector page shows "Ready".
6. Open the wire log. Make sure the `signin-finish` frame shows `••••••` for the code, and the `signin` frame hides each config string.
7. Start again and paste a wrong code. Make sure the alert shows the host's error, with no code in it.
8. Open **Settings** on the made connector and sign in again. Make sure the form shows "Signed in with OpenRouter", the state and **Sign in again**.
9. Load the app and make sure the browser console shows no error from the wire log or the connectors bridge.
10. Run an ahpd that serves `x-ahpd/connectors/models`. Open the connector page. Make sure **Overview** shows **Last check**.
11. Open **Models**. Make sure the list shows the models with context and price, and **Copy** copies the name.
12. Sign in as a person whose policy refuses a model. Make sure that row is dimmed and its tooltip says why.
