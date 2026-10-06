/** The keys whose value differs from what the host holds. */
export function changedKeys(held: Record<string, unknown>, edited: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(edited).filter(([key, value]) => JSON.stringify(value) !== JSON.stringify(held[key])));
}
