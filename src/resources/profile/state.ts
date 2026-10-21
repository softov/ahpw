/** A host's profile tab key: one profile per host, as the person is one person on each. */
export const profileTab = (host: string): string => `profile:${host}`;

/** The profile's tabs. */
export type ProfileTabKey = 'info' | 'keys';

/** The tab a profile opens on: the one chosen last, kept while the page lives, as the settings' tab is. */
let chosenTab: ProfileTabKey = 'info';
export const profileTabKey = (): ProfileTabKey => chosenTab;
export function keepProfileTabKey(key: string): void {
  if (key === 'info' || key === 'keys') chosenTab = key;
}
