import { getLocale, translate } from '@softov/scena';
import { totalWords } from '../../bridges/usage.js';
import type { LimitFigure, Measure, Policy, PolicyLimit } from '../../bridges/policies.js';
import { plural } from '../../i18n/locales.js';
import { hoursWord, tokensWord } from '../usage/words.js';

/** An amount in its measure: `$400.00`, `2M tokens`, `30 turns`. */
export function amountWord(measure: Measure, amount: number): string {
  switch (measure) {
    case 'usd': return totalWords({ usd: amount }, getLocale()).cost ?? String(amount);
    case 'tokens': return tokensWord(amount);
    case 'hours': return hoursWord(amount);
    default: return plural(`policies/measure/${measure}`, amount, { n: new Intl.NumberFormat(getLocale()).format(amount) });
  }
}

/** A limit in a line: `$400.00 a week`, `$20.00 a week each`. */
export function limitWord(limit: PolicyLimit): string {
  const each = limit.pool === 'each' ? ` ${translate('policies/limit/each')}` : '';
  return `${translate(`policies/period/${limit.period}`, { amount: amountWord(limit.measure, limit.amount) })}${each}`;
}

/** A row's limits in one line; a row with none is unlimited. */
export function limitsLine(row: Policy): string {
  const limits = row.limits ?? [];
  return limits.length === 0 ? translate('policies/limit/unlimited') : limits.map(limitWord).join(' \u{00B7} ');
}

/** What a row matches, in one line: each value type's values, `*` for a type left out. */
export function matchLine(row: Policy): string {
  const typed = Object.entries(row.match).filter((one): one is [string, string[]] => Array.isArray(one[1]) && one[1].length > 0);
  return typed.length === 0 ? translate('policies/match/any') : typed.map(([type, values]) => `${type}: ${values.join(', ')}`).join(' \u{00B7} ');
}

/** What a scope is called: everybody for `all`, else the scope as the host writes it. */
export function scopeWord(scope: string): string {
  return scope === 'all' ? translate('policies/scope/all') : scope;
}

/** What a kind is called in a group's heading; a kind ahpw has no word for reads as it is. */
export function kindWord(kind: string): string {
  return ['model', 'agent', 'computer'].includes(kind) ? translate(`policies/kind/${kind}`) : kind;
}

/** What one figure used of its amount: `$120.00 of $400.00`, or that the host does not count it yet. */
export function usedWord(figure: Pick<LimitFigure, 'measure' | 'amount' | 'counted'>, used: number | undefined): string {
  if (!figure.counted) return translate('policies/limit/notCounted');
  return translate('policies/limit/used', { used: amountWord(figure.measure, used ?? 0), amount: amountWord(figure.measure, figure.amount) });
}
