import { useEffect, useState, type ReactElement } from 'react';
import { useI18n, useScena, useStore } from '@softov/scena/react';
import { Alert, Button, DetailList, Spinner, Text, type DetailItem } from '@softov/scena/ui';
import { useChannel } from '../../bridges/channel.js';
import { ahpPaths } from '../../bridges/data.js';
import { NO_OFFERS, type Offers } from '../../bridges/offers.js';
import {
  POLICIES, policiesReducer, policyLimits, putPolicy, servesPolicies, writesPolicies,
  type PoliciesState, type Policy, type PolicyLimits,
} from '../../bridges/policies.js';
import { Field } from '../../shell/view/Field.js';
import { PageAlert } from '../../shell/view/PageAlert.js';
import { LimitLine, MemberLine } from '../usage/Limits.js';
import {
  choicesOf, draftOf, fitLimits, matchTypesFor, measuresFor, policyBody, problemsOf, withValue,
  type LimitDraft, type PolicyDraft,
} from './form.js';
import { policyTab, POLICIES_ASKED } from './state.js';

/** A value's word in a catalog group, or the value itself when the catalog has none. */
type Word = (what: string, value: string) => string;

/** A policy's fields as a read-only list, for a host that does not take writes. */
function factsOf(record: Policy, word: Word, t: (key: string) => string): DetailItem[] {
  const match = Object.entries(record.match).filter(([, values]) => (values?.length ?? 0) > 0);
  return [
    { label: t('policies/policy/kind'), value: word('kind', record.kind) },
    { label: t('policies/policy/effect'), value: word('effect', record.effect) },
    { label: t('policies/policy/scope'), value: record.scope },
    {
      label: t('policies/policy/match'),
      value: match.length === 0
        ? t('policies/policy/noMatch')
        : match.map(([type, values]) => `${word('match', type)}: ${(values ?? []).join(', ')}`).join('; '),
    },
    ...(record.pool === undefined ? [] : [{ label: t('policies/policy/pool'), value: record.pool }]),
    { label: t('policies/policy/cap'), value: record.cap === true ? t('policies/policy/yes') : t('policies/policy/no') },
    ...(record.from === undefined ? [] : [{ label: t('policies/policy/from'), value: record.from }]),
    ...(record.until === undefined ? [] : [{ label: t('policies/policy/until'), value: record.until }]),
  ];
}

