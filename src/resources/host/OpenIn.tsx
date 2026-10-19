import { useState, type ReactElement } from 'react';
import { useI18n, useScena } from '@softov/scena/react';
import { ContextMenu } from '@softov/scena/ui/menu';
import { placeItems } from './place.js';

/**
 * *Open in* on the settings window's title bar: a menu of the places, which
 * moves the settings and keeps the choice. A docked tab offers the same rows
 * from its strip button (`ahp.settings.openIn`).
 */
export function OpenIn({ host }: { host: string }): ReactElement {
  const { t } = useI18n();
  const scena = useScena();
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);
  return (
    <>
      <button
        type="button"
        className="web-settings__open-in"
        aria-haspopup="menu"
        aria-expanded={menu !== null}
        onClick={(event) => {
          const box = event.currentTarget.getBoundingClientRect();
          setMenu(menu === null ? { x: box.left, y: box.bottom + 2 } : null);
        }}
      >
        {t('host/settings/openIn')}
      </button>
      {menu === null ? null : <ContextMenu spec={{ items: placeItems(scena, host, 'overlay') }} x={menu.x} y={menu.y} onClose={() => setMenu(null)} />}
    </>
  );
}
