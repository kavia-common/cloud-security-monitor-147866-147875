import React from 'react';
import './Header.css';

/**
 * PUBLIC_INTERFACE
 * Header - Top application bar with title, search placeholder, and actions.
 * Props:
 * - title?: string
 * - notificationsCount?: number
 * - onToggleDrawer: () => void
 * - onMobileMenu?: () => void - optional handler to open sidebar on mobile
 */
export default function Header({ title = 'Cloud Security Dashboard', notificationsCount = 0, onToggleDrawer, onMobileMenu }) {
  return (
    <header className="app-header" role="banner">
      <div className="header-left">
        <button
          className="icon-btn mobile-menu"
          aria-label="Open navigation"
          onClick={onMobileMenu}
        >
          ☰
        </button>
        <h1 className="app-title">{title}</h1>
      </div>

      <div className="header-center" role="search">
        <input
          className="search-input"
          type="search"
          placeholder="Search (coming soon)"
          aria-label="Search"
        />
      </div>

      <div className="header-right">
        <button
          className="icon-btn bell-btn"
          aria-label="Open notifications"
          onClick={onToggleDrawer}
        >
          🔔
          {notificationsCount > 0 && (
            <span className="badge-notify" aria-label={`${notificationsCount} notifications`}>
              {notificationsCount}
            </span>
          )}
        </button>
        <div className="avatar" aria-label="User avatar" role="img">👤</div>
      </div>
    </header>
  );
}
