import { useState, type ReactElement, type ReactNode } from 'react';
import { Alert, DataTable, DetailList, Text, type DataColumn, type DataRow } from '@softov/scena/ui';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isScalar = (value: unknown): boolean => value === null || ['string', 'number', 'boolean'].includes(typeof value);

/** One value as a table cell: scalars as they are, anything else as compact JSON. */
function cellOf(value: unknown): string {
  if (value === undefined || value === null) return '';
  if (isScalar(value)) return String(value);
  if (Array.isArray(value) && value.every(isScalar)) return value.join(', ');
  return JSON.stringify(value);
}

/** An array, as a table: one column per key any row has, or one column of values. */
function TableOf({ items }: { items: unknown[] }): ReactElement {
  if (items.length === 0) return <Text muted text="Nothing." />;
  if (!items.every(isRecord)) {
    const rows: DataRow[] = items.map((item, index) => ({ key: String(index), value: cellOf(item) }));
    return <DataTable columns={[{ key: 'value', label: 'value' }]} rows={rows} rowKey="key" />;
  }
  const keys = [...new Set(items.flatMap((item) => Object.keys(item)))];
  const columns: DataColumn[] = keys.map((key) => ({ key, label: key }));
  const rows: DataRow[] = items.map((item, index) => ({
    ...Object.fromEntries(keys.map((key) => [key, cellOf(item[key])])),
    __row: String(index),
  }));
  return <DataTable columns={columns} rows={rows} rowKey="__row" />;
}

/** Any JSON value, drawn by its shape. */
function ShapeOf({ value }: { value: unknown }): ReactElement {
  if (value === null || value === undefined) return <Alert tone="success" message="Done." />;
  if (isScalar(value)) return <pre className="web-result__text">{String(value)}</pre>;
  if (Array.isArray(value)) return <TableOf items={value} />;
  const record = value as Record<string, unknown>;
  const entries = Object.entries(record);
  if (entries.length === 0) return <Text muted text="Nothing." />;
  return (
    <DetailList
      columns={1}
      items={entries.map(([key, one]) => {
        const nested = !isScalar(one) && !(Array.isArray(one) && one.every(isScalar));
        const shown: ReactNode = nested ? <ShapeOf value={one} /> : cellOf(one);
        return { label: key, value: shown, span: nested };
      })}
    />
  );
}

/** A command's answer, with the raw JSON a click away. */
export default function Result({ value }: { value: unknown }): ReactElement {
  const [raw, setRaw] = useState(false);
  return (
    <section className="web-result">
      <div className="web-result__bar">
        <button type="button" data-active={!raw} onClick={() => setRaw(false)}>view</button>
        <button type="button" data-active={raw} onClick={() => setRaw(true)}>json</button>
      </div>
      {raw ? <pre className="web-result__json">{JSON.stringify(value, null, 2)}</pre> : <ShapeOf value={value} />}
    </section>
  );
}
