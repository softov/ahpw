import { useEffect, useRef, type ReactElement } from 'react';
import { autocompletion, closeBrackets, closeBracketsKeymap, completionKeymap } from '@codemirror/autocomplete';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { bracketMatching, foldGutter, foldKeymap, HighlightStyle, indentOnInput, syntaxHighlighting } from '@codemirror/language';
import { highlightSelectionMatches, search, searchKeymap } from '@codemirror/search';
import { Annotation, Compartment, EditorSelection, EditorState, type Extension } from '@codemirror/state';
import {
  drawSelection, dropCursor, EditorView, highlightActiveLine, highlightActiveLineGutter,
  highlightSpecialChars, keymap, lineNumbers, rectangularSelection,
} from '@codemirror/view';
import { tags } from '@lezer/highlight';
import { loadLanguage, type LanguageKey } from './languages.js';

/** What the editor shows and what it tells its owner. */
export interface CodeEditorProps {
  /** The text; a new value replaces what the editor holds. */
  value: string;
  /** The language to highlight, as `languageOf` names it; none for plain text. */
  language?: LanguageKey | null;
  readOnly?: boolean;
  /** The first line to select and scroll to, from 1. */
  line?: number | null;
  /** The last line to select, from 1; the first line alone when absent. */
  end?: number | null;
  /** Called with the whole text after each edit. */
  onChange?: (text: string) => void;
  /** Called with the whole text on Mod-s. */
  onSave?: (text: string) => void;
  /** More CodeMirror extensions, as a linter; read once, when the editor is made. */
  extensions?: Extension;
}

/** Marks a change that came from `value`, which is not an edit. */
const external = Annotation.define<boolean>();

/** A mix of a theme colour with transparent, so the selection layer under the text still shows. */
const tint = (color: string, percent: number): string => `color-mix(in srgb, var(${color}) ${percent}%, transparent)`;

/** The editor's chrome, in the theme's colours, so light and dark follow it without a reload. */
const theme = EditorView.theme({
  '&': {
    height: '100%',
    color: 'var(--oo-color-text)',
    backgroundColor: 'var(--oo-color-canvas)',
    fontSize: 'var(--oo-font-size-xs)',
  },
  '.cm-scroller': { fontFamily: 'var(--oo-font-mono, monospace)', lineHeight: '1.5' },
  '.cm-content': { caretColor: 'var(--oo-color-accent)' },
  '.cm-cursor, .cm-dropCursor': { borderLeftColor: 'var(--oo-color-accent)' },
  '.cm-selectionBackground, &.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground, .cm-content ::selection': {
    backgroundColor: tint('--oo-color-accent', 28),
  },
  '.cm-activeLine': { backgroundColor: tint('--oo-color-text', 5) },
  '.cm-gutters': {
    backgroundColor: 'var(--oo-color-canvas)',
    color: 'var(--oo-color-muted)',
    borderRight: '1px solid var(--oo-color-border)',
  },
  '.cm-activeLineGutter': { backgroundColor: tint('--oo-color-text', 5), color: 'var(--oo-color-text)' },
  '.cm-foldPlaceholder': {
    backgroundColor: 'var(--oo-color-hover)',
    border: '1px solid var(--oo-color-border)',
    color: 'var(--oo-color-muted)',
  },
  '.cm-selectionMatch': { backgroundColor: tint('--oo-color-accent', 14) },
  '&.cm-focused .cm-matchingBracket': { backgroundColor: tint('--oo-color-accent', 30), outline: '1px solid var(--oo-color-accent)' },
  '&.cm-focused .cm-nonmatchingBracket': { backgroundColor: tint('--oo-color-danger', 30) },
  '.cm-searchMatch': { backgroundColor: tint('--oo-color-warning', 30) },
  '.cm-searchMatch.cm-searchMatch-selected': { backgroundColor: tint('--oo-color-warning', 60) },
  '.cm-panels': { backgroundColor: 'var(--oo-color-panel)', color: 'var(--oo-color-text)' },
  '.cm-panels.cm-panels-top': { borderBottom: '1px solid var(--oo-color-border)' },
  '.cm-panels.cm-panels-bottom': { borderTop: '1px solid var(--oo-color-border)' },
  '.cm-textfield': {
    backgroundColor: 'var(--oo-color-canvas)',
    color: 'var(--oo-color-text)',
    border: '1px solid var(--oo-color-border)',
    borderRadius: 'var(--oo-radius-sm)',
  },
  '.cm-button': {
    backgroundImage: 'none',
    backgroundColor: 'var(--oo-color-surface)',
    color: 'var(--oo-color-text)',
    border: '1px solid var(--oo-color-border)',
    borderRadius: 'var(--oo-radius-sm)',
  },
  '.cm-tooltip': {
    backgroundColor: 'var(--oo-color-raised)',
    color: 'var(--oo-color-text)',
    border: '1px solid var(--oo-color-border)',
  },
  '.cm-diagnostic-error': { borderLeftColor: 'var(--oo-color-danger)' },
  '.cm-diagnostic-warning': { borderLeftColor: 'var(--oo-color-warning)' },
  '.cm-tooltip-autocomplete > ul > li[aria-selected]': {
    backgroundColor: 'var(--oo-color-selected)',
    color: 'var(--oo-color-text)',
  },
});

