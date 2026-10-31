import { useLayoutEffect, useRef, useState, type ReactElement } from 'react';
import { useI18n, useScena } from '@softov/scena/react';
import { Button, Markdown, Spinner, StatusDot, TextField } from '@softov/scena/ui';
import { EMOJIcon } from '../emojis.js';
import { CopyButton } from '../../shell/controls/CopyButton.js';
import { linkClicks } from '../files/clicks.js';
import { useFileText } from '../files/text.js';
import { extOf } from '../files/viewers.js';
import { frontmatterOf, withoutFrontmatter, type FileSpot, type NewKind, type StateWord } from './words.js';
import { kindTitle, searchKind, type KindItem, type KindTab } from './kinds.js';
import { customFileTitle, newCustomFile, openCustomFile } from './custom-files.js';
import { FileModal } from './FileModal.js';

/** A dot and its words, or a spinner while a container loads. */
function stateMark(state: StateWord | undefined): ReactElement | null {
  if (state === undefined) return null;
  if (state.tone === 'busy') return <Spinner size={12} label={state.text} />;
  return <StatusDot tone={state.tone} label={state.text} className="web-custom__state" />;
}

/** Copy buttons for a name and a description. */
function Copies({ name, description }: { name: string; description: string }): ReactElement {
  const { t } = useI18n();
  return (
    <span className="web-custom-item__copies">
      <CopyButton text={name} label={t('agents/customizations/copyName')} />
      {description === '' ? null : <CopyButton text={description} label={t('agents/customizations/copyDescription')} icon={EMOJIcon.copyText} />}
    </span>
  );
}

/** The folder a file URI sits in, which its relative links start from. */
const folderOf = (uri: string): string => uri.replace(/\/[^/]*$/, '');

/** A Markdown file read from the host: its frontmatter as it is written, then its body; a short note when the host cannot read it. */
function FileBody({ host, uri }: { host: string; uri: string }): ReactElement {
  const scena = useScena();
  const { t } = useI18n();
  const state = useFileText(host, uri);
  if (state === null) return <Spinner label={t('agents/customizations/readingFile')} />;
  if ('error' in state || state.text === null) return <p className="web-note">{t('agents/customizations/unreadable')}</p>;
  const front = frontmatterOf(state.text);
  return (
    <>
      {front === '' ? null : <pre className="web-custom-item__front">{front}</pre>}
      <div className="web-md" onClick={linkClicks(scena, host, folderOf(uri))}>
        <Markdown text={withoutFrontmatter(state.text)} />
      </div>
    </>
  );
}

/** The selected customization in place of the list: its name, where it comes from, Edit and the copy buttons, its flags and description, then its Markdown file, or a button that opens any other file. */
function ItemPane({ host, item, back, onBack, onEdit }: { host: string; item: KindItem; back: string; onBack: () => void; onEdit: (spot: FileSpot) => void }): ReactElement {
  const scena = useScena();
  const { t } = useI18n();
  const open = item.open;
  const markdown = open !== undefined && (extOf(open.uri) === 'md' || extOf(open.uri) === 'markdown');
  return (
    <div className="web-custom-item">
      <button type="button" className="web-custom-item__back" onClick={onBack}>‹ {back}</button>
      <h3 className="web-custom-item__name">{item.label}</h3>
      <p className="web-custom-item__path">{item.plugin === undefined ? item.path : `${item.plugin} · ${item.path}`}</p>
      <div className="web-custom-item__actions">
        {open !== undefined && item.editable ? <Button label={t('agents/customizations/edit')} variant="primary" onClick={() => onEdit(open)} /> : null}
        {open !== undefined && !markdown
          ? <Button label={t('agents/customizations/openFile')} onClick={() => void scena.commands.execute('ahp.openFile', { host, uri: open.uri, line: open.line })} />
          : null}
        <Copies name={item.label} description={item.description} />
        {stateMark(item.state)}
      </div>
      {item.flags.length === 0 ? null : <p className="web-custom-item__flags">{item.flags.join(' · ')}</p>}
      {markdown || (item.description === '' && item.line === '') ? null : <p>{item.description === '' ? item.line : item.description}</p>}
      {markdown ? <FileBody host={host} uri={open.uri} /> : null}
    </div>
  );
}

