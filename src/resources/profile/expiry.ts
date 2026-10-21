/** How long a new key lasts: never, a number of days, or until a day the person picks. */
export const EXPIRY_CHOICES = ['never', '7', '30', '90', '365', 'date'] as const;
export type ExpiryChoice = typeof EXPIRY_CHOICES[number];

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * When a key made `now` stops, in epoch milliseconds, as a mint takes it;
 * undefined for one that never does, and for `date` with no day picked. A
 * picked day `2026-12-31` lasts to the end of that day where the person is,
 * not to midnight UTC.
 */
export function expiresAt(choice: ExpiryChoice, day: string, now: number): number | undefined {
  if (choice === 'never') return undefined;
  if (choice === 'date') {
    const parts = /^(\d{4})-(\d{2})-(\d{2})$/.exec(day);
    if (parts === null) return undefined;
    return new Date(Number(parts[1]), Number(parts[2]) - 1, Number(parts[3]), 23, 59, 59, 999).getTime();
  }
  return now + Number(choice) * DAY_MS;
}