/** Syntax colours, from the `--ahpw-code-*` variables in app.css. */
const highlight = HighlightStyle.define([
  { tag: [tags.keyword, tags.controlKeyword, tags.moduleKeyword, tags.operatorKeyword, tags.definitionKeyword, tags.modifier], color: 'var(--ahpw-code-keyword)' },
  { tag: [tags.string, tags.special(tags.string), tags.regexp, tags.character], color: 'var(--ahpw-code-string)' },
  { tag: [tags.number, tags.bool, tags.null, tags.atom, tags.unit], color: 'var(--ahpw-code-number)' },
  { tag: [tags.comment, tags.lineComment, tags.blockComment, tags.docComment], color: 'var(--ahpw-code-comment)', fontStyle: 'italic' },
  { tag: [tags.function(tags.variableName), tags.function(tags.propertyName), tags.macroName], color: 'var(--ahpw-code-function)' },
  { tag: [tags.typeName, tags.className, tags.namespace, tags.standard(tags.typeName)], color: 'var(--ahpw-code-type)' },
  { tag: [tags.propertyName, tags.definition(tags.propertyName), tags.labelName], color: 'var(--ahpw-code-property)' },
  { tag: [tags.tagName, tags.angleBracket], color: 'var(--ahpw-code-tag)' },
  { tag: tags.attributeName, color: 'var(--ahpw-code-attribute)' },
  { tag: [tags.meta, tags.processingInstruction, tags.annotation], color: 'var(--ahpw-code-meta)' },
  { tag: tags.heading, color: 'var(--ahpw-code-keyword)', fontWeight: '600' },
  { tag: [tags.link, tags.url], color: 'var(--ahpw-code-string)', textDecoration: 'underline' },
  { tag: tags.emphasis, fontStyle: 'italic' },
  { tag: tags.strong, fontWeight: '600' },
  { tag: tags.strikethrough, textDecoration: 'line-through' },
  { tag: tags.invalid, color: 'var(--oo-color-danger)' },
]);

/** Whether the text can be changed, as the state and the view each need it. */
const editable = (readOnly: boolean): Extension => [EditorState.readOnly.of(readOnly), EditorView.editable.of(!readOnly)];

/** Select lines `line` to `end` and bring them to the middle of the view. */
function reveal(view: EditorView, line: number, end: number | null | undefined): void {
  const doc = view.state.doc;
  const first = doc.line(Math.min(Math.max(line, 1), doc.lines));
  const last = doc.line(Math.min(Math.max(end ?? line, first.number), doc.lines));
  view.dispatch({
    selection: EditorSelection.range(first.from, last.to),
    effects: EditorView.scrollIntoView(first.from, { y: 'center' }),
  });
}

/** A code editor: line numbers, folding, bracket matching, search and the language's colours. */
export default function CodeEditor({ value, language = null, readOnly = false, line, end, onChange, onSave, extensions = [] }: CodeEditorProps): ReactElement {
  const host = useRef<HTMLDivElement>(null);
  const view = useRef<EditorView | null>(null);
  const languageSlot = useRef(new Compartment());
  const readOnlySlot = useRef(new Compartment());
  const handlers = useRef({ onChange, onSave });
  handlers.current = { onChange, onSave };

  useEffect(() => {
    const parent = host.current;
    if (parent === null) return;
    const created = new EditorView({
      parent,
      state: EditorState.create({
        doc: value,
        extensions: [
          lineNumbers(),
          highlightActiveLineGutter(),
          highlightSpecialChars(),
          history(),
          foldGutter(),
          drawSelection(),
          dropCursor(),
          EditorState.allowMultipleSelections.of(true),
          indentOnInput(),
          syntaxHighlighting(highlight),
          bracketMatching(),
          closeBrackets(),
          autocompletion(),
          rectangularSelection(),
          highlightActiveLine(),
          highlightSelectionMatches(),
          search({ top: true }),
          keymap.of([
            { key: 'Mod-s', preventDefault: true, run: (target) => { handlers.current.onSave?.(target.state.doc.toString()); return true; } },
            ...closeBracketsKeymap,
            ...defaultKeymap,
            ...searchKeymap,
            ...historyKeymap,
            ...foldKeymap,
            ...completionKeymap,
            indentWithTab,
          ]),
          theme,
          extensions,
          languageSlot.current.of([]),
          readOnlySlot.current.of(editable(readOnly)),
          EditorView.updateListener.of((update) => {
            if (!update.docChanged || update.transactions.some((one) => one.annotation(external) === true)) return;
            handlers.current.onChange?.(update.state.doc.toString());
          }),
        ],
      }),
    });
    view.current = created;
    return () => {
      created.destroy();
      view.current = null;
    };
    // The view is made once; the effects below keep it current.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const current = view.current;
    if (current === null || current.state.doc.toString() === value) return;
    current.dispatch({ changes: { from: 0, to: current.state.doc.length, insert: value }, annotations: external.of(true) });
  }, [value]);

  useEffect(() => {
    let alive = true;
    loadLanguage(language)
      .then((support) => { if (alive) view.current?.dispatch({ effects: languageSlot.current.reconfigure(support) }); })
      .catch(() => undefined);
    return () => { alive = false; };
  }, [language]);

  useEffect(() => {
    view.current?.dispatch({ effects: readOnlySlot.current.reconfigure(editable(readOnly)) });
  }, [readOnly]);

  useEffect(() => {
    const current = view.current;
    if (current !== null && typeof line === 'number') reveal(current, line, end);
  }, [line, end, value]);

  return <div className="web-editor" ref={host} />;
}
