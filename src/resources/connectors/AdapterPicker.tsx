import { useEffect, useRef, useState, type KeyboardEvent, type ReactElement } from 'react';
import { useI18n } from '@softov/scena/react';
import { Button, Chip } from '@softov/scena/ui';
import { HostIcon } from '../../shell/HostIcon.js';
import { readChoice, writeChoice } from '../../shell/explorer/choice.js';
import { ADAPTER_GROUPING_KEY, ADAPTER_GROUPINGS, adapterGroups, capabilityGroups, type AdapterGrouping, type Pickable } from './form.js';

/** The capability types ahpw has its own words for; another is headed by the host's title. */
const KNOWN_TYPES = ['receive', 'command', 'action', 'ui'];

/** An adapter as a row: its icon, its title, the plugin that registers it when given, and its description. */
function AdapterLine({ adapter, size, plugin }: { adapter: Pickable; size: number; plugin?: string | undefined }): ReactElement {
  return (
    <>
      <HostIcon icons={adapter.icons} size={size} fallback={<span className="web-adapter-picker__blank" style={{ width: size, height: size }} />} />
      <span className="web-adapter-picker__text">
        <span className="web-adapter-picker__title">{adapter.title}{plugin === undefined ? null : <small className="web-adapter-picker__plugin">{plugin}</small>}</span>
        {adapter.description === '' ? null : <span className="web-adapter-picker__description">{adapter.description}</span>}
      </span>
    </>
  );
}

/**
 * The adapter of a connector: a search over the adapters, grouped by the
 * plugin that registers them or, when they declare capabilities and the
 * person picks it, by capability type; and once one is picked, that one alone with a
 * Change button. A made connector's adapter is fixed, so it shows no button.
 * An agent's kind is picked with it too, under its own `words`.
 */
export function AdapterPicker({ adapters, value, labelOf, fixed, onPick, words }: {
  adapters: readonly Pickable[];
  value: string;
  /** A plugin's title, for its group's heading. */
  labelOf: (plugin: string) => string;
  fixed: boolean;
  onPick: (name: string) => void;
  /** The list's name, the search's placeholder and the line for no match; an adapter's, by default. */
  words?: { label: string; search: string; none: string };
}): ReactElement | null {
  const { t } = useI18n();
  const picked = adapters.find((one) => one.name === value);
  const [choosing, setChoosing] = useState(picked === undefined && !fixed);
  const [needle, setNeedle] = useState('');
  const [focus, setFocus] = useState(0);
  const [grouping, setGrouping] = useState<AdapterGrouping>(() => readChoice(ADAPTER_GROUPING_KEY, ADAPTER_GROUPINGS, 'type'));
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

  const typed = adapters.some((one) => (one.capabilities?.length ?? 0) > 0);
  const byType = typed && grouping === 'type';
  const typeLabel = (type: string, title: string): string => (KNOWN_TYPES.includes(type) ? t(`connectors/capabilities/${type}`) : title || type);
  const groups = byType ? capabilityGroups(adapters, typeLabel, labelOf, t('connectors/picker/noCapability'), needle) : adapterGroups(adapters, labelOf, needle);
  // By type an adapter can sit in several groups, so a row is counted where it is drawn, not by adapter.
  const rows = groups.flatMap((group) => group.adapters);
  const matched = new Set(rows).size;
  const regroup = (next: AdapterGrouping): void => { setGrouping(next); writeChoice(ADAPTER_GROUPING_KEY, next); setFocus(0); };
  const pick = (name: string): void => { onPick(name); setChoosing(false); };
  const onKey = (event: KeyboardEvent): void => {
    if (event.key === 'ArrowDown') { event.preventDefault(); setFocus((at) => Math.min(at + 1, rows.length - 1)); }
    else if (event.key === 'ArrowUp') { event.preventDefault(); setFocus((at) => Math.max(at - 1, 0)); }
    else if (event.key === 'Enter' && rows[focus] !== undefined) { event.preventDefault(); pick(rows[focus].name); }
    else if (event.key === 'Escape' && picked !== undefined) { event.preventDefault(); setChoosing(false); }
  };

  return (
    <div className="web-adapter-picker" onKeyDown={onKey}>
      <input
        ref={search}
        className="web-adapter-picker__search"
        type="search"
        value={needle}
        placeholder={words?.search ?? t('connectors/picker/search')}
        aria-label={words?.search ?? t('connectors/picker/search')}
        onChange={(event) => { setNeedle(event.target.value); setFocus(0); }}
      />
      <div className="web-adapter-picker__list" role="listbox" aria-label={words?.label ?? t('connectors/form/adapter')}>
        {rows.length === 0 ? <p className="web-note">{words?.none ?? t('connectors/picker/none')}</p> : groups.map((group, index) => (
          <div key={group.key} role="group" aria-label={group.label}>
            <div className="web-adapter-picker__group">{group.label}</div>
            {group.adapters.map((adapter, within) => {
              const at = groups.slice(0, index).reduce((n, one) => n + one.adapters.length, 0) + within;
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
                  <AdapterLine adapter={adapter} size={28} plugin={byType ? labelOf(adapter.plugin) : undefined} />
                </button>
              );
            })}
          </div>
        ))}
      </div>
      <div className="web-adapter-picker__foot">
        <span>{t('connectors/picker/count', { shown: matched, all: adapters.length })}</span>
        {typed ? (
          <span className="web-adapter-picker__grouping" role="group" aria-label={t('connectors/picker/group')}>
            {ADAPTER_GROUPINGS.map((one) => (
              <Chip key={one} label={t(`connectors/picker/by/${one}`)} state={grouping === one ? 'on' : 'off'} onClick={() => regroup(one)} />
            ))}
          </span>
        ) : null}
      </div>
    </div>
  );
}
