import { useEffect, useState, type ReactElement } from 'react';
import { useScena, useStore } from '@softov/scena/react';
import { Button } from '@softov/scena/ui';
import { NOTIFICATIONS } from './registry.js';
import { getNotifications } from './context.js';
import type { Notification, NotificationAnimation, NotificationTone } from './types.js';
import { EMOJIcon } from '../emojis.js';

/** Each tone's default icon. */
const TONE_ICON: Record<NotificationTone, string> = {
  info: EMOJIcon.info,
  success: EMOJIcon.check,
  warning: EMOJIcon.warning,
  danger: EMOJIcon.error,
};

/** How many show before the rest fold into a "more" line. */
const VISIBLE = 4;

export interface ToasterProps {
  /** The arrival for entries that do not name one. */
  animation?: NotificationAnimation;
}

/** The notifications on screen, stacked in the bottom right corner, newest nearest it. */
export function Toaster({ animation = 'slide-up' }: ToasterProps): ReactElement | null {
  const list = useStore<Notification[]>(NOTIFICATIONS) ?? [];
  const [expanded, setExpanded] = useState(false);
  if (list.length === 0) return null;
  const shown = expanded ? list : list.slice(0, VISIBLE);
  const hidden = list.length - shown.length;
  return (
    <div className="web-toasts" role="region" aria-label="Notifications">
      {hidden > 0 ? <button type="button" className="web-toast__more" onClick={() => setExpanded(true)}>{`${hidden} more`}</button> : null}
      {[...shown].reverse().map((notification) => (
        <Toast key={notification.id} notification={notification} animation={notification.animation ?? animation} />
      ))}
    </div>
  );
}

function Toast({ notification, animation }: { notification: Notification; animation: NotificationAnimation }): ReactElement {
  const scena = useScena();
  const [showDetail, setShowDetail] = useState(false);
  const id = notification.id;
  const close = (): void => getNotifications().dismiss(id);

  // Open details hold it for as long as they are open, whatever the pointer does.
  useEffect(() => {
    if (!showDetail) return;
    const notifications = getNotifications();
    notifications.hold(id);
    return () => notifications.release(id);
  }, [id, showDetail]);

  const enter = (): void => getNotifications().hold(id);
  const leave = (): void => {
    if (!showDetail) getNotifications().release(id);
  };

  const run = (action: NonNullable<Notification['actions']>[number]): void => {
    void scena.commands.execute(action.command, action.args);
    if (action.dismisses !== false) close();
  };

  return (
    <div
      className="web-toast"
      data-tone={notification.tone}
      data-animation={animation}
      role={notification.dismissAuto === false ? 'alert' : 'status'}
      onMouseEnter={enter}
      onMouseLeave={leave}
      onFocus={enter}
      onBlur={leave}
    >
      <div className="web-toast__head">
        <span className="web-toast__icon" aria-hidden="true">{notification.icon ?? TONE_ICON[notification.tone]}</span>
        <span className="web-toast__title">{notification.title}</span>
        {notification.count > 1 ? <span className="web-toast__count" title={`Raised ${notification.count} times`}>{`\u{D7}${notification.count}`}</span> : null}
        <button type="button" className="web-toast__close" aria-label="Dismiss" onClick={close}>{EMOJIcon.close}</button>
      </div>
      {notification.description === undefined ? null : <p className="web-toast__body">{notification.description}</p>}
      {notification.detail === undefined ? null : (
        <>
          <button type="button" className="web-toast__link" onClick={() => setShowDetail(!showDetail)}>{showDetail ? 'Hide details' : 'Show details'}</button>
          {showDetail ? <pre className="web-toast__detail">{notification.detail}</pre> : null}
        </>
      )}
      {notification.actions === undefined || notification.actions.length === 0 ? null : (
        <div className="web-toast__actions">
          {notification.actions.map((action) => (
            <Button key={action.command} type="button" size="sm" variant="ghost" onClick={() => run(action)}>{action.label}</Button>
          ))}
        </div>
      )}
    </div>
  );
}
