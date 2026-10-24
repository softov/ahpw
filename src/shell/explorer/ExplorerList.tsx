import { Fragment, useState, type MouseEvent, type ReactElement, type ReactNode } from 'react';
import { useI18n } from '@softov/scena/react';
import { ContextMenu } from '@softov/scena/ui';
import type { PickerAction } from '@softov/scena/types';
import type { Icon } from '../../bridges/icons.js';
import { EMOJIcon } from '../../resources/emojis.js';
import { HostIcon, useHostIcon } from '../HostIcon.js';
import { HostLines } from './HostLines.js';

/** The colour of a row's dot, by meaning. */
export type Dot = 'attention' | 'working' | 'failed' | 'fresh' | 'ok' | 'quiet' | 'off';

/** One row: a dot, a title with its time, up to two lines under it, and what its menu offers. */
export interface Row {
  key: string;
  dot: Dot;
  dotLabel: string;
  /** Drawn in place of the dot, such as a bot's figure; `dotLabel` still names it. */
  icon?: ReactNode;
  /** A host's icon for what the row names, drawn with the dot as a badge on its corner; without `icon`. */
  icons?: readonly Icon[];
  /** An emoji drawn in the icon's place, with the dot on its corner, while `icons` has none to draw. */
  emoji?: string;
  title: string;
  time?: string;
  lines: ReactNode[];
  menu: PickerAction[];
  /** Drawn bold: something a person has not looked at yet. */
  strong?: boolean;
  /** The group the row is listed under; rows come grouped already, in order. */
  group?: { key: string; label: string; icons?: readonly Icon[] };
  /** A group inside `group`, drawn as an indented heading; its key is unique across the list. */
  subgroup?: { key: string; label: string };
  /** An icon button on the row, beside its time. */
  action?: { icon: string; label: string; run: () => void };
}

interface Menu {
  x: number;
  y: number;
  items: PickerAction[];
}

/**
 * A sidebar list: a filter, and rows that open on click and offer a menu on
 * right-click. Its section's title and buttons are scena's header, declared on
 * the section's component; `label` only names the list for assistive tech.
 */
