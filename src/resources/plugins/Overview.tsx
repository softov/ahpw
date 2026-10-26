import type { ReactElement } from 'react';
import { useI18n, useScena } from '@softov/scena/react';
import { Alert, DetailList, Markdown, Text, type DetailItem } from '@softov/scena/ui';
import type { PluginAlert, PluginRow } from '../../bridges/plugins.js';
import { plural } from '../../i18n/locales.js';
import { embedMode } from '../../shell/embed/index.js';
import { HostTag } from '../../shell/explorer/HostLines.js';
import { RemovableChip } from '../../shell/view/RemovableChip.js';
import { categoryWord } from './Explorer.js';
import { PROVIDE_ORDER, providedGroups } from './provides.js';

/** A state that is a problem, and how loud it is. */
const PROBLEM_TONE: Partial<Record<PluginRow['state'], 'danger' | 'warning'>> = { error: 'danger', missing: 'danger', incompatible: 'warning', unconfigured: 'warning' };

/** The alert levels, loudest first, and the tone each is drawn in. */
const ALERT_LEVELS: [PluginAlert['level'], 'danger' | 'warning' | 'info'][] = [['error', 'danger'], ['warning', 'warning'], ['info', 'info'], ['notice', 'info']];

/**
 * What a plugin is: its description and problem, the facts of where it comes
 * from and its links, its categories, its alerts by level, what its contracts say it provides - each
 * opening where ahpw shows it - and its configured spec.
 */
export function Overview({ host, id, row }: { host: string; id: string; row: PluginRow }): ReactElement {
  const scena = useScena();
  const { t } = useI18n();
  const manifest = row.manifest;
  const groups = providedGroups(manifest?.contracts, host);
  const tone = PROBLEM_TONE[row.state];
  // ahpd repeats a configured problem as the load's error; the problem above says it.
  const alerts = (row.alerts ?? []).filter((alert) => alert.text !== row.problem);
  const facts: DetailItem[] = [
    ...(embedMode() === 'multi' ? [{ label: t('common/host'), value: <HostTag host={host} />, span: true }] : []),
    { label: t('plugins/facts/id'), value: id },
    { label: t('plugins/facts/state'), value: t(`plugins/states/${row.state}`) },
    ...(row.version === undefined ? [] : [{ label: t('plugins/facts/version'), value: row.version }]),
    ...(row.loaded === undefined ? [] : [{ label: t('plugins/facts/running'), value: t(row.loaded ? 'plugins/running/yes' : 'plugins/running/no') }]),
    ...(row.module === undefined ? [] : [{ label: t('plugins/facts/module'), value: row.module }]),
    ...(row.path === undefined ? [] : [{ label: t('plugins/facts/path'), value: row.path, span: true }]),
    ...(row.url === undefined ? [] : [{ label: t('plugins/facts/url'), value: row.url, span: true }]),
    ...(manifest?.links ?? []).map((link) => ({
      label: link.title,
      value: <a href={link.url} target="_blank" rel="noreferrer">{link.url}</a>,
      span: true,
    })),
  ];

  return (
    <div className="web-plugin__overview">
      {manifest?.description === undefined ? null : <Markdown text={manifest.description} />}
      {row.problem === undefined ? null : <Alert tone={tone ?? 'warning'} message={row.problem} />}
      <DetailList items={facts} columns={2} />

      {(manifest?.categories ?? []).length === 0 ? null : (
        <div className="web-plugin__tags">
          {(manifest?.categories ?? []).map((category) => <RemovableChip key={category} label={categoryWord(t, category)} removeLabel={category} />)}
        </div>
      )}

      {alerts.length === 0 ? null : (
        <>
          <Text variant="h3" text={t('plugins/page/alerts')} />
          {ALERT_LEVELS.map(([level, alertTone]) => {
            const said = alerts.filter((alert) => alert.level === level);
            return said.length === 0 ? null : (
              <Alert key={level} tone={alertTone} title={plural(`plugins/alerts/${level}`, said.length)}>
                <ul className="web-plugin__alerts">
                  {said.map((alert, at) => (
                    <li key={alert.ref ?? `#${String(at)}`}>
                      {alert.text}
                      {alert.ref === undefined ? null : <code className="web-plugin__entry">{alert.ref}</code>}
                    </li>
                  ))}
                </ul>
              </Alert>
            );
          })}
        </>
      )}

      <Text variant="h3" text={t('plugins/page/provides')} />
      {row.undeclared === true ? <p className="web-note">{t('plugins/page/undeclared')}</p>
        : groups.length === 0 ? <p className="web-note">{t(manifest === undefined ? 'plugins/page/notLoaded' : 'plugins/page/providesNothing')}</p> : (
          <dl className="web-plugin__provides">
            {groups.map((group) => (
              <div key={group.kind} className="web-plugin__provides-row">
                <dt>{(PROVIDE_ORDER as readonly string[]).includes(group.kind) ? t(`plugins/provides/${group.kind}`) : group.kind}</dt>
                <dd>
                  {group.entries.map((entry) => (entry.link === undefined
                    ? <code key={entry.name} className="web-plugin__entry">{entry.name}</code>
                    : (
                      <button key={entry.name} type="button" className="web-link web-plugin__entry" onClick={() => void scena.commands.execute(entry.link!.command, entry.link!.args)}>
                        {entry.name}
                      </button>
                    )))}
                </dd>
              </div>
            ))}
          </dl>
        )}

      <details className="web-record">
        <summary>{t('plugins/page/spec')}</summary>
        <pre>{JSON.stringify(row.spec, null, 2)}</pre>
      </details>
    </div>
  );
}
