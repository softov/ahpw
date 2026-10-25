import { describe, expect, it } from 'vitest';
import { readTemplates, templatesIn } from './templates.js';

describe('templatesIn', () => {
  it('reads every shipped file, each with an emoji and a five-field schedule', () => {
    const templates = templatesIn('en');
    expect(templates).toHaveLength(20);
    for (const one of templates) {
      expect(one.emoji).not.toBe('');
      expect(one.expression.split(' ')).toHaveLength(5);
    }
  });

  it('reads the language ahpw is in, with es-419 reading the files\' es', () => {
    expect(templatesIn('pt-BR').find((one) => one.id === 'morning-brief')?.title).toBe('Resumo da manhã');
    expect(templatesIn('es-419').find((one) => one.id === 'morning-brief')?.title).toBe('Resumen de la mañana');
  });
});

describe('readTemplates', () => {
  const index = { templates: [{ id: 'a', file: 'a.json' }, { id: 'b', file: 'b.json' }, { id: 'c', file: 'missing.json' }] };

  it('leaves out a file that is missing or has no schedule, and falls back to English', () => {
    const files = {
      'a.json': { icon: 'Ionicons:nothing', group: 'everyday', time: '0  7 * * *', title: { en: 'A' }, prompt: 'Say a' },
      'b.json': { icon: 'Ionicons:sunny', time: 'daily', title: 'B', prompt: 'Say b' },
    };
    const read = readTemplates(index, files, 'pt-BR');
    expect(read.map((one) => one.id)).toEqual(['a']);
    expect(read[0]).toMatchObject({ title: 'A', group: 'everyday', expression: '0 7 * * *' });
  });

  it('answers an index that is not one with nothing', () => {
    expect(readTemplates(null, {}, 'en')).toEqual([]);
  });
});
