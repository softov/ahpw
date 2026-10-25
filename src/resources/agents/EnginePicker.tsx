import type { ReactElement } from 'react';
import { useI18n } from '@softov/scena/react';
import type { EngineRow } from '../../bridges/agents.js';
import { AdapterPicker } from '../connectors/AdapterPicker.js';

/**
 * The engine of a new agent, picked as a connector's adapter is, and under it
 * what the record starts from: one of the engine's templates, or a blank one.
 * A made agent's engine is fixed, so it shows the engine alone.
 */
export function EnginePicker({ engines, value, template, labelOf, fixed, onPick, onTemplate }: {
  engines: readonly EngineRow[];
  value: string;
  /** The template the record starts from, by its place in the engine's list, or -1 for a blank record. */
  template: number;
  labelOf: (plugin: string) => string;
  fixed: boolean;
  onPick: (name: string) => void;
  onTemplate: (at: number) => void;
}): ReactElement {
  const { t } = useI18n();
  const engine = engines.find((one) => one.name === value);
  const templates = engine?.templates ?? [];
  return (
    <>
      <AdapterPicker adapters={engines} value={value} labelOf={labelOf} fixed={fixed} onPick={onPick} words={{ label: t('agents/form/engine'), search: t('agents/form/searchEngines'), none: t('agents/form/noEngineMatch') }} />
      {fixed || engine === undefined || templates.length === 0 ? null : (
        <div className="web-kind-templates" role="radiogroup" aria-label={t('agents/form/startFrom')}>
          <span className="web-connector-form__label">{t('agents/form/startFrom')}</span>
          {templates.map((one, at) => (
            <label key={`${at}:${one.name}`} className="web-kind-templates__choice">
              <input type="radio" name="agent-template" checked={template === at} onChange={() => onTemplate(at)} />
              <span className="web-kind-templates__text">
                <span className="web-kind-templates__title">{one.name}</span>
                {one.description === undefined || one.description === '' ? null : <span className="web-kind-templates__description">{one.description}</span>}
              </span>
            </label>
          ))}
          <label className="web-kind-templates__choice">
            <input type="radio" name="agent-template" checked={template === -1} onChange={() => onTemplate(-1)} />
            <span className="web-kind-templates__text">
              <span className="web-kind-templates__title">{t('agents/form/blank')}</span>
            </span>
          </label>
        </div>
      )}
    </>
  );
}
