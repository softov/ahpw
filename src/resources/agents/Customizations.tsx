import { useState, type ReactElement } from 'react';
import { useI18n, useScena } from '@softov/scena/react';
import { Button, Markdown, Modal, Spinner, StatusDot, Tree, type TreeNode } from '@softov/scena/ui';
import type { Customization } from '@microsoft/agent-host-protocol';
import { EMOJIcon } from '../emojis.js';
import { CopyButton } from '../../shell/controls/CopyButton.js';
import { linkClicks } from '../files/clicks.js';
import { useFileText } from '../files/text.js';
import { extOf } from '../files/viewers.js';
import { customizationRows, withoutFrontmatter, type ChildRow, type CustomizationRow, type FileSpot, type NewKind, type StateWord } from './words.js';
import { customFileTitle, newCustomFile, openCustomFile } from './custom-files.js';
import { FileModal } from './FileModal.js';

/** What a row without children shows when it is clicked. */
interface Detail {
  name: string;
  /** Whether the detail is a child's, which offers to copy its name and description. */
  copies: boolean;
  description: string;
  flags: string[];
  open?: FileSpot;
  /** Whether the file may be edited. */
  editable: boolean;
}

/** The icon each customization kind draws with. */
const ICON: Record<string, string> = { plugin: EMOJIcon.plugin, directory: EMOJIcon.folder, mcpServer: EMOJIcon.mcpServer };

/** A dot and its words, or a spinner while a container loads. */
function stateMark(state: StateWord | undefined): ReactElement | undefined {
  if (state === undefined) return undefined;
  if (state.tone === 'busy') return <Spinner size={12} label={state.text} />;
  return <StatusDot tone={state.tone} label={state.text} className="web-custom__state" />;
}

/** Copy buttons for a name and a description; a click on them does not reach the row. */
function Copies({ name, description, className }: { name: string; description: string; className: string }): ReactElement {
  const { t } = useI18n();
  return (
    <span className={className} onClick={(event) => event.stopPropagation()} onKeyDown={(event) => event.stopPropagation()}>
      <CopyButton text={name} label={t('agents/customizations/copyName')} />
      {description === '' ? null : <CopyButton text={description} label={t('agents/customizations/copyDescription')} icon={EMOJIcon.copyText} />}
    </span>
  );
}

/** A child's row: its name, its description and its flags; dimmed when it is off. Copy buttons show at its end on hover. */
function childNode(parent: string, child: ChildRow): TreeNode<Detail> {
  const mark = stateMark(child.state);
  return {
    key: `${parent}/${child.id}`,
    label: (
      <span className="web-custom" data-enabled={child.enabled ? 'true' : 'false'} title={child.line === '' ? child.label : `${child.label}: ${child.line}`}>
        <span className="web-custom__name">{child.label}</span>
        {child.line === '' ? null : <span className="web-custom__line">{child.line}</span>}
        {child.flags.map((flag) => <span key={flag} className="web-custom__flag">{flag}</span>)}
        <Copies name={child.label} description={child.description} className="web-custom__copies" />
      </span>
    ),
    ...(mark === undefined ? {} : { trailing: mark }),
    data: { name: child.label, copies: true, description: child.description, flags: child.flags, editable: child.editable, ...(child.open === undefined ? {} : { open: child.open }) },
  };
}

/** A New button at a writable folder's row end; a click on it does not reach the row. */
function NewButton({ kind, onNew }: { kind: NewKind; onNew: () => void }): ReactElement {
  const { t } = useI18n();
  return (
    <span className="web-custom__new" onClick={(event) => event.stopPropagation()} onKeyDown={(event) => event.stopPropagation()}>
      <Button size="sm" variant="ghost" label={t(kind === 'agent' ? 'agents/customizations/newAgent' : 'agents/customizations/newSkill')} onClick={onNew} />
    </span>
  );
}

/** A customization's row: its name, a short path, what it holds and whether it is on, with its children under it. A writable folder of agents or skills offers New. */
function rowNode(row: CustomizationRow, onNew: (folder: string, kind: NewKind) => void): TreeNode<Detail> {
  const mark = stateMark(row.state);
  const kind = row.newKind;
  return {
    key: row.id,
    icon: ICON[row.type] ?? EMOJIcon.dot,
    label: (
      <span className="web-custom" data-enabled={row.enabled ? 'true' : 'false'} title={`${row.kind}: ${row.path}`}>
        <span className="web-custom__name">{row.name}</span>
        <span className="web-custom__line">{row.path}</span>
        {row.meta.map((bit) => <span key={bit} className="web-custom__flag">{bit}</span>)}
        {kind === undefined ? null : <NewButton kind={kind} onNew={() => onNew(row.uri, kind)} />}
      </span>
    ),
    ...(mark === undefined ? {} : { trailing: mark }),
    data: { name: row.name, copies: false, description: row.path, flags: row.meta, editable: false, ...(row.open === undefined ? {} : { open: row.open }) },
    ...(row.children.length === 0 ? {} : { children: row.children.map((child) => childNode(row.id, child)) }),
  };
}

