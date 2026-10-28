import type { ConnectorModel } from '../../bridges/connectors.js';

/** Whether a model's id or name holds every word of a search, ignoring case. The proxy name is left out: its prefix is the same on every row. */
export function matches(model: ConnectorModel, query: string): boolean {
  const words = query.toLowerCase().split(/\s+/).filter((one) => one !== '');
  const text = `${model.id} ${model.name ?? ''}`.toLowerCase();
  return words.every((word) => text.includes(word));
}

/** A price per token as dollars per million tokens, such as `$3` or `$0.15`; nothing when the provider sent none, or not a number. */
export function perMillion(perToken: string | undefined, locale: string): string | undefined {
  if (perToken === undefined || perToken === '') return undefined;
  const dollars = Number(perToken) * 1_000_000;
  if (!Number.isFinite(dollars) || dollars < 0) return undefined;
  return new Intl.NumberFormat(locale, { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: dollars < 1 ? 3 : 2 }).format(dollars);
}

/** A model's price as prompt over answer per million tokens, such as `$3 / $15`; nothing when it has neither. */
export function priceLine(model: ConnectorModel, locale: string): string | undefined {
  const prompt = perMillion(model.pricing?.prompt, locale);
  const completion = perMillion(model.pricing?.completion, locale);
  if (prompt === undefined && completion === undefined) return undefined;
  return `${prompt ?? '-'} / ${completion ?? '-'}`;
}
