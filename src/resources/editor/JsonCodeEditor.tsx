import type { ReactElement } from 'react';
import type { JsonEditorProps } from '@softov/scena/ui';
import { jsonParseLinter } from '@codemirror/lang-json';
import { lintGutter, linter } from '@codemirror/lint';
import CodeEditor from './CodeEditor.js';

/** JSON that does not parse is marked where it breaks: in the gutter, under the text, and with the parser's words on hover. */
const JSON_LINT = [linter(jsonParseLinter(), { delay: 250 }), lintGutter()];

/** A form's JSON text in the code editor, with JSON highlighting and lint, for `SchemaForm`'s `jsonEditor`. */
export function JsonCodeEditor({ value, onChange }: JsonEditorProps): ReactElement {
  return <CodeEditor value={value} language="json" onChange={onChange} extensions={JSON_LINT} />;
}
