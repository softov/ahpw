/**
 * The keys whose value differs from what the host holds. A key the host holds
 * that the edit no longer has is sent as `null`, which is how the root channel
 * takes a key back (decision: a key taken out of the settings is sent as null).
 */
export function changedKeys(held: Record<string, unknown>, edited: Record<string, unknown>): Record<string, unknown> {
  const changed = Object.entries(edited).filter(([key, value]) => JSON.stringify(value) !== JSON.stringify(held[key]));
  const taken = Object.keys(held).filter((key) => !Object.hasOwn(edited, key)).map((key): [string, null] => [key, null]);
  return Object.fromEntries([...changed, ...taken]);
}
