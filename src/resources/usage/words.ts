import { getLocale, translate } from '@softov/scena';
import { limitWords, type LimitFigure, type Measure } from '../../bridges/policies.js';
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

/** A measure's word after its amount; `usd` is already the currency, so it has none. */
function measureWord(measure: Measure, amount: number, figure: string): string | undefined {
  return measure === 'usd' ? undefined : plural(`usage/limits/measure/${measure}`, amount, { n: figure });
}

/**
 * A limit in one line: what it used of its amount, the period, and when the
 * period resets or the row ends. A measure that is not counted has no figure,
 * so it says that instead.
 */
export function limitLine(figure: LimitFigure): string {
  const words = limitWords(figure, getLocale());
  const unit = measureWord(figure.measure, figure.amount, words.amount);
  const amount = unit === undefined ? words.amount : `${words.amount} ${unit}`;
  return [
    words.used === undefined
      ? (figure.counted ? amount : translate('usage/limits/notCounted'))
      : translate('usage/limits/of', { used: words.used, amount }),
    figure.period === 'total' ? translate('usage/limits/total') : translate(`usage/period/${figure.period}`),
    words.resets === undefined ? undefined : translate('usage/limits/resets', { date: words.resets }),
    words.ends === undefined ? undefined : translate('usage/limits/ends', { date: words.ends }),
  ].filter((one) => one !== undefined).join(' \u{00B7} ');
}