/** The folder a file URI sits in, which its relative links start from. */
const folderOf = (uri: string): string => uri.replace(/\/[^/]*$/, '');

/** A Markdown file's body, read from the host; a short note when the host cannot read it. */
function FileBody({ host, uri }: { host: string; uri: string }): ReactElement {
  const scena = useScena();
  const { t } = useI18n();
  const state = useFileText(host, uri);
  if (state === null) return <Spinner label={t('agents/customizations/readingFile')} />;
  if ('error' in state || state.text === null) return <p className="web-note">{t('agents/customizations/unreadable')}</p>;
  return (
    <div className="web-md" onClick={linkClicks(scena, host, folderOf(uri))}>
      <Markdown text={withoutFrontmatter(state.text)} />
    </div>
  );
}

/** One customization over the agent page: buttons that copy a child's name and description, its flags and description, then its Markdown file, or a button that opens any other file. A file that may be edited offers Edit. */
function DetailModal({ host, detail, onClose, onEdit }: { host: string; detail: Detail; onClose: () => void; onEdit: (spot: FileSpot) => void }): ReactElement {
  const scena = useScena();
  const { t } = useI18n();
  const open = detail.open;
  const markdown = open !== undefined && (extOf(open.uri) === 'md' || extOf(open.uri) === 'markdown');
  return (
    <Modal open title={detail.name} onClose={onClose}>
      <div className="web-custom-detail">
        {detail.copies ? <Copies name={detail.name} description={detail.description} className="web-custom-detail__copies" /> : null}
        {detail.flags.length === 0 ? null : <p className="web-custom-detail__flags">{detail.flags.join(' · ')}</p>}
        {detail.description === '' ? null : <p>{detail.description}</p>}
        {open !== undefined && detail.editable ? <div className="web-custom-detail__actions"><Button label={t('agents/customizations/edit')} onClick={() => { onClose(); onEdit(open); }} /></div> : null}
        {open === undefined ? null : markdown
          ? <FileBody host={host} uri={open.uri} />
          : <Button label={t('agents/customizations/openFile')} onClick={() => { onClose(); void scena.commands.execute('ahp.openFile', { host, uri: open.uri, line: open.line }); }} />}
      </div>
    </Modal>
  );
}

/** An agent's customizations in one tree: plugins and folders with their children, then MCP servers. A row with children opens and closes on click; any other row shows its detail over the page. */
export function CustomizationTrees({ host, items }: { host: string; items: readonly Customization[] | undefined }): ReactElement {
  // The rows' words are translated as they are built; reading the language here redraws them when it changes.
  useI18n();
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<string | null>(null);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [editing, setEditing] = useState<{ spot: FileSpot; title: string } | null>(null);
  const scena = useScena();
  const edit = (spot: FileSpot, title: string): void => openCustomFile(scena, host, spot, (shown) => setEditing({ spot: shown, title }));
  const make = (folder: string, kind: NewKind): void => {
    void newCustomFile(scena, host, folder, kind, (shown) => setEditing({ spot: shown, title: customFileTitle(shown.uri) }));
  };
  return (
    <>
      <Tree<Detail>
        className="web-customs"
        nodes={customizationRows(items).map((row) => rowNode(row, make))}
        selectedKey={selected}
        expanded={expanded}
        onExpandedChange={setExpanded}
        onSelect={(node) => {
          setSelected(node.key);
          if (node.children !== undefined) {
            const next = new Set(expanded);
            if (!next.delete(node.key)) next.add(node.key);
            setExpanded(next);
          } else if (node.data !== undefined) {
            setDetail(node.data);
          }
        }}
      />
      {detail === null ? null : <DetailModal host={host} detail={detail} onClose={() => setDetail(null)} onEdit={(spot) => edit(spot, detail.name)} />}
      {editing === null ? null : <FileModal host={host} spot={editing.spot} title={editing.title} onClose={() => setEditing(null)} />}
    </>
  );
}
