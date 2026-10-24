import { useEffect, useRef, useState, type KeyboardEvent, type ReactElement } from 'react';
import { useI18n } from '@softov/scena/react';
import { Button } from '@softov/scena/ui';
import type { AdapterRow } from '../../bridges/connectors.js';
import { HostIcon } from '../../shell/HostIcon.js';
import { adapterGroups } from './form.js';

/** An adapter as a row: its icon, its title and its description. */
function AdapterLine({ adapter, size }: { adapter: AdapterRow; size: number }): ReactElement {
  return (
    <>
      <HostIcon icons={adapter.icons} size={size} fallback={<span className="web-adapter-picker__blank" style={{ width: size, height: size }} />} />
      <span className="web-adapter-picker__text">
        <span className="web-adapter-picker__title">{adapter.title}</span>
        {adapter.description === '' ? null : <span className="web-adapter-picker__description">{adapter.description}</span>}
      </span>
    </>
  );
}

/**
 * The adapter of a connector: a search over the adapters, grouped by the
 * plugin that registers them, and once one is picked, that one alone with a
 * Change button. A made connector's adapter is fixed, so it shows no button.
 */
export function AdapterPicker({ adapters, value, labelOf, fixed, onPick }: {
  adapters: readonly AdapterRow[];
  value: string;
  /** A plugin's title, for its group's heading. */
  labelOf: (plugin: string) => string;
  fixed: boolean;
  onPick: (name: string) => void;
}): ReactElement | null {
  const { t } = useI18n();
  const picked = adapters.find((one) => one.name === value);
  const [choosing, setChoosing] = useState(picked === undefined && !fixed);
  const [needle, setNeedle] = useState('');
  const [focus, setFocus] = useState(0);
  const search = useRef<HTMLInputElement>(null);
  useEffect(() => { if (choosing) search.current?.focus(); }, [choosing]);

  if (!choosing) {
    if (picked === undefined) return null;
    return (
      <div className="web-adapter-picker__picked">
        <AdapterLine adapter={picked} size={32} />
        {fixed ? null : <Button label={t('connectors/picker/change')} onClick={() => { setNeedle(''); setFocus(0); setChoosing(true); }} />}
      </div>
    );
  }

  const groups = adapterGroups(adapters, labelOf, needle);
  const shown = groups.flatMap((group) => group.adapters);
  const pick = (name: string): void => { onPick(name); setChoosing(false); };
  const onKey = (event: KeyboardEvent): void => {
    if (event.key === 'ArrowDown') { event.preventDefault(); setFocus((at) => Math.min(at + 1, shown.length - 1)); }
    else if (event.key === 'ArrowUp') { event.preventDefault(); setFocus((at) => Math.max(at - 1, 0)); }
    else if (event.key === 'Enter' && shown[focus] !== undefined) { event.preventDefault(); pick(shown[focus].name); }
    else if (event.key === 'Escape' && picked !== undefined) { event.preventDefault(); setChoosing(false); }
  };

  return (
    <div className="web-adapter-picker" onKeyDown={onKey}>
      <input
        ref={search}
        className="web-adapter-picker__search"
        type="search"
        value={needle}
        placeholder={t('connectors/picker/search')}
        aria-label={t('connectors/picker/search')}
        onChange={(event) => { setNeedle(event.target.value); setFocus(0); }}
      />
      <div className="web-adapter-picker__list" role="listbox" aria-label={t('connectors/form/adapter')}>
        {shown.length === 0 ? <p className="web-note">{t('connectors/picker/none')}</p> : groups.map((group) => (
          <div key={group.plugin} role="group" aria-label={group.label}>
            <div className="web-adapter-picker__group">{group.label}</div>
            {group.adapters.map((adapter) => {
              const at = shown.indexOf(adapter);
              return (
                <button
                  key={adapter.name}
                  type="button"
                  role="option"
                  aria-selected={adapter.name === value}
                  className="web-adapter-picker__row"
                  data-focus={at === focus ? 'true' : undefined}
                  onMouseEnter={() => setFocus(at)}
                  onClick={() => pick(adapter.name)}
                >
                  <AdapterLine adapter={adapter} size={28} />
                </button>
              );
            })}
          </div>
        ))}
      </div>
      <div className="web-adapter-picker__foot">{t('connectors/picker/count', { shown: shown.length, all: adapters.length })}</div>
    </div>
  );
}
