import { describe, expect, it } from 'vitest';
import type { ConnectorModel } from '../../bridges/connectors.js';
import { matches, perMillion, priceLine } from './models.js';

const CLAUDE: ConnectorModel = { id: 'anthropic/claude-sonnet', model: 'or/anthropic/claude-sonnet', name: 'Anthropic: Claude Sonnet', pricing: { prompt: '0.000003', completion: '0.000015' } };

describe('the models tab', () => {
  it('finds a model by every word of the search, in its id or its name, never by the prefix every row shares', () => {
    expect(matches(CLAUDE, '')).toBe(true);
    expect(matches(CLAUDE, 'SONNET anthropic')).toBe(true);
    expect(matches(CLAUDE, 'anthropic/claude')).toBe(true);
    expect(matches(CLAUDE, 'or/')).toBe(false);
    expect(matches(CLAUDE, 'sonnet gpt')).toBe(false);
  });

  it('prices per million tokens, prompt over answer', () => {
    expect(priceLine(CLAUDE, 'en')).toBe('$3 / $15');
    expect(perMillion('0.00000015', 'en')).toBe('$0.15');
    expect(perMillion('0', 'en')).toBe('$0');
    expect(perMillion('free', 'en')).toBeUndefined();
    expect(priceLine({ id: 'x', model: 'or/x', pricing: { completion: '0.000001' } }, 'en')).toBe('- / $1');
    expect(priceLine({ id: 'x', model: 'or/x' }, 'en')).toBeUndefined();
  });
});
