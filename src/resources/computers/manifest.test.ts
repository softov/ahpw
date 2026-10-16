import { describe, expect, it } from 'vitest';
import { formSchema, manifestBody, nameProblem } from './manifest.js';
import { sizeWords, usageOf } from './usage.js';

describe('formSchema', () => {
  it('reads x-choices as x-enumOptions, and leaves out a field with one allowed value', () => {
    const schema = formSchema({
      type: 'object',
      properties: {
        runtime: { type: 'string', enum: ['docker'], default: 'docker' },
        source: { type: 'string', title: 'Source', enum: ['image', 'devcontainer'], 'x-choices': [{ value: 'image', title: 'Image', description: 'What to make it from.' }, { value: 'devcontainer', title: 'Dev container' }] },
        mounts: { type: 'array', items: { type: 'string' } },
      },
    });
    expect(Object.keys(schema.properties ?? {})).toEqual(['source', 'mounts']);
    expect(schema.properties?.source).toEqual({
      type: 'string',
      title: 'Source',
      enum: ['image', 'devcontainer'],
      'x-enumOptions': [{ value: 'image', label: 'Image', description: 'What to make it from.' }, { value: 'devcontainer', label: 'Dev container' }],
    });
  });

  it('is empty without a manifest', () => {
    expect(formSchema(undefined)).toEqual({ type: 'object', properties: {} });
  });
});

describe('manifestBody', () => {
  it('trims the answers and leaves out blank ones', () => {
    expect(manifestBody({ image: ' ubuntu ', cpus: '', mounts: ['/a:/a', ' '], memory: undefined })).toEqual({ image: 'ubuntu', mounts: ['/a:/a'] });
  });
});

describe('nameProblem', () => {
  it('refuses what a host refuses', () => {
    expect(nameProblem(' ')).toBe('nameEmpty');
    expect(nameProblem('a/b')).toBe('nameSlash');
    expect(nameProblem('..')).toBe('nameDots');
    expect(nameProblem('box')).toBeUndefined();
  });
});

describe('usageOf', () => {
  it('reads a running machine, and nothing for a stopped one or bad text', () => {
    expect(usageOf(JSON.stringify({ running: true, cpu: { percent: 12.5, cores: 2 }, memory: { used: 1024, limit: 4096, percent: 25 }, pids: 3 })))
      .toEqual({ cpu: { percent: 12.5, cores: 2 }, memory: { used: 1024, limit: 4096, percent: 25 }, pids: 3 });
    expect(usageOf(JSON.stringify({ running: false }))).toBeNull();
    expect(usageOf('{nope')).toBeNull();
    expect(usageOf(null)).toBeNull();
  });

  it('writes sizes in binary units', () => {
    expect(sizeWords(512)).toBe('512 B');
    expect(sizeWords(1536)).toBe('1.5 KiB');
    expect(sizeWords(536870912)).toBe('512 MiB');
  });
});
