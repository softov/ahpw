import { useCallback, useRef, useState, type ReactElement } from 'react';
import { useI18n } from '@softov/scena/react';
import { Alert, Button, Modal } from '@softov/scena/ui';
import FilePage from '../files/FilePage.js';
import type { FileSpot } from './words.js';

/**
 * A custom file in the text editor over the page. Close with unsaved text asks in the modal first.
 * The modal is not dismissable: scena's Modal hides itself before `onClose` can refuse, and a dialog of the shell draws under it.
 */
export function FileModal({ host, spot, title, onClose }: { host: string; spot: FileSpot; title: string; onClose: () => void }): ReactElement {
  const { t } = useI18n();
  const dirty = useRef(false);
  const [asking, setAsking] = useState(false);
  const onDirty = useCallback((now: boolean) => { dirty.current = now; }, []);
  const close = (): void => {
    if (dirty.current) setAsking(true);
    else onClose();
  };
  return (
    <Modal open title={title} dismissable={false}>
      <div className="web-file-modal">
        <FilePage host={host} uri={spot.uri} line={spot.line} onDirty={onDirty} />
        {asking ? <Alert tone="warning" message={t('files/unsaved')} /> : null}
        <div className="web-custom-detail__actions">
          {asking
            ? <>
                <Button label={t('agents/customizations/keepEditing')} variant="ghost" onClick={() => setAsking(false)} />
                <Button label={t('agents/customizations/discard')} variant="danger" onClick={onClose} />
              </>
            : <Button label={t('common/close')} onClick={close} />}
        </div>
      </div>
    </Modal>
  );
}
