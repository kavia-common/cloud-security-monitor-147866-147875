import React, { useState, useEffect, useMemo } from 'react';
import './App.css';

// Layout components
import Sidebar from './components/Layout/Sidebar';
import './components/Layout/Sidebar.css';
import Header from './components/Layout/Header';
import './components/Layout/Header.css';
import NotificationDrawer from './components/Layout/NotificationDrawer';
import './components/Layout/NotificationDrawer.css';

/**
 * PUBLIC_INTERFACE
 * App - Root shell for Cloud Security Dashboard with header, sidebar, and notification drawer.
 * - Manages theme attribute (light/dark)
 * - Tracks active nav route (placeholder)
 * - Holds notification drawer state and sample list to be replaced by WebSocket later
 */
function App() {
  const [theme, setTheme] = useState('light');
  const [active, setActive] = useState('overview');

  // notifications state (placeholder sample)
  const [notifications, setNotifications] = useState(() => ([
    { id: 1, title: 'New critical alert: Public S3 bucket', severity: 'critical', timestamp: '2m ago', description: 'S3 bucket "audit-logs" is publicly accessible.' },
    { id: 2, title: 'IAM policy change detected', severity: 'warning', timestamp: '10m ago', description: 'User alice updated AdministratorAccess policy.' },
    { id: 3, title: 'Asset onboarded: EC2 i-09ab...', severity: 'info', timestamp: '20m ago', description: 'New instance launched in us-east-1.' },
  ]));
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Apply theme to root element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  const openDrawer = () => setIsDrawerOpen(true);
  const closeDrawer = () => setIsDrawerOpen(false);
  const onToggleDrawer = () => setIsDrawerOpen(v => !v);

  // mobile sidebar toggle uses body class
  const openMobileSidebar = () => {
    document.body.classList.add('sidebar--mobile-open');
  };

  const notificationsCount = useMemo(() => notifications.length, [notifications]);

  const onSelectNotification = (n) => {
    // Placeholder: mark as read/remove or open modal in future
    setNotifications((prev) => prev.filter((i) => i.id !== n.id));
  };

  return (
    <div className="App" style={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: 'auto 1fr' }}>
      <Sidebar
        collapsed={false}
        onToggle={() => {}}
        active={active}
        onNavigate={setActive}
      />
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <button
          className="theme-toggle"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          style={{ position: 'fixed', bottom: 16, right: 16, zIndex: 40 }}
        >
          {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
        </button>

        <Header
          title="Cloud Security Dashboard"
          notificationsCount={notificationsCount}
          onToggleDrawer={onToggleDrawer}
          onMobileMenu={openMobileSidebar}
        />

        <main style={{ padding: '24px', background: 'var(--color-bg)', flex: 1 }}>
          <div className="card">
            <h2 style={{ marginBottom: 8 }}>
              {active.charAt(0).toUpperCase() + active.slice(1)}
            </h2>
            <p className="text-muted">This is a placeholder for the {active} section.</p>
          </div>
        </main>
      </div>

      <NotificationDrawer
        isOpen={isDrawerOpen}
        onClose={closeDrawer}
        notifications={notifications}
        onSelectNotification={onSelectNotification}
      />
    </div>
  );
}

export default App;
