/** An object read without trusting its variant. */
function bag(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {};
}

/**
 * A value out of ahpd's own `_meta`, under `ahpd.<name>` first and the bare
 * `name` an older ahpd sent second. Another host sends neither, which reads as
 * `undefined`.
 */
export function ahpdKey(meta: unknown, name: string): unknown {
  const held = bag(meta);
  return `ahpd.${name}` in held ? held[`ahpd.${name}`] : held[name];
}
