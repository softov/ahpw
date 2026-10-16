import { describe, expect, it } from 'vitest';
import { computersReducer, computerUri, factsOf, standingOf, type ComputerRecord, type ComputersState } from './machines.js';

const docker = (state: Record<string, unknown>, extra: Record<string, unknown> = {}): ComputerRecord => ({
  state: state.Running === true ? 'running' : 'stopped',
  status: {
    Id: '0123456789abcdef',
    Created: '2026-10-16T10:00:00Z',
    State: { Status: 'running', Pid: 42, OOMKilled: false, ExitCode: 0, StartedAt: '2026-10-16T10:01:00Z', ...state },
    Config: { Image: 'ubuntu:24.04', WorkingDir: '/work', Cmd: ['sleep', 'infinity'] },
    HostConfig: { NetworkMode: 'bridge', Memory: 536870912, NanoCpus: 2e9 },
    Mounts: [{ Source: '/home/me/code', Destination: '/code', RW: false }],
    ...extra,
  },
});

describe('computersReducer', () => {
  const one = docker({ Running: true });
  it('adds, changes and removes a record, keeping the order', () => {
    let state: ComputersState = { records: [] };
    state = computersReducer(state, { type: 'x-ahpd-computers/added', id: 'a', record: one });
    state = computersReducer(state, { type: 'x-ahpd-computers/added', id: 'b', record: one });
    const stopped = docker({ Running: false });
    state = computersReducer(state, { type: 'x-ahpd-computers/changed', id: 'a', record: stopped });
    expect(state.records.map((entry) => entry.id)).toEqual(['a', 'b']);
    expect(state.records[0]!.record).toBe(stopped);
    state = computersReducer(state, { type: 'x-ahpd-computers/removed', id: 'a' });
    expect(state.records.map((entry) => entry.id)).toEqual(['b']);
  });

  it('leaves the state alone on an action it does not know', () => {
    const state: ComputersState = { records: [] };
    expect(computersReducer(state, { type: 'other' } as never)).toBe(state);
  });
});

describe('factsOf', () => {
  it('reads docker inspect', () => {
    expect(factsOf(docker({ Running: true }))).toEqual({
      running: true,
      controlled: true,
      oomKilled: false,
      exitCode: 0,
      image: 'ubuntu:24.04',
      created: '2026-10-16T10:00:00Z',
      startedAt: '2026-10-16T10:01:00Z',
      workdir: '/work',
      command: 'sleep infinity',
      network: 'bridge',
      memoryLimit: 536870912,
      cores: 2,
      mounts: [{ source: '/home/me/code', target: '/code', readOnly: true }],
      containerId: '0123456789abcdef',
      pid: 42,
    });
  });

  it('reads an ssh machine, whose state says whether it runs', () => {
    const facts = factsOf({ state: 'running', status: { id: 'ssh-ish.dev02', destination: 'me@dev02', workdir: '/srv' } });
    expect(facts).toEqual({ running: true, controlled: false, oomKilled: false, mounts: [], workdir: '/srv', destination: 'me@dev02' });
  });
});

describe('standingOf', () => {
  it('is running, a problem when killed or failed, else stopped', () => {
    expect(standingOf(factsOf(docker({ Running: true })))).toBe('running');
    expect(standingOf(factsOf(docker({ Running: false, OOMKilled: true })))).toBe('problem');
    expect(standingOf(factsOf(docker({ Running: false, ExitCode: 137 })))).toBe('problem');
    expect(standingOf(factsOf(docker({ Running: false })))).toBe('stopped');
  });
});

describe('computerUri', () => {
  it('keeps a dotted id whole', () => {
    expect(computerUri('computer://', 'ssh-ish.dev02')).toBe('computer://ssh-ish.dev02');
  });
});
