import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { RemovableChip } from './RemovableChip.js';

const markup = (props: Parameters<typeof RemovableChip>[0]): string => renderToStaticMarkup(createElement(RemovableChip, props));

describe('RemovableChip', () => {
  it('has no ✕ without onRemove', () => {
    expect(markup({ label: 'admin', removeLabel: 'Take admin away' })).not.toContain('<button');
  });

  it('names its ✕ with removeLabel', () => {
    const html = markup({ label: 'admin', removeLabel: 'Take admin away', onRemove: () => undefined });
    expect(html).toContain('aria-label="Take admin away"');
    expect(html).toContain('class="web-chip__remove"');
  });

  it('marks a held chip on, and titles it by its label unless told', () => {
    expect(markup({ label: 'ops', on: true, removeLabel: 'x' })).toContain('data-on="true"');
    expect(markup({ label: 'ops', removeLabel: 'x' })).toContain('title="ops"');
    expect(markup({ label: 'ops', title: 'ops · primary', removeLabel: 'x' })).toContain('title="ops · primary"');
  });
});
