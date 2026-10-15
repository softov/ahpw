/**
 * The versions the page offers a host in `initialize`.
 *
 * The SDK's host runtime offers only `PROTOCOL_VERSION`, though its own
 * `SUPPORTED_PROTOCOL_VERSIONS` also lists the releases it stays compatible
 * with. A host answers with one version in its caret range or refuses, so a
 * `0.9` host such as VS Code's refused a client offering `1.0.0` alone. The
 * transport rewrites the request on its way out (pure).
 *
 * `0.10.0` is the version VS Code 1.141's host speaks, and that host accepts
 * only `^0.10.0`. It is not a published release: VS Code gives it the wire
 * contract of `1.0.0`, and adds only the canvas actions, which the SDK's
 * reducers already fold. A host that answers `0.10.0` is read as a `1.0.0` host.
 */

import { SUPPORTED_PROTOCOL_VERSIONS } from '@microsoft/agent-host-protocol';
import type { AhpTransport } from '@microsoft/agent-host-protocol/client';

/** VS Code 1.141's protocol version, offered after `1.0.0`. */
export const VSCODE_1_141_VERSION = '0.10.0';

/** The versions an `initialize` offers, most preferred first. */
export const OFFERED_PROTOCOL_VERSIONS: readonly string[] = Object.freeze(
  SUPPORTED_PROTOCOL_VERSIONS.flatMap((version) =>
    version === '1.0.0' ? [version, VSCODE_1_141_VERSION] : version === VSCODE_1_141_VERSION ? [] : [version],
  ),
);

/** An `initialize` request offering `OFFERED_PROTOCOL_VERSIONS`; any other frame as it came. */
export function offeringEveryVersion<T>(message: T): T {
  const body = record(typeof message === 'string' ? parsed(message) : message);
  if (body?.method !== 'initialize') return message;
  const params = { ...record(body.params), protocolVersions: [...OFFERED_PROTOCOL_VERSIONS] };
  const rewritten = { ...body, params };
  return (typeof message === 'string' ? JSON.stringify(rewritten) : rewritten) as T;
}

function record(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function parsed(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

/** The same transport, with an `initialize` offering `OFFERED_PROTOCOL_VERSIONS` on its way out. */
export function offering(inner: AhpTransport): AhpTransport {
  return {
    send: (message) => inner.send(offeringEveryVersion(message)),
    close: () => inner.close(),
    recv: () => inner.recv(),
  };
}
