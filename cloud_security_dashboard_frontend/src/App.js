import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import './App.css';

// Layout components
import Sidebar from './components/Layout/Sidebar';
import './components/Layout/Sidebar.css';
import Header from './components/Layout/Header';
import './components/Layout/Header.css';
import NotificationDrawer from './components/Layout/NotificationDrawer';
import './components/Layout/NotificationDrawer.css';

// Dashboard components
import OverviewCards from './components/Dashboard/OverviewCards';
import './components/Dashboard/OverviewCards.css';
import TrendsChart from './components/Dashboard/TrendsChart';
import './components/Dashboard/TrendsChart.css';
import AlertsTable from './components/Dashboard/AlertsTable';
import './components/Dashboard/AlertsTable.css';

// Modal
import AlertDetailsModal from './components/Modals/AlertDetailsModal';
import './components/Modals/AlertDetailsModal.css';

// Data hooks
import useApi from './hooks/useApi';
import useWebSocket from './hooks/useWebSocket';

/**
 * PUBLIC_INTERFACE
 * App - Root shell for Cloud Security Dashboard with header, sidebar, and notification drawer.
 * - Manages theme attribute (light/dark)
 * - Tracks active nav route (placeholder)
 * - Holds notification drawer state and integrates AlertDetailsModal
 * - Streams real-time updates via WebSocket to KPIs and Alerts table
 */
function App() {
  const [theme, setTheme] = useState('light');

  // Minimal route state (will be superseded by react-router; Sidebar drives this)
  const [active, setActive] = useState('overview');

  // notifications in drawer
  const [notifications, setNotifications] = useState(() => ([
    { id: 1, title: 'New critical alert: Public S3 bucket', severity: 'critical', timestamp: '2m ago', description: 'S3 bucket "audit-logs" is publicly accessible.' },
    { id: 2, title: 'IAM policy change detected', severity: 'warning', timestamp: '10m ago', description: 'User alice updated AdministratorAccess policy.' },
    { id: 3, title: 'Asset onboarded: EC2 i-09ab...', severity: 'info', timestamp: '20m ago', description: 'New instance launched in us-east-1.' },
  ]));
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Alert modal state
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);

  // WebSocket for real-time messages: ALERT_CREATED / ALERT_UPDATED
  const debounceTimerRef = useRef(null);
  const [liveSummary, setLiveSummary] = useState(null);
  const [liveAlerts, setLiveAlerts] = useState([]);

  // Apply theme to root element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  const onToggleDrawer = () => setIsDrawerOpen(v => !v);

  // mobile sidebar toggle uses body class
  const openMobileSidebar = () => {
    document.body.classList.add('sidebar--mobile-open');
  };

  const notificationsCount = useMemo(() => notifications.length, [notifications]);

  const onSelectNotification = (n) => {
    // Placeholder: mark as read/remove; could also open modal
    setNotifications((prev) => prev.filter((i) => i.id !== n.id));
  };

  // Row click handler passed down to AlertsTable to open modal
  const handleTableRowClick = useCallback((alert) => {
    setSelectedAlert(alert || null);
    setIsAlertModalOpen(true);
  }, []);

  const closeAlertModal = useCallback(() => {
    setIsAlertModalOpen(false);
    // focus restoration handled in modal component
  }, []);

  // Placeholder callbacks for modal actions
  const onAcknowledge = useCallback((alert) => {
    // no-op placeholder: integrate API later
    // eslint-disable-next-line no-console
    console.log('Acknowledge:', alert);
    setIsAlertModalOpen(false);
  }, []);

  const onDismiss = useCallback((alert) => {
    // no-op placeholder: integrate API later
    // eslint-disable-next-line no-console
    console.log('Dismiss:', alert);
    setIsAlertModalOpen(false);
  }, []);

  // Real-time stream: update KPIs and Alerts with debounced state updates
  const applyRealtimeUpdate = useCallback((msg) => {
    if (!msg || !msg.type) return;

    // Batch updates within 200ms to avoid excessive renders
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    // Stage changes
    debounceTimerRef.current = setTimeout(() => {
      if (msg.type === 'ALERT_CREATED') {
        const a = normalizeAlert(msg.payload);
        setLiveAlerts((prev) => {
          const next = [a, ...prev];
          // cap to 200 latest to align with ws buffer default
          return next.slice(0, 200);
        });
        setLiveSummary((prev) => bumpSummary(prev, a, null));
      } else if (msg.type === 'ALERT_UPDATED') {
        const upd = normalizeAlert(msg.payload);
        setLiveAlerts((prev) => {
          const idx = prev.findIndex((x) => (x.id ?? x._id) === (upd.id ?? upd._id));
          if (idx === -1) {
            return [upd, ...prev].slice(0, 200);
          }
          const before = prev[idx];
          const next = [...prev];
          next[idx] = { ...before, ...upd };
          setLiveSummary((p) => bumpSummaryOnUpdate(p, before, upd));
          return next;
        });
      } else if (msg.type === 'ALERTS_SUMMARY') {
        // optional server-pushed summary snapshot
        const s = normalizeSummary(msg.payload);
        setLiveSummary(s);
      }
    }, 200);
  }, []);

  // Hook up WebSocket with external onMessage reducer
  useWebSocket({
    onMessage: applyRealtimeUpdate,
  });

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
    };
  }, []);

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
          {active === 'overview' ? (
            <DashboardOverview
              onRowClick={handleTableRowClick}
              liveSummary={liveSummary}
              liveAlerts={liveAlerts}
            />
          ) : (
            <div className="card">
              <h2 style={{ marginBottom: 8 }}>
                {active.charAt(0).toUpperCase() + active.slice(1)}
              </h2>
              <p className="text-muted">This is a placeholder for the {active} section.</p>
            </div>
          )}
        </main>
      </div>

      <NotificationDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        notifications={notifications}
        onSelectNotification={onSelectNotification}
      />

      <AlertDetailsModal
        isOpen={isAlertModalOpen}
        onClose={closeAlertModal}
        alert={selectedAlert}
        onAcknowledge={onAcknowledge}
        onDismiss={onDismiss}
      />
    </div>
  );
}