/** One item in a kind's list: its name, its plugin as a tag, its flags, its state and the first line of its description; dimmed when it is off. Expanded, it shows the whole description and its path. */
function ItemRow({ item, selected, expanded, onSelect }: { item: KindItem; selected: boolean; expanded?: boolean; onSelect: () => void }): ReactElement {
  const text = expanded === true && item.description !== '' ? item.description : item.line;
  return (
    <button type="button" className="web-custom-row" data-enabled={item.enabled ? 'true' : 'false'} aria-current={selected ? 'true' : undefined} aria-expanded={expanded} onClick={onSelect}>
      <span className="web-custom-row__head">
        <span className="web-custom-row__name">{item.label}</span>
        {item.plugin === undefined ? null : <span className="web-custom-row__tag">{item.plugin}</span>}
        {item.flags.map((flag) => <span key={flag} className="web-custom-row__tag">{flag}</span>)}
        {stateMark(item.state)}
      </span>
      {text === '' ? null : <span className="web-custom-row__line">{text}</span>}
      {expanded === true ? <span className="web-custom-row__path">{item.plugin === undefined ? item.path : `${item.plugin} · ${item.path}`}</span> : null}
    </button>
  );
}

/**
 * One kind of an agent's customizations, as a tab of the agent page: a list grouped by source.
 * A click on an item shows it in place of the list, with a link back to the list.
 * A prompt has no more to show than its description, so a click on it expands its row instead.
 */
export function KindPanel({ host, tab }: { host: string; tab: KindTab }): ReactElement {
  const { t } = useI18n();
  const scena = useScena();
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(new Set());
  const [editing, setEditing] = useState<{ spot: FileSpot; title: string } | null>(null);
  // The list hides while an item shows, which loses its scroll; it comes back where it was.
  const list = useRef<HTMLDivElement>(null);
  const scrolled = useRef(0);
  useLayoutEffect(() => {
    if (selected === null && list.current !== null) list.current.scrollTop = scrolled.current;
  }, [selected]);
  const groups = searchKind(tab, query);
  const item = groups.flatMap((group) => group.items).find((one) => one.key === selected);
  const edit = (spot: FileSpot, title: string): void => openCustomFile(scena, host, spot, (shown) => setEditing({ spot: shown, title }));
  const make = (folder: string, kind: NewKind): void => {
    void newCustomFile(scena, host, folder, kind, (shown) => setEditing({ spot: shown, title: customFileTitle(shown.uri) }));
  };
  const { newFolder, newKind } = tab;
  const expands = tab.kind === 'prompt';
  const toggle = (key: string): void => setExpanded((now) => {
    const next = new Set(now);
    if (!next.delete(key)) next.add(key);
    return next;
  });
  return (
    <div className="web-custom-kinds" data-view={item === undefined ? 'list' : 'item'}>
      <div className="web-custom-kinds__list" ref={list}>
        <div className="web-custom-kinds__bar">
          <TextField value={query} placeholder={t('agents/customizations/search')} onChange={setQuery} />
          {newFolder === undefined || newKind === undefined ? null : (
            <Button label={t(newKind === 'agent' ? 'agents/customizations/newAgent' : 'agents/customizations/newSkill')} variant="primary" onClick={() => make(newFolder, newKind)} />
          )}
        </div>
        {groups.map((group) => (
          <section key={group.key} className="web-custom-kinds__group">
            {group.title === '' ? null : <h4 className="web-custom-kinds__heading"><span>{group.title}</span><span>{group.items.length}</span></h4>}
            {group.items.map((one) => expands
              ? <ItemRow key={one.key} item={one} selected={false} expanded={expanded.has(one.key)} onSelect={() => toggle(one.key)} />
              : <ItemRow key={one.key} item={one} selected={one.key === selected} onSelect={() => { scrolled.current = list.current?.scrollTop ?? 0; setSelected(one.key); }} />)}
          </section>
        ))}
        {groups.length === 0 ? <p className="web-note">{t('agents/customizations/noMatch')}</p> : null}
      </div>
      {item === undefined ? null : (
        <div className="web-custom-kinds__pane">
          <ItemPane host={host} item={item} back={kindTitle(tab.kind)} onBack={() => setSelected(null)} onEdit={(spot) => edit(spot, item.name)} />
        </div>
      )}
      {editing === null ? null : <FileModal host={host} spot={editing.spot} title={editing.title} onClose={() => setEditing(null)} />}
    </div>
  );
}
