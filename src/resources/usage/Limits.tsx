import type { ReactElement } from 'react';
import { getLocale } from '@softov/scena';
import type { UseI18nResult } from '@softov/scena/react';
import { Progress } from '@softov/scena/ui';
import { limitWords, type LimitFigure, type PolicyLimits } from '../../bridges/policies.js';
import type { Row } from '../../shell/explorer/ExplorerList.js';
import { limitLine } from './words.js';

/** What one host answered about the limits that hold the person, or why it did not. */
export type LimitAnswer = { host: string; limits: PolicyLimits[] } | { host: string; error: string };

interface Options {
  multi: boolean;
  hostName: (host: string) => string;
  t: UseI18nResult['t'];
}

/** A limit's words and its meter; a meter only where the measure is counted. */
export function LimitLine({ figure, locale = getLocale() }: { figure: LimitFigure; locale?: string }): ReactElement {
  const words = limitWords(figure, locale);
  return (
    <>
      <span>{limitLine(figure)}</span>
      {figure.counted ? (
        <Progress value={words.fraction * 100} max={100} color={words.full ? 'red' : 'blue'} height={4} style={{ marginTop: 4 }} />
      ) : null}
    </>
  );
}

/** One member's figure under an `each` limit, with their own meter. */
export function MemberLine({ figure, used }: { figure: LimitFigure; used: number }): ReactElement {
  const { resets, ends } = figure;
  return (
    <LimitLine
      figure={{
        amount: figure.amount,
        measure: figure.measure,
        period: figure.period,
        pool: figure.pool,
        counted: figure.counted,
        used,
        from: figure.from,
        ...(resets === undefined ? {} : { resets }),
        ...(ends === undefined ? {} : { ends }),
      }}
    />
  );
}

/** The Limits rows: one for each limit that holds the person, under its own group above the pools. */
export function limitsRows(answers: readonly LimitAnswer[], { multi, hostName, t }: Options): Row[] {
  const group = { key: 'limits', label: t('usage/limits/title') };
  const locale = getLocale();
  return answers.flatMap((answer): Row[] => {
    if ('error' in answer) {
      return [{
        key: `limit|${answer.host}|error`,
        dot: 'failed',
        dotLabel: t('usage/explorer/refused'),
        title: hostName(answer.host),
        group,
        lines: [answer.error],
        menu: [],
      }];
    }
    return answer.limits.flatMap((policy) => policy.limits.map((figure, at) => {
      const words = limitWords(figure, locale);
      return {
        key: `limit|${answer.host}|${policy.id}|${String(at)}`,
        dot: words.full ? 'attention' : 'quiet',
        dotLabel: policy.id,
        title: multi ? `${policy.id} \u{00B7} ${hostName(answer.host)}` : policy.id,
        group,
        lines: [<LimitLine key="line" figure={figure} locale={locale} />],
        menu: [],
      };
    }));
  });
}
