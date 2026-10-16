import { describe, expect, it } from 'vitest';
import { sectionsOf, shortNames } from './sections.js';
import type { ManifestCommand, ProgramManifest } from './types.js';

const command = (id: string): ManifestCommand => ({
  id,
  pattern: id.split('.'),
  summary: id,
  http: { method: 'GET', path: `/${id.replaceAll('.', '/')}` },
});

describe('shortNames', () => {
  it('takes the shortest start no other name shares', () => {
    const names = ['daemon', 'user', 'team', 'project', 'plugin', 'proxy', 'usage', 'vault'];
    expect(Object.fromEntries(shortNames(names))).toEqual({
      daemon: 'D', user: 'Use', team: 'T', project: 'Proj', plugin: 'Pl', proxy: 'Prox', usage: 'Usa', vault: 'V',
    });
  });

  it('shows a name whole when it starts another', () => {
    expect(Object.fromEntries(shortNames(['use', 'user']))).toEqual({ use: 'Use', user: 'User' });
  });
});

describe('sectionsOf', () => {
  const manifest: ProgramManifest = {
    cofold: 1,
    program: { name: 'ahpd', version: '0.9.0' },
    commands: [command('daemon.status'), command('user.list'), command('daemon.config'), command('user.add')],
  };

  it('groups commands in the order their groups first appear', () => {
    expect(sectionsOf(manifest).map((section) => [section.name, section.icon, section.commands.map((one) => one.id)])).toEqual([
      ['daemon', 'D', ['daemon.status', 'daemon.config']],
      ['user', 'U', ['user.list', 'user.add']],
    ]);
  });

  it('takes the title and icon a program declares, the icon in its monochrome form', () => {
    const declared = { ...manifest, groups: [{ name: 'user', title: 'People', icon: '☺\u{FE0F}' }] };
    expect(sectionsOf(declared)[1]).toMatchObject({ title: 'People', icon: '☺\u{FE0E}' });
  });
});
