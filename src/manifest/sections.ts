import { groupOf } from './input.js';
import type { ManifestCommand, ProgramManifest } from './types.js';

/** One group of commands, as one activity bar entry and its sidebar list. */
export interface Section {
  /** The group's name, as the commands carry it. */
  name: string;
  title: string;
  /** What the activity bar shows: the program's icon, or letters from the name. */
  icon: string;
  commands: ManifestCommand[];
}

/**
 * The shortest start of each name that no other name starts with.
 *
 * `user` and `usage` are `Use` and `Usa`; a name that is the start of another
 * is shown whole.
 */
export function shortNames(names: readonly string[]): Map<string, string> {
  const short = new Map<string, string>();
  for (const name of names) {
    let length = 1;
    while (length < name.length && names.some((other) => other !== name && other.slice(0, length) === name.slice(0, length))) length += 1;
    const letters = name.slice(0, length);
    short.set(name, letters.charAt(0).toUpperCase() + letters.slice(1));
  }
  return short;
}

/** Every group the manifest's commands fall in, in the order they first appear. */
export function sectionsOf(manifest: ProgramManifest): Section[] {
  const declared = new Map((manifest.groups ?? []).map((group) => [group.name, group]));
  const sections = new Map<string, Section>();
  for (const command of manifest.commands) {
    const name = groupOf(command);
    let section = sections.get(name);
    if (section === undefined) {
      section = { name, title: declared.get(name)?.title ?? name, icon: '', commands: [] };
      sections.set(name, section);
    }
    section.commands.push(command);
  }
  const letters = shortNames([...sections.keys()]);
  for (const section of sections.values()) section.icon = declared.get(section.name)?.icon ?? letters.get(section.name) ?? section.name;
  return [...sections.values()];
}

/** The sidebar section id of a group. */
export const sectionId = (group: string): string => `group:${group}`;