export default App;

/**
 * DashboardOverview
 * Composes OverviewCards, TrendsChart (placeholder), and AlertsTable.
 * Fetches summary and recent alerts via useApi and merges with real-time updates.
 */
function DashboardOverview({ onRowClick, liveSummary, liveAlerts }) {
  // REST Summary and recent alerts
  const { data: summary, loading: loadingSummary, error: errorSummary } = useApi('/api/alerts/summary');
  const { data: recent, loading: loadingAlerts, error: errorAlerts } = useApi('/api/alerts?limit=50');

  // Normalize REST alerts
  const restAlerts = useMemo(() => {
    return Array.isArray(recent)
      ? recent.map((a, idx) => normalizeAlert({ idx, ...a }))
      : [];
  }, [recent]);

  // Merge live alerts on top of REST alerts by id (live overwrites)
  const mergedAlerts = useMemo(() => {
    if (!liveAlerts || liveAlerts.length === 0) return restAlerts;
    const byId = new Map();
    restAlerts.forEach((a) => byId.set(a.id ?? a._id ?? a.key ?? `${a.time}-${a.resource}-${a.source}`, a));
    liveAlerts.forEach((a) => {
      const key = a.id ?? a._id ?? a.key ?? `${a.time}-${a.resource}-${a.source}`;
      byId.set(key, { ...(byId.get(key) || {}), ...a });
    });
    // sort by time desc default; table has its own sorting but keep stable order
    const arr = Array.from(byId.values());
    arr.sort((a, b) => toTs(b.time) - toTs(a.time));
    return arr;
  }, [restAlerts, liveAlerts]);

  // Compute summary: prefer liveSummary snapshot; else derive from summary + liveAlerts delta
  const summaryForCards = useMemo(() => {
    if (liveSummary) return liveSummary;
    if (summary) return summary;
    // Fallback: derive from mergedAlerts
    const counts = mergedAlerts.reduce(
      (acc, a) => {
        const s = String(a.severity || 'info').toLowerCase();
        acc.totalAlerts += 1;
        if (s === 'critical') acc.critical += 1;
        else if (s === 'warning') acc.warning += 1;
        else acc.info += 1;
        if (String(a.status || 'open').toLowerCase() === 'open') acc.open += 1;
        else acc.resolved += 1;
        return acc;
      },
      { totalAlerts: 0, critical: 0, warning: 0, info: 0, open: 0, resolved: 0 }
    );
    return counts;
  }, [summary, liveSummary, mergedAlerts]);

  // Trend data from merged alerts
  const trendData = useMemo(() => {
    if (!mergedAlerts || mergedAlerts.length === 0) return [];
    const now = Date.now();
    const buckets = 24;
    const size = 60 * 60 * 1000; // 1 hour
    const counts = Array.from({ length: buckets }).map((_, i) => {
      const end = now - (buckets - 1 - i) * size;
      const start = end - size;
      const c = mergedAlerts.filter(a => {
        const t = toTs(a.time);
        return t >= start && t < end;
      }).length;
      return { ts: end, value: c };
    });
    return counts;
  }, [mergedAlerts]);

  return (
    <div className="container" style={{ display: 'grid', gap: '16px' }}>
      <OverviewCards summary={summaryForCards || null} loading={loadingSummary} error={errorSummary} />
      <TrendsChart data={trendData} loading={loadingAlerts} />
      <AlertsTable alerts={mergedAlerts} loading={loadingAlerts} error={errorAlerts} onRowClick={onRowClick} />
    </div>
  );
}

