import { useRef, useState, type ReactElement } from 'react';
import { useI18n, useScena, useStore } from '@softov/scena/react';
import { Button, Spinner, Text } from '@softov/scena/ui';
import { ahpPaths } from '../../bridges/data.js';
import { useChannel } from '../../bridges/channel.js';
import { useHostNames, useShownHosts } from '../../bridges/hosts.js';
import { NO_OFFERS, type Offers } from '../../bridges/offers.js';
import { useServingHosts } from '../../bridges/served.js';
import { embedMode } from '../../shell/embed/index.js';
import { Field } from '../../shell/view/Field.js';
import { PageAlert } from '../../shell/view/PageAlert.js';
import { writeLastHost } from '../sessions/last-host.js';
import { Bood } from './Bood.js';
import { BOT_PROVIDER, BOTS, BOTS_SCHEME, botsReducer, editBot, makeBot, type BotsState } from './catalogue.js';
import { draftOf, recordBody, type BotDraft } from './draft.js';
import { BOT_BODIES, COLOR_HEX, slugOf } from './look.js';

/** How many slugs a new bot tries, since a host never gives a deleted bot's slug again. */
const SLUG_TRIES = 5;

/** The host's own owner, which its bot manifest offers as `root:<host>` to whoever may name it. */
function hostOwnerOf(offers: Offers): string | undefined {
  const owner = offers.providers[BOT_PROVIDER]?.manifest?.properties as Record<string, { anyOf?: { const?: unknown }[] }> | undefined;
  const root = owner?.owner?.anyOf?.find((one) => typeof one.const === 'string' && one.const.startsWith('root:'));
  return typeof root?.const === 'string' ? root.const : undefined;
}

/** Makes a bot, or edits the one named by `slug`: its look first, then what it is and whose. */
export default function BotEditPage({ host: opened, slug }: { host: string; slug?: string }): ReactElement {
  const scena = useScena();
  const { t } = useI18n();
  const fresh = slug === undefined;
  const hosts = useServingHosts(useShownHosts(), BOTS_SCHEME);
  const hostName = useHostNames();
  const [host, setHost] = useState(opened);
  const offers = useStore<Offers>(ahpPaths(host).offers) ?? NO_OFFERS;
  const { state, error } = useChannel<BotsState>(host, BOTS, botsReducer);
  const [draft, setDraft] = useState<BotDraft | null>(null);
  // The form's start, drawn once: a new bot's look is random.
  const first = useRef<BotDraft | null>(null);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const tabKey = fresh ? 'bot:new' : `bot:edit:${host}:${slug}`;

  if (error !== null) return <PageAlert tone="danger" title={t('bots/notices/none')} message={error} />;
  if (state === undefined) return <Spinner label={t('bots/notices/reading')} />;
  const bot = fresh ? undefined : state.bots.find((one) => one.id === slug);
  if (!fresh && bot === undefined) return <PageAlert tone="warning" message={t('bots/notices/gone')} />;

  first.current ??= draftOf(bot, state.bots);
  const shown = draft ?? first.current;
  const start = first.current;
  const set = (change: Partial<BotDraft>): void => setDraft((held) => ({ ...(held ?? start), ...change }));
  const hostOwner = hostOwnerOf(offers);
  const ready = !busy && shown.name.trim() !== '';

  const save = (): void => {
    setBusy(true);
    setFailure(null);
    const body = recordBody(shown, fresh);
    const written = bot === undefined
      ? (() => {
        const taken = state.bots.map((one) => one.id);
        const slugs: string[] = [];
        for (let n = 0; n < SLUG_TRIES; n += 1) slugs.push(slugOf(shown.name, [...taken, ...slugs]));
        return makeBot(host, offers, slugs, body);
      })()
      : editBot(host, offers, bot, body).then(() => bot.id);
    void written.then(
      (made) => {
        scena.surfaces.close(tabKey);
        void scena.commands.execute('ahp.openBot', { host, slug: made, name: shown.name.trim() });
      },
      (caught: unknown) => {
        setFailure(caught instanceof Error ? caught.message : String(caught));
        setBusy(false);
      },
    );
  };

  return (
    <div className="web-page web-form">
      <Text variant="h2" text={fresh ? t('bots/commands/new') : t('bots/editTitle', { name: bot!.name })} />

      <div className="web-bot-look">
        <Bood body={shown.body} color={shown.color} width={120} />
        <div className="web-bot-look__pickers">
          <div className="web-bot-look__colors" role="radiogroup" aria-label={t('bots/edit/color')}>
            {Object.entries(COLOR_HEX).map(([name, hex]) => (
              <button
                key={name}
                type="button"
                role="radio"
                aria-checked={shown.color === hex}
                aria-label={t(`bots/colors/${name}`)}
                title={t(`bots/colors/${name}`)}
                className="web-bot-look__color"
                style={{ background: hex }}
                onClick={() => set({ color: hex })}
              />
            ))}
          </div>
          <div className="web-bot-look__bodies" role="radiogroup" aria-label={t('bots/edit/body')}>
            {BOT_BODIES.map((body) => (
              <button key={body} type="button" role="radio" aria-checked={shown.body === body} aria-label={body} title={body} className="web-bot-look__body" onClick={() => set({ body })}>
                <Bood body={body} color={shown.color} width={30} still />
              </button>
            ))}
          </div>
        </div>
      </div>

      {fresh && embedMode() === 'multi' && hosts.length > 1 ? (
        <Field label={t('bots/edit/host')}>
          <select className="web-field" value={host} onChange={(event) => { setHost(event.target.value); writeLastHost(event.target.value); set({ owner: '' }); }}>
            {hosts.map((one) => <option key={one} value={one}>{hostName(one)}</option>)}
          </select>
        </Field>
      ) : null}

      <Field label={t('bots/edit/name')}>
        <input className="web-field" value={shown.name} autoFocus={fresh} onChange={(event) => set({ name: event.target.value })} />
      </Field>

      {fresh ? (
        hostOwner === undefined ? null : (
          <Field label={t('bots/edit/owner')} hint={t('bots/edit/ownerHint')}>
            <select className="web-field" value={shown.owner} onChange={(event) => set({ owner: event.target.value })}>
              <option value="">{t('bots/edit/ownerMe')}</option>
              <option value={hostOwner}>{t('bots/edit/ownerHost')}</option>
            </select>
          </Field>
        )
      ) : (
        <Field label={t('bots/edit/owner')} hint={t('bots/edit/ownerKept')}>
          <input className="web-field" value={shown.owner} readOnly />
        </Field>
      )}

      <Field label={t('bots/edit/labels')} hint={t('bots/edit/labelsHint')}>
        <input className="web-field" value={shown.labels} onChange={(event) => set({ labels: event.target.value })} />
      </Field>

      <Field label={t('bots/edit/description')}>
        <textarea className="web-field" rows={2} value={shown.description} onChange={(event) => set({ description: event.target.value })} />
      </Field>

      <Field label={t('bots/edit/instructions')} hint={t(fresh ? 'bots/edit/instructionsHint' : 'bots/edit/instructionsLater')}>
        <textarea className="web-field web-form__message" rows={5} value={shown.instructions} onChange={(event) => set({ instructions: event.target.value })} />
      </Field>

      {failure === null ? null : <PageAlert tone="danger" message={failure} />}
      <div className="web-page__actions">
        <Button label={t(fresh ? 'bots/edit/create' : 'bots/edit/save')} variant="primary" disabled={!ready} onClick={save} />
        <Button label={t('bots/edit/cancel')} onClick={() => scena.surfaces.close(tabKey)} />
      </div>
    </div>
  );
}
