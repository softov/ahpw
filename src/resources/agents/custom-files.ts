import type { BindingPath, Scena } from '@softov/scena/types';
import { translate } from '@softov/scena';
import { hostBridge } from '../../bridges/data.js';
import { failed } from '../../shell/notify/say.js';
import { chatChoice } from '../sessions/view-settings.js';
import { TEXT_VIEWER } from '../files/viewers.js';
import { askName } from '../folders/ask.js';
import { nameProblem } from '../folders/menu.js';
import { childUri } from '../folders/roots.js';
import type { FileSpot, NewKind } from './words.js';

/** Where an agent's or skill's file opens to edit, as `ui.customFileOpens` sets it: a new panel, or a modal over the page. */
export const CUSTOM_FILE_OPENS = chatChoice('$/ahp/agents/customFileOpens' as BindingPath, 'ahpw.customFileOpens', ['panel', 'modal'], 'panel');

/** Open a custom file in the text editor: as a tab, or through `showModal` when the setting says a modal. */
export function openCustomFile(scena: Pick<Scena, 'store' | 'commands'>, host: string, spot: FileSpot, showModal: (spot: FileSpot) => void): void {
  if (CUSTOM_FILE_OPENS.read(scena.store) === 'modal') {
    showModal(spot);
    return;
  }
  void scena.commands.execute('ahp.openFile', { host, uri: spot.uri, line: spot.line, viewer: TEXT_VIEWER });
}

/** The name a new file takes: what was typed, without a `.md` an agent's name was typed with. */
const bareName = (kind: NewKind, name: string): string => (kind === 'agent' ? name.trim().replace(/\.md$/i, '') : name.trim());

/** Where a new file goes in `folder`: `<name>.md` for an agent, `<name>/SKILL.md` for a skill. */
export function customFileUri(folder: string, kind: NewKind, name: string): string {
  const bare = bareName(kind, name);
  return kind === 'agent' ? childUri(folder, `${bare}.md`) : `${childUri(folder, bare)}/SKILL.md`;
}

/** The text a new file starts with: frontmatter with its name and a description to fill in, then a body to replace. */
export function customFileTemplate(kind: NewKind, name: string): string {
  const bare = bareName(kind, name);
  return kind === 'agent'
    ? `---\nname: ${bare}\ndescription: When to use this agent, in one line.\n---\n\nYou are ${bare}. Say what this agent does and how it works.\n`
    : `---\nname: ${bare}\ndescription: What this skill does and when to use it, in one line.\n---\n\n# ${bare}\n\nThe steps the agent follows when this skill is used.\n`;
}

/** What a custom file is called: a skill's folder name, or an agent's file name without `.md`. */
export function customFileTitle(uri: string): string {
  const parts = uri.split('/');
  const last = decodeURIComponent(parts.at(-1) ?? '');
  return last === 'SKILL.md' ? decodeURIComponent(parts.at(-2) ?? last) : last.replace(/\.md$/i, '');
}

/** Ask a name, write a new agent or skill from its template into `folder`, and open it. The host refuses a name that exists. */
export async function newCustomFile(scena: Pick<Scena, 'store' | 'commands'>, host: string, folder: string, kind: NewKind, showModal: (spot: FileSpot) => void): Promise<void> {
  const name = await askName({
    title: translate(kind === 'agent' ? 'agents/customizations/newAgent' : 'agents/customizations/newSkill'),
    confirmLabel: translate('agents/customizations/create'),
    check: nameProblem,
  });
  if (name === null) return;
  const uri = customFileUri(folder, kind, name);
  try {
    if (kind === 'skill') await hostBridge(host).makeFolder(uri.replace(/\/SKILL\.md$/, ''));
    await hostBridge(host).writeResource(uri, customFileTemplate(kind, name), 'utf-8', true);
  } catch (error) {
    failed(translate('agents/customizations/failed'), error, { source: 'agents.newFile' });
    return;
  }
  openCustomFile(scena, host, { uri, line: null }, showModal);
}
