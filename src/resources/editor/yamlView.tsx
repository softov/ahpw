import { useEffect, useRef, useState, type ReactElement } from 'react';
import { fieldsView, jsonView, type SchemaFormView, type SchemaFormViewProps } from '@softov/scena/ui';
import { parse, stringify } from 'yaml';
import CodeEditor from './CodeEditor.js';

/** A form's value as YAML text; an empty value is empty text, which reads back as `{}`. */
export function yamlOf(value: Record<string, unknown>): string {
  return Object.keys(value).length === 0 ? '' : stringify(value);
}

/** The value YAML text holds, or the reason it is not one: the text must be a mapping, and empty text is `{}`. */
export function yamlProblem(text: string): { parsed: Record<string, unknown>; error: null } | { parsed: undefined; error: string } {
  try {
    const parsed = (text.trim() === '' ? {} : parse(text)) as unknown;
    if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) return { parsed: parsed as Record<string, unknown>, error: null };
    return { parsed: undefined, error: 'The YAML must be a mapping.' };
  } catch (error) {
    // The parser's first line names the problem, its line and its column; the lines after it quote the text.
    return { parsed: undefined, error: (error instanceof Error ? error.message : String(error)).split('\n')[0] ?? '' };
  }
}

/**
 * The value as YAML text. It holds the text it shows, so a draft that does not
 * parse stays on screen with its error; a value it did not send replaces the
 * text, as a reset or the host's own change.
 */
function YamlView({ value, onChange }: SchemaFormViewProps): ReactElement {
  const shown = JSON.stringify(value);
  const [text, setText] = useState(() => yamlOf(value));
  const [error, setError] = useState<string | null>(null);
  const sent = useRef(shown);
  useEffect(() => {
    if (shown === sent.current) return;
    sent.current = shown;
    setText(yamlOf(value));
    setError(null);
  }, [shown, value]);
  const edit = (next: string): void => {
    setText(next);
    const problem = yamlProblem(next);
    setError(problem.error);
    if (problem.error !== null) return;
    sent.current = JSON.stringify(problem.parsed);
    onChange(problem.parsed);
  };
  return (
    <>
      <div className="oo-schema-form__json-editor">
        <CodeEditor value={text} language="yaml" onChange={edit} />
      </div>
      {error === null ? null : <p className="oo-schema-form__json-error" role="alert">{error}</p>}
    </>
  );
}

/** The YAML view of a `SchemaForm`, beside its fields and json views. */
export const yamlView: SchemaFormView = { id: 'yaml', label: 'yaml', render: YamlView };

/** The views of a record's settings form: its fields, json and yaml. */
export const SETTINGS_VIEWS: SchemaFormView[] = [fieldsView, jsonView, yamlView];
