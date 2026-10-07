import { Fragment, useState, type MouseEvent, type ReactElement, type ReactNode } from 'react';
import { ContextMenu } from '@softov/scena/ui';
import type { PickerAction } from '@softov/scena/types';

/** The colour of a row's dot, by meaning. */
export type Dot = 'attention' | 'working' | 'failed' | 'fresh' | 'ok' | 'quiet' | 'off';

/** One row: a dot, a title with its time, up to two lines under it, and what its menu offers. */
export interface Row {
  key: string;
  dot: Dot;
  dotLabel: string;
  title: string;
  time?: string;
  lines: ReactNode[];
  menu: PickerAction[];
  /** Drawn bold: something a person has not looked at yet. */
  strong?: boolean;
  /** The group the row is listed under; rows come grouped already, in order. */
  group?: { key: string; label: string };
}

/** An icon button in the explorer's title. */
export interface HeadAction {
  icon: string;
  label: string;
  run?: () => void;
  /** A menu the button opens instead of running. */
  menu?: PickerAction[];
  on?: boolean;
  /** Running: the icon turns and the button takes no clicks. */
  busy?: boolean;
}

interface Menu {
  x: number;
  y: number;
  items: PickerAction[];
}

/** A sidebar list: a title with its actions, a filter, and rows that open on click and offer a menu on right-click. */
export function ExplorerList({ title, actions, rows, selected, onOpen, notice, filterLabel }: {
  title: string;
  actions: HeadAction[];
  rows: Row[];
  selected: string | null;
  onOpen: (key: string) => void;
  notice?: ReactNode;
  filterLabel?: string;
}): ReactElement {
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
      <div className="web-explorer__title">
        <span>{title}</span>
        <span className="web-explorer__actions">
          {actions.map((action) => (
            <button
              key={action.label}
              type="button"
              className="web-explorer__action"
              title={action.label}
              aria-label={action.label}
              aria-pressed={action.on}
              data-on={action.on === true ? 'true' : 'false'}
              data-busy={action.busy === true ? 'true' : undefined}
              disabled={action.busy === true}
              onClick={(event) => {
                if (action.menu === undefined) return action.run?.();
                const box = event.currentTarget.getBoundingClientRect();
                setMenu({ x: box.left, y: box.bottom, items: action.menu });
              }}
            >
              <span className="web-explorer__icon">{action.icon}</span>
            </button>
          ))}
        </span>
      </div>
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
        {notice === undefined || notice === null ? null : <div className="web-explorer__notice">{notice}</div>}
        <ul className="web-explorer__list" role="listbox" aria-label={title}>
          {shown.map((row, index) => {
            const group = row.group;
            const opens = group !== undefined && shown[index - 1]?.group?.key !== group.key;
            const count = opens ? shown.filter((one) => one.group?.key === group.key).length : 0;
            const hidden = group !== undefined && folded.has(group.key);
            return (
              <Fragment key={row.key}>
                {opens ? (
                  <li className="web-explorer__group" role="presentation">
                    <button type="button" aria-expanded={!hidden} onClick={() => fold(group.key)}>
                      <span className="web-explorer__fold" aria-hidden="true">{hidden ? '\u{25B8}' : '\u{25BE}'}</span>
                      <span className="web-explorer__group-label">{group.label}</span>
                      <span className="web-explorer__count">{count}</span>
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
                    <span className="web-row__dot" data-dot={row.dot} title={row.dotLabel} aria-label={row.dotLabel} />
                    <span className="web-row__body">
                      <span className="web-row__head">
                        <span className="web-row__title" data-strong={row.strong === true ? 'true' : 'false'}>{row.title}</span>
                        {row.time === undefined ? null : <span className="web-row__time">{row.time}</span>}
                      </span>
                      {row.lines.map((line, index) => <span key={index} className="web-row__line">{line}</span>)}
                    </span>
                  </li>
                )}
              </Fragment>
            );
          })}
        </ul>
        {needle !== '' && shown.length === 0 ? <p className="web-note web-explorer__empty">Nothing matches.</p> : null}
      </div>
      {menu === null ? null : <ContextMenu spec={{ items: menu.items }} x={menu.x} y={menu.y} onClose={() => setMenu(null)} />}
    </div>
  );
}
