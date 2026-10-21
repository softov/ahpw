import { describe, expect, it } from 'vitest';
import { createScena } from '@softov/scena/core';
import { ahpPaths, windowHost } from '../bridges/data.js';
import { NO_OFFERS } from '../bridges/offers.js';
import { MANAGE_SLOT, profileEntryTitle, registerManage } from './manage.js';

/** The Manage menu's ids, in its order, as it lists for the principal given. */
function menuAs(principal: string | undefined, embedded = false): string[] {
  const scena = createScena();
  scena.store.set(ahpPaths(windowHost()).offers, { ...NO_OFFERS, ...(principal === undefined ? {} : { principal }) });
  registerManage(scena, embedded);
  return scena.commands.list({ slot: MANAGE_SLOT, enabled: true }).map((one) => one.id);
}

describe('the Manage menu', () => {
  it('lists the person just before Sign out', () => {
    const ids = menuAs('user:ana');
    expect(ids.slice(-2)).toEqual([`ahp.manage.profile.${windowHost()}`, 'ahp.manage.signOut']);
  });

  it('has no profile entry for the host itself, or for nobody', () => {
    expect(menuAs('root:dev').some((id) => id.startsWith('ahp.manage.profile.'))).toBe(false);
    expect(menuAs(undefined).some((id) => id.startsWith('ahp.manage.profile.'))).toBe(false);
  });

  it('keeps the profile entry in an embedder, which has no Sign out', () => {
    expect(menuAs('user:ana', true).at(-1)).toBe(`ahp.manage.profile.${windowHost()}`);
  });
});

describe('profileEntryTitle', () => {
  it('is the id alone with one host, and names the host with several', () => {
    expect(profileEntryTitle('ana', 'dev', 1)).toBe('ana');
    expect(profileEntryTitle('ana', 'dev', 2)).toBe('ana \u{00B7} dev');
  });
});
