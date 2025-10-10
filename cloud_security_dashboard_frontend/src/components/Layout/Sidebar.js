import React, { useMemo } from 'react';
import './Sidebar.css';

/**
 * PUBLIC_INTERFACE
 * Sidebar - Collapsible navigation sidebar.
 * Props:
 * - collapsed?: boolean - whether the sidebar is collapsed (icon-only)
 * - onToggle?: () => void - callback to toggle collapse
 * - active?: string - active route key (overview|alerts|assets|policies|settings)
 * - onNavigate?: (key: string) => void - when a nav item is selected
 */
export default function Sidebar({ collapsed = false, onToggle, active = 'overview', onNavigate }) {
  const items = useMemo(
    () => [
      { key: 'overview', label: 'Overview', icon: '🏠' },
      { key: 'alerts', label: 'Alerts', icon: '🚨' },
      { key: 'assets', label: 'Assets', icon: '🗂️' },
      { key: 'policies', label: 'Policies', icon: '📜' },
      { key: 'settings', label: 'Settings', icon: '⚙️' },
    ],
    []
  );

  return (
    <aside
      className={`sidebar ${collapsed ? 'collapsed' : ''}`}
      aria-label="Primary"
    >
      <div className="sidebar-header">
        <button
          className="sidebar-toggle"
          onClick={onToggle}
          aria-expanded={!collapsed}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? '›' : '‹'}
        </button>
        {!collapsed && <span className="sidebar-title">CloudSec</span>}
      </div>

      <nav className="sidebar-nav" role="navigation" aria-label="Main Navigation">
        <ul>
          {items.map((it) => {
            const isActive = active === it.key;
            return (
              <li key={it.key}>
                <button
                  className={`nav-item ${isActive ? 'active' : ''}`}
                  onClick={() => onNavigate && onNavigate(it.key)}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <span className="nav-icon" aria-hidden="true">{it.icon}</span>
                  {!collapsed && <span className="nav-label">{it.label}</span>}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