// Utilities

function toTs(v) {
  if (v instanceof Date) return v.getTime();
  if (typeof v === 'number') return v;
  if (typeof v === 'string') {
    const t = Date.parse(v);
    if (!Number.isNaN(t)) return t;
  }
  return 0;
}

function normalizeAlert(a) {
  const id = a.id ?? a._id ?? a.key ?? a.idx ?? `${a.time}-${a.resource}-${a.source}`;
  return {
    id,
    time: a.time ?? a.timestamp ?? a.createdAt ?? a.ts ?? Date.now(),
    severity: a.severity ?? a.level ?? 'info',
    source: a.source ?? a.provider ?? a.origin ?? '',
    resource: a.resource ?? a.entity ?? a.asset ?? '',
    status: a.status ?? a.state ?? 'open',
    title: a.title ?? a.name ?? `Alert ${id}`,
    description: a.description ?? a.message ?? '',
    ...a,
  };
}

function normalizeSummary(s) {
  if (!s || typeof s !== 'object') return null;
  return {
    totalAlerts: Number(s.totalAlerts ?? s.total ?? 0),
    critical: Number(s.critical ?? 0),
    warning: Number(s.warning ?? 0),
    info: Number(s.info ?? 0),
    open: Number(s.open ?? 0),
    resolved: Number(s.resolved ?? 0),
  };
}

function bumpSummary(prev, createdAlert, removedAlert) {
  const base = normalizeSummary(prev) || { totalAlerts: 0, critical: 0, warning: 0, info: 0, open: 0, resolved: 0 };
  let next = { ...base };
  if (createdAlert) {
    next.totalAlerts += 1;
    const sev = String(createdAlert.severity || 'info').toLowerCase();
    if (sev === 'critical') next.critical += 1;
    else if (sev === 'warning') next.warning += 1;
    else next.info += 1;
    const st = String(createdAlert.status || 'open').toLowerCase();
    if (st === 'open') next.open += 1;
    else next.resolved += 1;
  }
  if (removedAlert) {
    next.totalAlerts = Math.max(0, next.totalAlerts - 1);
  }
  return next;
}

function bumpSummaryOnUpdate(prev, before, after) {
  const base = normalizeSummary(prev) || { totalAlerts: 0, critical: 0, warning: 0, info: 0, open: 0, resolved: 0 };
  let next = { ...base };
  // severity transition
  const s0 = String(before?.severity || 'info').toLowerCase();
  const s1 = String(after?.severity || 'info').toLowerCase();
  if (s0 !== s1) {
    if (s0 === 'critical') next.critical = Math.max(0, next.critical - 1);
    else if (s0 === 'warning') next.warning = Math.max(0, next.warning - 1);
    else next.info = Math.max(0, next.info - 1);

    if (s1 === 'critical') next.critical += 1;
    else if (s1 === 'warning') next.warning += 1;
    else next.info += 1;
  }
  // status transition
  const st0 = String(before?.status || 'open').toLowerCase();
  const st1 = String(after?.status || 'open').toLowerCase();
  if (st0 !== st1) {
    if (st0 === 'open') next.open = Math.max(0, next.open - 1);
    else next.resolved = Math.max(0, next.resolved - 1);
    if (st1 === 'open') next.open += 1;
    else next.resolved += 1;
  }
  return next;
}
