import { useRef, useState, type ReactElement } from 'react';
import { Button } from '@softov/scena/ui';
import { ContextMenu } from '@softov/scena/ui/menu';

/** One entry of a pick menu: what it means, and how it reads. */
export interface Pick<T> {
  value: T;
  title: string;
}

interface PickTwoProps<T> {
  /** The first button's words, before anything is picked. */
  firstLabel: string;
  /** The first menu's header, what it lists. */
  firstHeader: string;
  firsts: readonly Pick<string>[];
  /** The second button's words, once the first is picked. */
  secondLabel: string;
  /** The second menu's header, what it lists. */
  secondHeader: string;
  /** What the second menu offers for what was picked first. */
  seconds: (first: string) => readonly Pick<T>[];
  onPick: (first: string, second: T) => void;
}

/** Which menu is open, and where. */
type Menu = { kind: 'first' | 'second'; x: number; y: number };

/**
 * Two buttons that pick in turn, each opening a menu, as ahpapp's
 * *Add to a team* then *Which projects*: the first button then reads what was
 * picked, and the second asks what goes with it. Each menu is headed by
 * what it lists, as a menu group's label.
 */
export function PickTwo<T>({ firstLabel, firstHeader, firsts, secondLabel, secondHeader, seconds, onPick }: PickTwoProps<T>): ReactElement {
  const [first, setFirst] = useState<string | null>(null);
  const [menu, setMenu] = useState<Menu | null>(null);
  // scena's Button gives its click no event, so a menu opens under the box around the buttons.
  const bar = useRef<HTMLDivElement>(null);
  const open = (kind: Menu['kind']): void => {
    const box = bar.current?.getBoundingClientRect();
    if (box !== undefined) setMenu(menu?.kind === kind ? null : { kind, x: box.left, y: box.bottom + 2 });
  };
  const choices = first === null ? [] : seconds(first);
  const picked = firsts.find((one) => one.value === first);

  return (
    <div ref={bar} className="web-pick-two">
      <Button size="sm" label={picked === undefined ? `+ ${firstLabel}` : picked.title} title={firstLabel} onClick={() => open('first')} />
      {picked === undefined ? null : (
        <Button size="sm" label={secondLabel} title={secondLabel} disabled={choices.length === 0} onClick={() => open('second')} />
      )}
      {menu === null ? null : (
        <ContextMenu
          spec={{
            items: menu.kind === 'first'
              ? firsts.map((one) => ({ title: one.title, group: firstHeader, onSelect: (picker) => { picker.closeMenu(); setMenu(null); setFirst(one.value); } }))
              : choices.map((one) => ({
                title: one.title,
                group: secondHeader,
                onSelect: (picker) => { picker.closeMenu(); setMenu(null); setFirst(null); onPick(first!, one.value); },
              })),
          }}
          x={menu.x}
          y={menu.y}
          onClose={() => setMenu(null)}
        />
      )}
    </div>
  );
}
