/** One value a capability takes, read from its `input` schema. */
export interface CapabilityInput {
  name: string;
  /** The JSON type, `enum` for a choice, or nothing when the schema names none. */
  type?: string;
  required: boolean;
  description?: string;
}

/** The values a capability's `input` schema names, in its own order. */
export function inputsOf(schema: Record<string, unknown> | undefined): CapabilityInput[] {
  const properties = schema?.['properties'];
  if (typeof properties !== 'object' || properties === null) return [];
  const required = new Set(Array.isArray(schema?.['required']) ? schema['required'].filter((one): one is string => typeof one === 'string') : []);
  return Object.entries(properties as Record<string, unknown>).map(([name, value]) => {
    const field = typeof value === 'object' && value !== null ? value as Record<string, unknown> : {};
    const type = Array.isArray(field['enum']) ? 'enum'
      : typeof field['type'] === 'string' ? field['type']
        : Array.isArray(field['type']) ? field['type'].filter((one) => one !== 'null').join(' | ')
          : undefined;
    const description = typeof field['description'] === 'string' && field['description'] !== '' ? field['description']
      : typeof field['title'] === 'string' && field['title'] !== '' ? field['title'] : undefined;
    return { name, required: required.has(name), ...(type === undefined || type === '' ? {} : { type }), ...(description === undefined ? {} : { description }) };
  });
}
