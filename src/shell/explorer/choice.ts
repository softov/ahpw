import { combineDisposables, translate } from '@softov/scena';
import type { BindingPath, Disposable, ListSpec, Scena } from '@softov/scena/types';
import { openPalette } from '../CommandPalette.js';

/** One choice of a side bar list, such as how it is grouped: a header button with a menu of its values. */
export interface Choice<T extends string> {
  /** The resource whose list it is, as its words and commands are named: `automations`, `computers`. */
  resource: string;
  /** The choice, as `group`, `sort` or `status`. */
  name: string;
  /** The menu slot of its values. */
  slot: string;
  /** Where the store keeps it; null while it is the usual one, so the button is pressed only when it is not. */
  path: BindingPath;
  values: readonly T[];
  usual: T;
  /** Where each browser keeps it. */
  key: string;
  /** Whether a value is offered now. */
  when?: (value: T) => boolean;
}

/** A choice kept in storage, or its usual value when none is kept or storage is shut. */
export function readChoice<T extends string>(key: string, values: readonly T[], usual: T): T {
  try {
    const held = localStorage.getItem(key);
    return values.some((one) => one === held) ? held as T : usual;
  } catch {
    return usual;
  }
}

function writeChoice(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Not kept, which only means the next visit starts as the list was.
  }
}

/**
 * The header button's command, `<resource>.<name>`, and one command per
 * value, `<resource>.<name>.<value>`, ticked while chosen. Their words are
 * `<resource>/explorer/<name>` and `<resource>/<name>/<value>`.
 */
export function registerChoice<T extends string>(scena: Scena, choice: Choice<T>): Disposable {
  const { resource, name, slot, path, values, usual, key, when } = choice;
  const held = readChoice(key, values, usual);
  scena.store.set(path, held === usual ? null : held);
  return combineDisposables(
    scena.commands.register({
      id: `${resource}.${name}`,
      title: () => translate(`${resource}/explorer/${name}`),
      run: (ctx) => {
        const list: ListSpec = { title: translate(`${resource}/explorer/${name}`), query: { slot } };
        if (ctx.host !== undefined) ctx.host.pushList(list);
        else openPalette(ctx.scena, list);
      },
    }),
    ...values.map((value) => scena.commands.register({
      id: `${resource}.${name}.${value}`,
      title: () => translate(`${resource}/${name}/${value}`),
      slots: [slot],
      ...(when === undefined ? {} : { when: () => when(value) }),
      active: (ctx) => (ctx.store.get<T | null>(path) ?? usual) === value,
      run: (ctx) => {
        ctx.store.set(path, value === usual ? null : value);
        writeChoice(key, value);
      },
    })),
  );
}
