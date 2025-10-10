import React, { useEffect, useRef, useCallback } from 'react';
import './AlertDetailsModal.css';
import Button from '../common/Button';
import Badge from '../common/Badge';

/**
 * PUBLIC_INTERFACE
 * AlertDetailsModal - Accessible modal to view and act on a single alert.
 *
 * Props:
 * - isOpen: boolean - controls visibility
 * - onClose: () => void - called when user dismisses the modal (Escape, backdrop, close button)
 * - alert: {
 *     id?: string|number,
 *     time?: string|number|Date,
 *     severity?: 'info'|'warning'|'critical'|string,
 *     source?: string,
 *     resource?: string,
 *     status?: string,
 *     title?: string,
 *     description?: string,
 *     [key: string]: any
 *   } | null
 * - onAcknowledge?: (alert: any) => void
 * - onDismiss?: (alert: any) => void
 */
export default function AlertDetailsModal({ isOpen, onClose, alert, onAcknowledge, onDismiss }) {
  const backdropRef = useRef(null);
  const dialogRef = useRef(null);
  const previouslyFocusedRef = useRef(null);

  // Store previously focused element before opening to restore after close
  useEffect(() => {
    if (isOpen) {
      previouslyFocusedRef.current = document.activeElement;
    }
  }, [isOpen]);

  // Focus management: Move focus into dialog, trap within dialog
  useEffect(() => {
    if (!isOpen) return;
    const dialog = dialogRef.current;
    if (!dialog) return;

    // Focus first focusable element inside dialog
    const focusableSelectors = [
      'button:not([disabled])',
      '[href]',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ];
    const focusables = dialog.querySelectorAll(focusableSelectors.join(','));
    if (focusables.length > 0) {
      /** @type {HTMLElement} */ (focusables[0]).focus();
    } else {
      dialog.setAttribute('tabindex', '-1');
      dialog.focus();
    }

    // Trap focus within dialog
    const handleKeyDown = (e) => {
      if (e.key === 'Tab') {
        const list = Array.from(dialog.querySelectorAll(focusableSelectors.join(','))).filter(
          (el) => el.offsetParent !== null || dialog.contains(el)
        );
        if (list.length === 0) {
          e.preventDefault();
          return;
        }
        const first = list[0];
        const last = list[list.length - 1];
        if (e.shiftKey) {
          // shift+tab
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          // tab
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      } else if (e.key === 'Escape') {
        e.stopPropagation();
        onClose && onClose();
      }
    };

    dialog.addEventListener('keydown', handleKeyDown);
    return () => {
      dialog.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Global ESC as a fallback
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose && onClose();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  // Restore focus to previously focused element on close
  useEffect(() => {
    if (!isOpen && previouslyFocusedRef.current) {
      try {
        /** @type {HTMLElement} */ (previouslyFocusedRef.current).focus();
      } catch {
        // ignore
      } finally {
        previouslyFocusedRef.current = null;
      }
    }
  }, [isOpen]);

  const handleBackdropClick = useCallback(
    (e) => {
      if (e.target === backdropRef.current) {
        onClose && onClose();
      }
    },
    [onClose]
  );

  const fmtTime = (v) => {
    try {
      const d =
        v instanceof Date ? v : typeof v === 'number' ? new Date(v) : new Date(Date.parse(String(v)));
      return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(d);
    } catch {
      return String(v ?? '');
    }
  };

  if (!isOpen) return null;

  const sev = String(alert?.severity || 'info').toLowerCase();
  const title = alert?.title || 'Alert details';
  const description = alert?.description;

  return (
    <div
      className={`modal-root ${isOpen ? 'open' : ''}`}
      role="presentation"
      ref={backdropRef}
      onMouseDown={handleBackdropClick}
    >
      <div
        className="modal-backdrop"
        aria-hidden="true"
      />
      <div
        className="modal-dialog"
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="alert-modal-title"
        aria-describedby="alert-modal-desc"
      >
        <header className="modal-header">
          <div className="modal-title-wrap">
            <Badge variant={sev === 'critical' ? 'critical' : sev === 'warning' ? 'warning' : 'info'}>
              {String(alert?.severity || 'INFO').toUpperCase()}
            </Badge>
            <h2 id="alert-modal-title" className="modal-title">{title}</h2>
          </div>
          <Button
            aria-label="Close alert details"
            variant="ghost"
            className="modal-close"
            onClick={onClose}
          >
            ✕
          </Button>
        </header>

        <div className="modal-body">
          {description && (
            <p id="alert-modal-desc" className="modal-desc text-muted">
              {description}
            </p>
          )}
          <div className="modal-grid">
            <div className="modal-field">
              <span className="modal-label">Time</span>
              <span className="modal-value">{fmtTime(alert?.time)}</span>
            </div>
            <div className="modal-field">
              <span className="modal-label">Source</span>
              <span className="modal-value">{alert?.source || '—'}</span>
            </div>
            <div className="modal-field">
              <span className="modal-label">Resource</span>
              <span className="modal-value" title={alert?.resource || ''}>
                {alert?.resource || '—'}
              </span>
            </div>
            <div className="modal-field">
              <span className="modal-label">Status</span>
              <span className="modal-value">{alert?.status || 'open'}</span>
            </div>
            {'id' in (alert || {}) && (
              <div className="modal-field">
                <span className="modal-label">ID</span>
                <span className="modal-value">{String(alert.id)}</span>
              </div>
            )}
          </div>

          {/* Additional properties, if any */}
          <details className="modal-details">
            <summary>Raw payload</summary>
            <pre className="modal-pre">
{JSON.stringify(alert ?? {}, null, 2)}
            </pre>
          </details>
        </div>

        <footer className="modal-footer">
          <div className="modal-actions">
            {onDismiss && (
              <Button
                variant="ghost"
                onClick={() => onDismiss && onDismiss(alert)}
                aria-label="Dismiss alert"
              >
                Dismiss
              </Button>
            )}
            {onAcknowledge && (
              <Button
                variant="primary"
                onClick={() => onAcknowledge && onAcknowledge(alert)}
                aria-label="Acknowledge alert"
              >
                Acknowledge
              </Button>
            )}
            <Button variant="default" onClick={onClose} aria-label="Close modal">
              Close
            </Button>
          </div>
        </footer>
      </div>
    </div>
  );
}
