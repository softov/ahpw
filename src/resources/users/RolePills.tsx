import { useRef, useState, type ReactElement } from 'react';
import { useI18n } from '@softov/scena/react';
import { Button } from '@softov/scena/ui';
import { ContextMenu } from '@softov/scena/ui/menu';
import { RemovableChip } from '../../shell/view/RemovableChip.js';

interface RolePillsProps {
  /** The roles the person holds, in the record's order. */
  held: readonly string[];
  /** The roles the + menu offers: every role this host knows that they do not hold. */
  offered: readonly string[];
  writes: boolean;
  onChange: (roles: string[]) => void;
}

/**
 * A person's roles as pills, each with a ✕ to remove it, and *+ Add a role*
 * for a menu of the ones they do not hold. A role has no second choice, so
 * this is one menu where memberships take two.
 */
export function RolePills({ held, offered, writes, onChange }: RolePillsProps): ReactElement {
  const { t } = useI18n();
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);
  // scena's Button gives its click no event, so the menu opens under the box around the pills.
  const bar = useRef<HTMLDivElement>(null);

  return (
    <div ref={bar} className="web-role-pills" role="group" aria-label={t('users/user/roles')}>
      {held.length === 0 ? <span className="web-note">{t('users/user/noRolesHeld')}</span> : held.map((role) => (
        <RemovableChip
          key={role}
          label={role}
          removeLabel={t('users/user/dropRole', { role })}
          {...(writes ? { onRemove: () => onChange(held.filter((one) => one !== role)) } : {})}
        />
      ))}
      {writes && offered.length > 0 ? (
        <Button
          size="sm"
          label={`+ ${t('users/user/addRole')}`}
          onClick={() => {
            const box = bar.current?.getBoundingClientRect();
            setMenu(menu === null && box !== undefined ? { x: box.left, y: box.bottom + 2 } : null);
          }}
        />
      ) : null}
      {menu === null ? null : (
        <ContextMenu
          spec={{
            items: offered.map((role) => ({
              title: role,
              group: t('users/explorer/roles'),
              onSelect: (picker) => {
                picker.closeMenu();
                setMenu(null);
                onChange([...held, role]);
              },
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
