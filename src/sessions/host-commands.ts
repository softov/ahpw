import type { BindingPath, Disposable, Scena } from '@softov/scena/types';
import { combineDisposables } from '@softov/scena';
import { COMPOSER_SLOT } from './composer-commands.js';

/** Which composer has the focus, so the `/` list offers that chat's host commands. */
export const COMPOSER_FOCUS = '$/ahp/composerFocus' as BindingPath;

/** One `/` command the host offers for a chat. */
export interface HostCommand {
  /** What the command writes into the box. */
  insert: string;
  label: string;
  detail: string | undefined;
  /** The host's argument hint: `<file>`, `[message]`. */
  hint: string | undefined;
}

type Bag = Record<string, unknown>;
const bagOf = (value: unknown): Bag => (typeof value === 'object' && value !== null ? value as Bag : {});
const textOf = (value: unknown): string | undefined => (typeof value === 'string' && value !== '' ? value : undefined);

/** A `completions` answer for `/` read into commands. An entry with nothing to insert is dropped. */
export function hostCommands(value: unknown): HostCommand[] {
  const items = bagOf(value).items;
  return (Array.isArray(items) ? items : [])
    .map((raw): HostCommand => {
      const item = bagOf(raw);
      const meta = bagOf(bagOf(item.attachment)._meta);
      const insert = textOf(item.insertText) ?? '';
      return { insert, label: textOf(meta.command) ?? insert, detail: textOf(meta.description), hint: textOf(meta.argumentHint) };
    })
    .filter((one) => one.insert !== '');
}

/** A chat's host commands in the composer's `/` list, offered while that composer has the focus. */
export function registerHostCommands(scena: Scena, focus: string, commands: readonly HostCommand[]): Disposable {
  return combineDisposables(...commands.map((command) => scena.commands.register({
    id: `ahp.composer.host.${focus}.${command.insert}`,
    title: command.hint === undefined ? command.label : `${command.label} ${command.hint}`,
    ...(command.detail === undefined ? {} : { description: command.detail }),
    category: 'Agent',
    shortcut: command.label.startsWith('/') ? command.label : `/${command.label}`,
    slots: [COMPOSER_SLOT],
    when: `${COMPOSER_FOCUS} == "${focus}"`,
    run: (ctx) => ctx.host?.replaceActiveToken(`${command.insert} `),
  })));
}
