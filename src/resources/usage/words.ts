import { getLocale, translate } from '@softov/scena';
import { totalWords, type UsageTotal } from '../../bridges/usage.js';
import { plural } from '../../i18n/locales.js';

/** A total in one line: cost, tokens, calls and computer hours, each only when the host sent it. */
export function totalLine(total: UsageTotal): string {
  const words = totalWords(total, getLocale());
  return [
    words.cost,
    total.tokens === undefined ? undefined : tokensWord(total.tokens),
    words.calls === undefined ? undefined : plural('usage/total/calls', total.calls ?? 0, { n: words.calls }),
    total.hours === undefined ? undefined : hoursWord(total.hours),
  ].filter((one) => one !== undefined).join(' \u{00B7} ');
}

/** Tokens, compact: `12K tokens`. */
export function tokensWord(tokens: number): string {
  return plural('usage/total/tokens', tokens, { n: totalWords({ tokens }, getLocale()).tokens });
}

/** Computer time: `1.5 h`. */
export function hoursWord(hours: number): string {
  return translate('usage/total/hours', { count: totalWords({ hours }, getLocale()).hours });
}

/** What a pool key's kind is called; a kind ahpw has no word for reads as it is. */
export function kindWord(kind: string): string {
  return ['user', 'team', 'project', 'root', 'plugin'].includes(kind) ? translate(`usage/kind/${kind}`) : kind;
}