/** One policy: its fields, its limits with what each used, and the form that edits it. */
export default function PolicyPage({ host, policy: id }: { host: string; policy?: string }): ReactElement {
  const scena = useScena();
  const { t } = useI18n();
  const fresh = id === undefined;
  const offers = useStore<Offers>(ahpPaths(host).offers) ?? NO_OFFERS;
  const channel = useChannel<PoliciesState>(host, servesPolicies(offers) ? POLICIES.channel : undefined, policiesReducer);
  const asked = useStore<number>(POLICIES_ASKED) ?? 0;
  const [draft, setDraft] = useState<PolicyDraft | null>(null);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const [limits, setLimits] = useState<PolicyLimits | null>(null);
  const [limitsError, setLimitsError] = useState<string | null>(null);
  const [saves, setSaves] = useState(0);
  const manifest = offers.providers[POLICIES.scheme]?.manifest;
  const writes = writesPolicies(offers);

  // A limit has no channel, so the page reads it when it shows, on reload, and after a save.
  useEffect(() => {
    if (id === undefined) {
      setLimits(null);
      setLimitsError(null);
      return;
    }
    let live = true;
    setLimits(null);
    setLimitsError(null);
    void policyLimits(host, offers, id).then(
      (held) => { if (live) setLimits(held); },
      (caught: unknown) => { if (live) setLimitsError(caught instanceof Error ? caught.message : String(caught)); },
    );
    return () => { live = false; };
  }, [host, offers, id, asked, saves]);

  const word: Word = (what, value) => {
    const key = `policies/${what}/${value}`;
    const words = t(key);
    return words === `{${key}}` ? value : words;
  };

  if (channel.error !== null) return <PageAlert tone="danger" title={t('policies/notices/none')} message={channel.error} />;
  if (fresh && !servesPolicies(offers)) return <PageAlert tone="warning" message={t('policies/page/noCreate')} />;
  if (writes && manifest === undefined) return <Spinner label={t('policies/notices/reading')} />;
  if (channel.state === undefined) return <Spinner label={t('policies/notices/reading')} />;
  const record = fresh ? undefined : channel.state.records.find((one) => one.id === id)?.record;
  if (!fresh && record === undefined) return <PageAlert tone="warning" message={t('policies/notices/gone')} />;
  if (fresh && !writes) return <PageAlert tone="warning" message={t('policies/page/noCreate')} />;

  const choices = choicesOf(manifest);
  const start = draftOf(record, manifest);
  const shown = draft ?? start;
  const measures = measuresFor(manifest, shown.kind);
  const types = matchTypesFor(manifest, shown.kind);
  const problems = problemsOf(shown, fresh);
  const dirty = draft !== null && JSON.stringify(draft) !== JSON.stringify(start);
  const ready = writes && !busy && !problems.any && (fresh || dirty);

  const set = (change: Partial<PolicyDraft>): void => setDraft((held) => ({ ...(held ?? start), ...change }));
  const setMatch = (type: string, text: string): void => set({ match: { ...shown.match, [type]: text } });
  const setLimit = (at: number, change: Partial<LimitDraft>): void => set({
    limits: shown.limits.map((one, index) => (index === at ? { ...one, ...change } : one)),
  });
  const addLimit = (): void => set({
    limits: [...shown.limits, { amount: '', measure: measures[0] ?? '', period: choices.periods[0] ?? '', pool: choices.pools[0] ?? '' }],
  });
  const dropLimit = (at: number): void => set({ limits: shown.limits.filter((_, index) => index !== at) });
  const changeKind = (kind: string): void => {
    const allowed = matchTypesFor(manifest, kind);
    set({
      kind,
      match: Object.fromEntries(allowed.map((type) => [type, shown.match[type] ?? ''])),
      limits: fitLimits(shown.limits, measuresFor(manifest, kind)),
    });
  };

  const save = async (): Promise<void> => {
    if (!ready) return;
    setBusy(true);
    setFailure(null);
    const target = shown.id.trim();
    try {
      await putPolicy(host, offers, target, policyBody(shown), fresh);
      setDraft(null);
      setSaves((held) => held + 1);
      if (fresh) {
        scena.surfaces.close(policyTab(host, undefined));
        void scena.commands.execute('ahp.openPolicy', { host, id: target });
      }
    } catch (caught) {
      setFailure(caught instanceof Error ? caught.message : String(caught));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={writes ? 'web-page web-form' : 'web-page'}>
      <Text variant="h2" text={fresh ? t('policies/commands/newPolicy') : (id ?? '')} />
      {writes ? null : <p className="web-note">{t('policies/notices/readOnly')}</p>}

      {writes ? (
        <>
          {fresh ? (
            <Field label={t('policies/policy/id')} hint={t('policies/policy/idHint')}>
              <input className="web-field" value={shown.id} autoFocus onChange={(event) => set({ id: event.target.value })} />
              {problems.id ? <span className="web-input__hint">{t('policies/policy/idEmpty')}</span> : null}
            </Field>
          ) : null}

          <Field label={t('policies/policy/scope')} hint={t('policies/policy/scopeHint')}>
            <input className="web-field" value={shown.scope} onChange={(event) => set({ scope: event.target.value })} />
            {problems.scope ? <span className="web-input__hint">{t('policies/policy/scopeEmpty')}</span> : null}
          </Field>

          <Field label={t('policies/policy/kind')}>
            <select className="web-field" value={shown.kind} onChange={(event) => changeKind(event.target.value)}>
              {withValue(choices.kinds, shown.kind).map((value) => <option key={value} value={value}>{word('kind', value)}</option>)}
            </select>
          </Field>

          <Field label={t('policies/policy/effect')}>
            <select className="web-field" value={shown.effect} onChange={(event) => set({ effect: event.target.value })}>
              {withValue(choices.effects, shown.effect).map((value) => <option key={value} value={value}>{word('effect', value)}</option>)}
            </select>
          </Field>

          {types.map((type) => {
            const bad = problems.match[type] ?? [];
            return (
              <Field key={type} label={word('match', type)} hint={t('policies/policy/matchHint')}>
                <textarea className="web-field" rows={2} value={shown.match[type] ?? ''} onChange={(event) => setMatch(type, event.target.value)} />
                {bad.length === 0 ? null : <span className="web-input__hint">{bad.map((line) => t('policies/policy/emptyLine', { line })).join(' ')}</span>}
              </Field>
            );
          })}

          <div className="web-form__field" role="group" aria-label={t('policies/policy/limits')}>
            <span className="web-input__label">{t('policies/policy/limits')}</span>
            {shown.limits.length === 0 ? <span className="web-input__hint">{t('policies/policy/noLimits')}</span> : shown.limits.map((one, at) => (
              <div key={at} className="web-input__row">
                <input
                  className="web-field"
                  type="number"
                  min={0}
                  step="any"
                  value={one.amount}
                  aria-label={t('policies/policy/amount')}
                  onChange={(event) => setLimit(at, { amount: event.target.value })}
                />
                <select className="web-field" value={one.measure} aria-label={t('policies/policy/measure')} onChange={(event) => setLimit(at, { measure: event.target.value })}>
                  {withValue(measures, one.measure).map((value) => <option key={value} value={value}>{word('measure', value)}</option>)}
                </select>
                <select className="web-field" value={one.period} aria-label={t('policies/policy/period')} onChange={(event) => setLimit(at, { period: event.target.value })}>
                  {withValue(choices.periods, one.period).map((value) => <option key={value} value={value}>{word('period', value)}</option>)}
                </select>
                <select className="web-field" value={one.pool} aria-label={t('policies/policy/limitPool')} onChange={(event) => setLimit(at, { pool: event.target.value })}>
                  {withValue(choices.pools, one.pool).map((value) => <option key={value} value={value}>{word('limitPool', value)}</option>)}
                </select>
                <button type="button" className="web-people__chip-drop" aria-label={t('policies/policy/removeLimit')} title={t('policies/policy/removeLimit')} onClick={() => dropLimit(at)}>{'\u{00D7}'}</button>
                {problems.amounts[at] === undefined ? null : (
                  <span className="web-input__hint">{t(problems.amounts[at] === 'negative' ? 'policies/policy/amountNegative' : 'policies/policy/amountNumber')}</span>
                )}
              </div>
            ))}
            <Button label={t('policies/policy/addLimit')} onClick={addLimit} />
          </div>

          <Field label={t('policies/policy/pool')} hint={t('policies/policy/poolHint')}>
            <input className="web-field" value={shown.pool} onChange={(event) => set({ pool: event.target.value })} />
          </Field>

          <Field label={t('policies/policy/cap')} hint={t('policies/policy/capHint')}>
            <input type="checkbox" checked={shown.cap} onChange={(event) => set({ cap: event.target.checked })} />
          </Field>

          <Field label={t('policies/policy/from')} hint={t('policies/policy/dateHint')}>
            <input className="web-field" value={shown.from} onChange={(event) => set({ from: event.target.value })} />
          </Field>

          <Field label={t('policies/policy/until')} hint={t('policies/policy/dateHint')}>
            <input className="web-field" value={shown.until} onChange={(event) => set({ until: event.target.value })} />
          </Field>
        </>
      ) : (
        <DetailList columns={2} items={record === undefined ? [] : factsOf(record, word, t)} />
      )}

      {fresh ? null : (
        <>
          <Text variant="h3" text={t('policies/page/limits')} />
          {limitsError !== null ? <Alert tone="warning" message={limitsError} /> : limits === null ? <Spinner label={t('policies/notices/reading')} /> : limits.limits.length === 0 ? <p className="web-note">{t('policies/policy/noLimits')}</p> : (
            <ul className="web-limits">
              {limits.limits.map((figure, at) => (
                <li key={at}>
                  <LimitLine figure={figure} />
                  {figure.members === undefined ? null : (
                    <ul>
                      {figure.members.map((member) => (
                        <li key={member.user}><span>{member.user}</span> <MemberLine figure={figure} used={member.used} /></li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {failure === null ? null : <PageAlert tone="danger" message={failure} />}
      {writes ? (
        <div className="web-page__actions">
          <Button label={t(fresh ? 'policies/policy/create' : 'policies/policy/save')} variant="primary" disabled={!ready} onClick={() => void save()} />
          {fresh ? <Button label={t('policies/actions/cancel')} onClick={() => scena.surfaces.close(policyTab(host, undefined))} /> : (
            <>
              {dirty ? <Button label={t('policies/actions/discard')} onClick={() => setDraft(null)} /> : null}
              <Button label={t('policies/actions/delete')} variant="danger" onClick={() => void scena.commands.execute('ahp.deletePolicy', { host, id })} />
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}
