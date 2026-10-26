# Sign in

Without a token from `ahpw serve`, the page asks for one. Sign in with a token the server accepts: the deployment's token, or a person's token.

<Shot id="sign-in" alt="The sign-in page, asking for a token" />

Each ahpd command checks its own grants. A token that may not run one gets ahpd's refusal, in ahpd's words.

The socket carries the token as `?tkn=`, because a browser cannot set a header on a WebSocket.

A person makes their own keys on their [profile](../subjects/PROFILE.md).
