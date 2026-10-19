import { useEffect, useMemo, useState, type ReactElement } from 'react';
import { useI18n, useScena, useStore } from '@softov/scena/react';
import { Button, DetailList, SchemaForm, Spinner, Text, type JsonSchemaObject } from '@softov/scena/ui';
import { ahpPaths } from '../../bridges/data.js';
import { useChannel } from '../../bridges/channel.js';
import { NO_OFFERS, type Offers } from '../../bridges/offers.js';
import {
  POLICIES, policiesReducer, policyManifest, putPolicy, readLimits, writesPolicies,
  type PoliciesState, type PolicyLimits,
} from '../../bridges/policies.js';
import { embedMode } from '../../shell/embed/index.js';
import { HostTag } from '../../shell/explorer/HostLines.js';
import { PageAlert } from '../../shell/view/PageAlert.js';
import { timeOf } from '../automations/words.js';
import { changedKeys } from '../host/config.js';
import { isRecordId } from '../users/form.js';
import { JsonCodeEditor } from '../editor/JsonCodeEditor.js';
import { policyTab } from './state.js';
import { limitWord, usedWord } from './words.js';

/** What a new row starts as: everybody, allowed every model; the person names it and narrows it. */
const FRESH: Record<string, unknown> = { id: '', scope: 'all', kind: 'model', effect: 'allow', match: {} };

/**
 * A new row's form: the manifest with the id as its first field, since the
 * manifest describes a row at an address and a new one has none yet.
 */
function withId(manifest: JsonSchemaObject, title: string, description: string): JsonSchemaObject {
  return {
    ...manifest,
    properties: { id: { type: 'string', title, description }, ...manifest.properties },
    required: ['id', ...(manifest.required ?? [])],
  };
}

/** The row as the form edits it: the id is the address, not a field. */
function editable(record: Record<string, unknown>): Record<string, unknown> {
  const { id: _id, ...rest } = record;
  return rest;
}

/** What a limits read answered: the figures, or why there are none to show. */
type Limits = { figures: PolicyLimits } | { error: string } | null;

/**
 * What a row's limits used, as its `limits` leaf answers: per limit, what the
 * period used of the amount, from when and until it resets, and each member's
 * share of an `each` limit.
 */
function LimitsList({ limits }: { limits: Limits }): ReactElement {
  const { t } = useI18n();
  if (limits === null) return <Spinner label={t('policies/notices/readingLimits')} />;
  if ('error' in limits) return <p className="web-note">{t('policies/limit/unread', { why: limits.error })}</p>;
  return (
    <DetailList
      columns={1}
      items={limits.figures.limits.map((figure) => ({
        label: limitWord(figure),
        value: (
          <span className="web-policy__figure">
            <span>
              {[
                // An `each` limit read by a reader who may see everybody answers its members, not one total.
                figure.members === undefined ? usedWord(figure, figure.used) : undefined,
                figure.counted && figure.resets !== undefined ? t('policies/limit/resets', { at: timeOf(figure.resets) }) : undefined,
                figure.ends === undefined ? undefined : t('policies/limit/ends', { at: timeOf(figure.ends) }),
              ].filter((bit) => bit !== undefined).join(' \u{00B7} ')}
            </span>
            {figure.members === undefined ? null : figure.members.length === 0 ? <span>{t('policies/limit/noMembers')}</span> : figure.members.map((member) => (
              <span key={member.user}>{t('policies/limit/member', { user: member.user, used: usedWord(figure, member.used) })}</span>
            ))}
          </span>
        ),
      }))}
    />
  );
}

/**
 * One policy: the row as a form drawn from the manifest the host describes the
 * scheme with, what its limits used, and Save and Delete where the host takes
 * writes. A new row when there is no `policy`.
 */