export function ExplorerList({ label, rows, selected, onOpen, notice, filterLabel, hostLines }: {
  label: string;
  rows: Row[];
  selected: string | null;
  onOpen: (key: string) => void;
  notice?: ReactNode;
  filterLabel?: string;
  /** With every host, a line above the rows for each shown host that is not connected. */
  hostLines?: boolean;
}): ReactElement {
  const { t } = useI18n();
  const [menu, setMenu] = useState<Menu | null>(null);
  const [filter, setFilter] = useState('');
  const [folded, setFolded] = useState<ReadonlySet<string>>(new Set());
  const fold = (key: string): void => setFolded((held) => {
    const next = new Set(held);
    if (!next.delete(key)) next.add(key);
    return next;
  });
  const needle = filter.trim().toLowerCase();
  const shown = needle === '' ? rows : rows.filter((row) => [row.title, ...row.lines.filter((line) => typeof line === 'string')].join(' ').toLowerCase().includes(needle));

  const openMenu = (event: MouseEvent, row: Row): void => {
    event.preventDefault();
    setMenu({ x: event.clientX, y: event.clientY, items: row.menu });
  };

  return (
    <div className="web-explorer">
      {filterLabel === undefined ? null : (
        <input
          className="web-explorer__filter"
          type="search"
          value={filter}
          placeholder={filterLabel}
          aria-label={filterLabel}
          onChange={(event) => setFilter(event.target.value)}
        />
      )}
      <div className="web-explorer__scroll">
        {hostLines === true ? <HostLines /> : null}
        {notice === undefined || notice === null ? null : <div className="web-explorer__notice">{notice}</div>}
        <ul className="web-explorer__list" role="listbox" aria-label={label}>
          {shown.map((row, index) => {
            const group = row.group;
            const opens = group !== undefined && shown[index - 1]?.group?.key !== group.key;
            const count = opens ? shown.filter((one) => one.group?.key === group.key).length : 0;
            const sub = row.subgroup;
            const subOpens = sub !== undefined && (opens || shown[index - 1]?.subgroup?.key !== sub.key);
            const subCount = subOpens ? shown.filter((one) => one.subgroup?.key === sub.key).length : 0;
            const groupHidden = group !== undefined && folded.has(group.key);
            const hidden = groupHidden || (sub !== undefined && folded.has(sub.key));
            return (
              <Fragment key={row.key}>
                {opens ? (
                  <li className="web-explorer__group" role="presentation">
                    <button type="button" aria-expanded={!hidden} onClick={() => fold(group.key)}>
                      <span className="web-explorer__fold" aria-hidden="true">{hidden ? EMOJIcon.caretRight : EMOJIcon.caretDown}</span>
                      <HostIcon icons={group.icons} size={16} className="web-explorer__group-icon" />
                      <span className="web-explorer__group-label">{group.label}</span>
                      <span className="web-explorer__count">{count}</span>
                    </button>
                  </li>
                ) : null}
                {subOpens && !groupHidden ? (
                  <li className="web-explorer__group web-explorer__group--sub" role="presentation">
                    <button type="button" aria-expanded={!folded.has(sub.key)} onClick={() => fold(sub.key)}>
                      <span className="web-explorer__fold" aria-hidden="true">{folded.has(sub.key) ? EMOJIcon.caretRight : EMOJIcon.caretDown}</span>
                      <span className="web-explorer__group-label">{sub.label}</span>
                      <span className="web-explorer__count">{subCount}</span>
                    </button>
                  </li>
                ) : null}
                {hidden ? null : (
                  <li
                    role="option"
                    aria-selected={row.key === selected}
                    tabIndex={0}
                    className="web-row"
                    data-selected={row.key === selected ? 'true' : 'false'}
                    onClick={() => onOpen(row.key)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        onOpen(row.key);
                      }
                      if (event.key === 'ContextMenu' || (event.shiftKey && event.key === 'F10')) {
                        event.preventDefault();
                        const box = event.currentTarget.getBoundingClientRect();
                        setMenu({ x: box.left + 24, y: box.bottom, items: row.menu });
                      }
                    }}
                    onContextMenu={(event) => openMenu(event, row)}
                  >
                    {row.icon !== undefined
                      ? <span className="web-row__icon" title={row.dotLabel} aria-label={row.dotLabel}>{row.icon}</span>
                      : <RowMark row={row} />}
                    <span className="web-row__body">
                      <span className="web-row__head">
                        <span className="web-row__title" data-strong={row.strong === true ? 'true' : 'false'}>{row.title}</span>
                        {row.time === undefined ? null : <span className="web-row__time">{row.time}</span>}
                        {row.action === undefined ? null : (
                          <button
                            type="button"
                            className="web-row__action"
                            title={row.action.label}
                            aria-label={row.action.label}
                            onClick={(event) => {
                              event.stopPropagation();
                              row.action?.run();
                            }}
                            onKeyDown={(event) => event.stopPropagation()}
                          >
                            {row.action.icon}
                          </button>
                        )}
                      </span>
                      {row.lines.map((line, index) => <span key={index} className="web-row__line">{line}</span>)}
                    </span>
                  </li>
                )}
              </Fragment>
            );
          })}
        </ul>
        {needle !== '' && shown.length === 0 ? <p className="web-note web-explorer__empty">{t('shell/explorer/noMatch')}</p> : null}
      </div>
      {menu === null ? null : <ContextMenu spec={{ items: menu.items }} x={menu.x} y={menu.y} onClose={() => setMenu(null)} />}
    </div>
  );
}

/** A row's dot, or its host icon with the dot as a badge on its corner. */
function RowMark({ row }: { row: Row }): ReactElement {
  const icon = useHostIcon(row.icons);
  const dot = (
    <span className="web-row__dot" data-dot={row.dot} title={row.dotLabel} aria-label={row.dotLabel}>
      {row.dot === 'working' ? <><i /><i /><i /><i /></> : null}
    </span>
  );
  if (icon === undefined && row.emoji === undefined) return dot;
  return (
    <span className="web-row__mark">
      {icon === undefined
        ? <span className="web-row__emoji" aria-hidden="true">{row.emoji}</span>
        : <img className="web-host-icon" src={icon.src} width={20} height={20} alt="" draggable={false} />}
      {dot}
    </span>
  );
}
