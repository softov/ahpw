import { useLayoutEffect, useRef, useState, type ReactElement } from 'react';
import { useI18n, useStore } from '@softov/scena/react';
import { ContextMenu, Modal } from '@softov/scena/ui';
import type { BindingPath, PickerAction } from '@softov/scena/types';
import type { MessageAttachment, SessionSummary } from '@microsoft/agent-host-protocol';
import { ahpPaths } from '../../bridges/data.js';
import { attachmentIcon, attachmentLabel, attachmentPath, clipboardImage, hasPreview, previewOf, type AttachmentPreviewOf } from './attachments.js';
import { composerAt, contextItems } from './composer-commands.js';
import { EMOJIcon } from '../emojis.js';

/** What goes with the message, above its text, each with a way to take it off. Nothing when there is none. */
export function Attached({ attachments, folder, onRemove }: {
  attachments: readonly MessageAttachment[];
  folder: string | undefined;
  onRemove: (index: number) => void;
}): ReactElement | null {
  const { t } = useI18n();
  const [preview, setPreview] = useState<AttachmentPreviewOf | null>(null);
  if (attachments.length === 0) return null;
  return (
    <div className="web-composer__attached">
      {attachments.map((one, index) => {
        const body = <><span className="web-attachment__icon" aria-hidden="true">{attachmentIcon(one)}</span><span className="web-attachment__label">{attachmentLabel(one)}</span></>;
        return (
          <span key={`${attachmentLabel(one)}-${index}`} className="web-attachment" title={attachmentPath(one, folder) ?? attachmentLabel(one)}>
            {hasPreview(one) ? <button type="button" className="web-attachment__open" title={t('sessions/attachments/see', { name: attachmentLabel(one) })} onClick={() => setPreview(previewOf(one))}>{body}</button> : body}
            <button type="button" className="web-attachment__remove" aria-label={t('sessions/attachments/remove', { name: attachmentLabel(one) })} onClick={() => onRemove(index)}>
              {EMOJIcon.close}
            </button>
          </span>
        );
      })}
      {preview === null ? null : <AttachmentPreview preview={preview} onClose={() => setPreview(null)} />}
    </div>
  );
}

/** What an attachment the message carries holds, over the page: an image as itself, text as text, anything else by its type and size. */
export function AttachmentPreview({ preview, onClose }: { preview: AttachmentPreviewOf; onClose: () => void }): ReactElement {
  return (
    <Modal open title={preview.label} onClose={onClose}>
      <div className="web-attachment-preview">
        <p className="web-attachment-preview__meta">{preview.meta}</p>
        {preview.image === undefined ? null : <img className="web-attachment-preview__image" src={preview.image} alt={preview.label} />}
        {preview.text === undefined ? null : <pre className="web-attachment-preview__text">{preview.text}</pre>}
      </div>
    </Modal>
  );
}

/** Space between the `+` and its menu, in pixels. */
const MENU_GAP = 4;

/**
 * The composer's `+`: Add context as a menu at the button, the same items as
 * `/attach`, and a second click closes it. Nothing is written into the message.
 * `onOpenChange` lets the composer hide its `@` or `/` list while the menu is open.
 * The `+` is drawn, not typed, so it sits in the middle of its circle in any font.
 */
export function AddButton({ host, path, onOpenChange }: { host: string; path: BindingPath; onOpenChange: (open: boolean) => void }): ReactElement {
  const { t } = useI18n();
  const sessions = useStore<SessionSummary[]>(ahpPaths(host).sessions);
  const [menu, setMenu] = useState<{ rect: DOMRect; y: number; items: PickerAction[] } | null>(null);
  const button = useRef<HTMLButtonElement>(null);
  const holder = useRef<HTMLSpanElement>(null);

  // scena's popup opens at a point and only clamps into the window: once its
  // height is known, it goes above the `+` when it does not fit below.
  useLayoutEffect(() => {
    const popup = holder.current?.querySelector('.oo-popup');
    if (menu === null || popup === null || popup === undefined) return;
    const height = popup.getBoundingClientRect().height;
    const below = menu.rect.bottom + MENU_GAP;
    const above = menu.rect.top - MENU_GAP - height;
    const y = below + height > window.innerHeight && above >= 0 ? above : below;
    if (y !== menu.y) setMenu({ ...menu, y });
  }, [menu]);

  const close = (): void => {
    setMenu(null);
    onOpenChange(false);
  };

  const toggle = async (): Promise<void> => {
    if (menu !== null) {
      close();
      return;
    }
    const api = composerAt(path);
    const rect = button.current?.getBoundingClientRect();
    if (api === undefined || rect === undefined) return;
    const image = await clipboardImage();
    setMenu({ rect, y: rect.bottom + MENU_GAP, items: contextItems(api, sessions ?? [], image) });
    onOpenChange(true);
  };

  return (
    <span ref={holder} className="web-composer__add-holder">
      <button
        ref={button}
        type="button"
        className="web-composer__add"
        aria-label={t('sessions/context/title')}
        title={t('sessions/context/title')}
        aria-haspopup="menu"
        aria-expanded={menu !== null}
        // The popup closes on any mousedown outside it: kept from it, the click below closes the menu instead of opening it again.
        onMouseDown={(event) => { if (menu !== null) event.nativeEvent.stopPropagation(); }}
        onClick={() => void toggle()}
      >
        <svg width="10" height="10" viewBox="0 0 12 12" aria-hidden="true">
          <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>
      {menu === null ? null : <ContextMenu spec={{ items: menu.items }} x={menu.rect.left} y={menu.y} onClose={close} />}
    </span>
  );
}