export default function PolicyPage({ host, policy: id }: { host: string; policy?: string }): ReactElement {
  const scena = useScena();
  const { t } = useI18n();
  const fresh = id === undefined;
  const offers = useStore<Offers>(ahpPaths(host).offers) ?? NO_OFFERS;
  const policies = useChannel<PoliciesState>(host, POLICIES.channel, policiesReducer);
  const [draft, setDraft] = useState<Record<string, unknown> | null>(null);
  const [jsonValid, setJsonValid] = useState(true);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const [limits, setLimits] = useState<Limits>(null);

  const record = fresh ? undefined : policies.state?.records.find((one) => one.id === id)?.record;
  const held = useMemo(() => (record === undefined ? FRESH : editable(record as unknown as Record<string, unknown>)), [record]);
  const limited = (record?.limits ?? []).length > 0;
  const manifest = policyManifest(offers) as JsonSchemaObject | undefined;
  const schema = useMemo(() => (manifest === undefined || !fresh ? manifest : withId(manifest, t('policies/policy/id'), t('policies/policy/idHint'))), [manifest, fresh, t]);

  // Again whenever the row changes, since its limits may have.
  useEffect(() => {
    if (fresh || !limited) return undefined;
    let live = true;
    setLimits(null);
    readLimits(host, offers, id).then(
      (figures) => { if (live) setLimits({ figures }); },
      (caught: unknown) => { if (live) setLimits({ error: caught instanceof Error ? caught.message : String(caught) }); },
    );
    return () => { live = false; };
  }, [host, offers, id, fresh, limited, record]);

  // A row changed by someone else shows what they wrote, as the settings do.
  useEffect(() => { setDraft(null); }, [held]);

  if (policies.error !== null) return <PageAlert tone="danger" title={t('policies/notices/none')} message={policies.error} />;
  if (policies.state === undefined) return <Spinner label={t('policies/notices/reading')} />;
  if (!fresh && record === undefined) return <PageAlert tone="warning" message={t('policies/policy/gone')} />;
  if (schema === undefined) return <PageAlert tone="info" message={t('policies/policy/noManifest')} />;

  const writes = writesPolicies(offers);
  const value = draft ?? held;
  const target = fresh ? String(value.id ?? '').trim() : id;
  const changed = fresh ? editable(value) : changedKeys(held, value);
  const dirty = Object.keys(changed).length > 0;
  const ready = writes && !busy && jsonValid && (fresh ? isRecordId(target) : dirty);
  const tab = policyTab(host, id);

  const save = async (): Promise<void> => {
    setBusy(true);
    setFailure(null);
    try {
      // A row is written whole on the host: what the body leaves out keeps its value, so an edit sends what changed.
      await putPolicy(host, offers, target, changed, fresh);
      setDraft(null);
      if (fresh) {
        scena.surfaces.close(tab);
        void scena.commands.execute('ahp.openPolicy', { host, id: target });
      }
    } catch (caught) {
      setFailure(caught instanceof Error ? caught.message : String(caught));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="web-page web-form web-policy">
      <Text variant="h2" text={fresh ? t('policies/commands/new') : id} />
      {writes ? null : <p className="web-note">{t('policies/notices/readOnly')}</p>}
      {embedMode() === 'multi' ? <DetailList items={[{ label: t('common/host'), value: <HostTag host={host} />, span: true }]} /> : null}

      {/* A disabled fieldset is how a host that takes no writes shows the row read-only: every control in it is. */}
      <fieldset className="web-policy__form" disabled={!writes}>
        <SchemaForm
          schema={schema}
          value={value}
          onChange={setDraft}
          baseline={held}
          jsonEditor={JsonCodeEditor}
          onJsonValidChange={setJsonValid}
          fieldActions
        />
      </fieldset>

      {limited ? (
        <>
          <Text variant="h3" text={t('policies/policy/limits')} />
          <LimitsList limits={limits} />
        </>
      ) : null}

      {failure === null ? null : <PageAlert tone="danger" message={failure} />}
      {writes ? (
        <div className="web-page__actions">
          <Button label={t(fresh ? 'policies/policy/create' : 'policies/policy/save')} variant="primary" disabled={!ready} {...(jsonValid ? {} : { title: t('host/settings/fixJson') })} onClick={() => void save()} />
          {fresh ? <Button label={t('policies/actions/cancel')} onClick={() => scena.surfaces.close(tab)} /> : (
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
