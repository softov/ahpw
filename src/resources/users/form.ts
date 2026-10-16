/**
 * What the user and role forms read out of what a person typed, checked
 * before a host sees it so a typo shows under its field.
 */

import type { Grant } from '../../bridges/people.js';

/** One line of a role's grants that a host would refuse, by its line number from 1. */
export interface GrantProblem {
  line: number;
  text: string;
}

/**
 * A grant's shape, as ahpd's `grantProblem` checks it first: one `:` with
 * something on both sides and no space. Which operations a subject has is the
 * host's to say, so a save it refuses shows its own words.
 */
const GRANT = /^[^\s:]+:[^\s:]+$/;

/** A role's grants out of one grant a line; blank lines are skipped. */
export function parseGrants(text: string): { grants: Grant[]; problems: GrantProblem[] } {
  const grants: Grant[] = [];
  const problems: GrantProblem[] = [];
  text.split('\n').forEach((raw, at) => {
    const line = raw.trim();
    if (line === '') return;
    if (GRANT.test(line)) {
      if (!grants.includes(line as Grant)) grants.push(line as Grant);
    } else problems.push({ line: at + 1, text: line });
  });
  return { grants, problems };
}

/** Whether a record id is one a host takes as a URI's last part: not empty, no `/` or `?`. */
export const isRecordId = (id: string): boolean => id.trim() !== '' && !/[/?\s]/.test(id.trim());
