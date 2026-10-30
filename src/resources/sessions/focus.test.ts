import { describe, expect, it } from 'vitest';
import { createScena } from '@softov/scena/core';
import { followFocus, sessionKey, sessionOfKey } from './focus.js';
import { ACTIVE_SESSION } from './state.js';

describe('followFocus', () => {
  it('sets the active session to the focused session tab, and keeps it for any other tab', () => {
    const scena = createScena();
    const follow = followFocus(scena);
    scena.layout.setSurface('main', { visible: true, activeContainerKey: sessionKey('h1', 'echo:/a') });
    expect(scena.store.get(ACTIVE_SESSION)).toEqual({ host: 'h1', resource: 'echo:/a' });
    scena.layout.setSurface('main', { visible: true, activeContainerKey: sessionKey('h2', 'echo:/b') });
    expect(scena.store.get(ACTIVE_SESSION)).toEqual({ host: 'h2', resource: 'echo:/b' });
    scena.layout.setSurface('main', { visible: true, activeContainerKey: 'file:h2:file:///x' });
    expect(scena.store.get(ACTIVE_SESSION)).toEqual({ host: 'h2', resource: 'echo:/b' });
    follow.dispose();
  });
});

describe('sessionOfKey', () => {
  it('reads the host and the resource of a session tab', () => {
    expect(sessionOfKey('session:daemon:ahp-session:/abc')).toEqual({ host: 'daemon', resource: 'ahp-session:/abc' });
  });

  it('keeps every colon of the resource', () => {
    expect(sessionOfKey(sessionKey('h1', 'cofold:/a:b:c'))).toEqual({ host: 'h1', resource: 'cofold:/a:b:c' });
  });

  it('answers null for a tab that is not a session', () => {
    expect(sessionOfKey('bot:h1:nimbo')).toBeNull();
    expect(sessionOfKey('session:new')).toBeNull();
    expect(sessionOfKey('session:h1:')).toBeNull();
    expect(sessionOfKey('session::x')).toBeNull();
  });

  it('answers null for no key', () => {
    expect(sessionOfKey(undefined)).toBeNull();
    expect(sessionOfKey('')).toBeNull();
  });
});
