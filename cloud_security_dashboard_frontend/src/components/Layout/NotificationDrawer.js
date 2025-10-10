import React, { useEffect, useRef } from 'react';
import './NotificationDrawer.css';
import { formatSeverity, formatTimeAgo } from '../../utils/formatters';

/**
 * @typedef {{ id: string|number, title: string, severity?: 'info'|'warning'|'critical', timestamp?: string, description?: string }} NotificationItem
 */

/**
 * PUBLIC_INTERFACE
 * NotificationDrawer - Right-side slide-in panel listing recent alerts/events.
 * Props:
 * - isOpen: boolean
 * - onClose: () => void
 * - notifications: NotificationItem[]
 * - onSelectNotification?: (item: NotificationItem) => void
 */
export default function NotificationDrawer({ isOpen, onClose, notifications = [], onSelectNotification }) {
  const panelRef = useRef(null);
  const closeBtnRef = useRef(null);

  // Focus management: when opened, move focus to close button; restore on close
  useEffect(() => {
    if (isOpen && closeBtnRef.current) {
      const t = setTimeout(() => closeBtnRef.current && closeBtnRef.current.focus(), 0);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [isOpen]);

  // Keyboard handler: Escape closes
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape' && isOpen) {
        e.stopPropagation();
        onClose && onClose();
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  return (
    <div
      className={`drawer-root ${isOpen ? 'open' : ''}`}
      aria-hidden={!isOpen}
    >
      <div
        className="drawer-backdrop"
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        ref={panelRef}
        className="drawer-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
      >
        <div className="drawer-header">
          <h2 id="drawer-title">Notifications</h2>
          <button
            ref={closeBtnRef}
            className="btn-close"
            onClick={onClose}
            aria-label="Close notifications"
          >
            ✕
          </button>
        </div>

        <div className="drawer-content" role="list">
          {notifications.length === 0 && (
            <div className="empty">
              <p className="text-muted">No notifications</p>
            </div>
          )}
          {notifications.map((n) => {
            const sev = formatSeverity(n.severity);
            return (
              <button
                key={n.id}
                role="listitem"
                className={`notif sev-${sev.className}`}
                onClick={() => onSelectNotification && onSelectNotification(n)}
                aria-label={`${n.title}${n.severity ? `, ${sev.text}` : ''}${n.timestamp ? `, ${formatTimeAgo(n.timestamp)}` : ''}`}
              >
                <div className="notif-top">
                  <span className="pill">{sev.text}</span>
                  {n.timestamp && <time className="timestamp">{formatTimeAgo(n.timestamp)}</time>}
                </div>
                <div className="notif-title">{n.title}</div>
                {n.description && <div className="notif-desc">{n.description}</div>}
              </button>
            );
          })}
        </div>
      </aside>
    </div>
  );
}


