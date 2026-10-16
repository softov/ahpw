import { expect, test } from 'vitest';

import {
  chatReducer,
  sessionReducer,
  SUPPORTED_PROTOCOL_VERSIONS,
  type ChatAction,
  type ChatState,
  type SessionAction,
  type SessionState,
} from '@microsoft/agent-host-protocol';
import type { AhpTransport, JsonRpcMessage, TransportFrame } from '@microsoft/agent-host-protocol/client';
import { MultiHostClient, type HostHandle } from '@microsoft/agent-host-protocol/hosts';

import { offering, offeringEveryVersion, OFFERED_PROTOCOL_VERSIONS } from './protocol-versions.js';

const initialize = {
  jsonrpc: '2.0',
  id: 1,
  method: 'initialize',
  params: { channel: 'ahp-root://', clientId: 'c', protocolVersions: ['1.0.0'] },
};

test('an initialize object offers every supported version and keeps its other params', () => {
  const sent = offeringEveryVersion(initialize);
  expect(sent.params).toEqual({ channel: 'ahp-root://', clientId: 'c', protocolVersions: [...OFFERED_PROTOCOL_VERSIONS] });
  for (const version of SUPPORTED_PROTOCOL_VERSIONS) expect(OFFERED_PROTOCOL_VERSIONS).toContain(version);
  expect(initialize.params.protocolVersions).toEqual(['1.0.0']);
});

test('an initialize offers 1.0.0, 0.10.0 and 0.9.0 in that order', () => {
  expect(offeringEveryVersion(initialize).params.protocolVersions).toEqual(['1.0.0', '0.10.0', '0.9.0']);
});

test('an initialize string is rewritten as a string', () => {
  const sent = offeringEveryVersion(JSON.stringify(initialize));
  expect(typeof sent).toBe('string');
  expect(JSON.parse(sent).params.protocolVersions).toEqual([...OFFERED_PROTOCOL_VERSIONS]);
});

test('any other frame goes as it came', () => {
  const reconnect = { jsonrpc: '2.0', id: 2, method: 'reconnect', params: {} };
  expect(offeringEveryVersion(reconnect)).toBe(reconnect);
  expect(offeringEveryVersion('not json')).toBe('not json');
});

/**
 * A host that speaks only `^0.10.0`, as VS Code 1.141's does. It answers
 * `initialize` with `0.10.0` when offered and refuses otherwise, answers
 * `listSessions` with no sessions, and sends `pushed` after the handshake.
 * Outbound frames pass through `offering`, as the page's transport does.
 */
function vscode141Host(pushed: readonly object[]): AhpTransport {
  return offering(bare(pushed));
}

function bare(pushed: readonly object[]): AhpTransport {
  const inbound: TransportFrame[] = [];
  let wake: (() => void) | null = null;
  let closed = false;
  const push = (message: object) => {
    inbound.push({ kind: 'text', text: JSON.stringify(message) });
    wake?.();
  };
  const answer = (message: JsonRpcMessage | string) => {
    const request = (typeof message === 'string' ? JSON.parse(message) : message) as {
      id?: number;
      method?: string;
      params?: { protocolVersions?: string[] };
    };
    if (request.id === undefined || request.method === undefined) return;
    if (request.method === 'initialize') {
      if (!(request.params?.protocolVersions ?? []).includes('0.10.0')) {
        push({ jsonrpc: '2.0', id: request.id, error: { code: -32005, message: 'unsupported protocol version' } });
        return;
      }
      push({
        jsonrpc: '2.0',
        id: request.id,
        result: {
          protocolVersion: '0.10.0',
          serverSeq: 0,
          snapshots: [{ resource: 'ahp-root://', fromSeq: 0, state: { agents: [] } }],
        },
      });
      for (const message of pushed) push(message);
      return;
    }
    if (request.method === 'listSessions') {
      push({ jsonrpc: '2.0', id: request.id, result: { items: [] } });
      return;
    }
    push({ jsonrpc: '2.0', id: request.id, error: { code: -32601, message: 'not found' } });
  };
  return {
    send: (message) => answer(message),
    close: () => {
      closed = true;
      wake?.();
    },
    async recv() {
      for (;;) {
        const next = inbound.shift();
        if (next !== undefined) return next;
        if (closed) return null;
        await new Promise<void>((resolve) => { wake = resolve; });
        wake = null;
      }
    },
  };
}

async function connected(multi: MultiHostClient, id: string): Promise<HostHandle> {
  for (let tries = 0; tries < 200; tries += 1) {
    const handle = multi.host(id);
    if (handle?.state.status === 'connected') return handle;
    if (handle?.state.status === 'failed') throw handle.state.error;
    await new Promise((resolve) => setTimeout(resolve, 5));
  }
  throw new Error(`host ${id} did not connect`);
}

test('a host that answers 0.10.0 connects', async () => {
  const multi = new MultiHostClient();
  try {
    await multi.addHost({ id: 'vscode', label: 'VS Code 1.141', transportFactory: async () => vscode141Host([]) });
    const handle = await connected(multi, 'vscode');
    expect(handle.protocolVersion).toBe('0.10.0');
  } finally {
    await multi.shutdown();
  }
});

test('canvas actions keep the host connected and the session and chat state usable', async () => {
  const chatUri = 'ahp-chat://s/1';
  const sessionUri = 'ahp-session://s';
  const canvasesChanged = {
    type: 'chat/canvasesChanged',
    canvases: [{ resource: 'ahp-canvas://c/1', title: 'canvas' }],
  } as unknown as ChatAction;
  const stateChanged = {
    type: 'canvas/stateChanged',
    canvas: { title: 'canvas' },
  };
  const envelope = (channel: string, action: object, serverSeq: number) => ({
    jsonrpc: '2.0',
    method: 'action',
    params: { channel, action, serverSeq, origin: undefined },
  });

  const multi = new MultiHostClient();
  const warned: unknown[] = [];
  const warn = console.warn;
  console.warn = (...args: unknown[]) => { warned.push(args); };
  try {
    await multi.addHost({
      id: 'vscode',
      label: 'VS Code 1.141',
      transportFactory: async () => vscode141Host([
        envelope(chatUri, canvasesChanged, 1),
        envelope('ahp-canvas://c/1', stateChanged, 2),
      ]),
    });
    await connected(multi, 'vscode');
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(multi.host('vscode')?.state.status).toBe('connected');

    // The fold `useSession` runs on the two channels a screen holds.
    let chat = { resource: chatUri, title: 't', status: 1, modifiedAt: 'a', turns: [] } as unknown as ChatState;
    chat = chatReducer(chat, canvasesChanged);
    chat = chatReducer(chat, stateChanged as unknown as ChatAction);
    chat = chatReducer(chat, {
      type: 'chat/turnStarted',
      turnId: 'turn-1',
      startedAt: 'a',
      message: { text: 'hello' },
    } as unknown as ChatAction);
    expect(chat.activeTurn?.id).toBe('turn-1');
    expect(chat.canvases?.length).toBe(1);

    const session = { summary: { resource: sessionUri, title: 't', status: 1 } } as unknown as SessionState;
    expect(sessionReducer(session, stateChanged as unknown as SessionAction)).toBe(session);
  } finally {
    console.warn = warn;
    await multi.shutdown();
  }
});
