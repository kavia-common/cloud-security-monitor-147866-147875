import React from 'react';
import './OverviewCards.css';
import { formatNumber } from '../../utils/formatters';

/**
 * PUBLIC_INTERFACE
 * OverviewCards - Displays top-level summary metrics for alerts and system status.
 *
 * Props:
 * - summary: {
 *     totalAlerts?: number,
 *     critical?: number,
 *     warning?: number,
 *     info?: number,
 *     open?: number,
 *     resolved?: number
 *   } | null
 * - loading: boolean
 * - error: { message: string } | null
 */
export default function OverviewCards({ summary, loading, error }) {
  if (loading) {
    return (
      <div className="overview-grid">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="overview-card skeleton" aria-busy="true" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="overview-error card" role="alert">
        <strong>Failed to load summary:</strong> <span className="text-muted">{error.message || 'Unknown error'}</span>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="overview-empty card">
        <p className="text-muted">No summary available.</p>
      </div>
    );
  }

  const items = [
    {
      key: 'total',
      label: 'Total Alerts',
      value: Number(summary.totalAlerts ?? (Number(summary.critical || 0) + Number(summary.warning || 0) + Number(summary.info || 0))),
      accent: 'primary',
      emoji: '📊',
    },
    {
      key: 'critical',
      label: 'Critical',
      value: Number(summary.critical || 0),
      accent: 'error',
      emoji: '🚨',
    },
    {
      key: 'open',
      label: 'Open',
      value: Number(summary.open ?? 0),
      accent: 'secondary',
      emoji: '🟡',
    },
    {
      key: 'resolved',
      label: 'Resolved',
      value: Number(summary.resolved ?? 0),
      accent: 'muted',
      emoji: '✅',
    },
  ];

  return (
    <div className="overview-grid" role="region" aria-label="Overview metrics">
      {items.map((it) => (
        <div key={it.key} className={`overview-card ${accentClass(it.accent)}`} tabIndex={0}>
          <div className="overview-top">
            <span className="overview-emoji" aria-hidden="true">{it.emoji}</span>
            <span className="overview-label">{it.label}</span>
          </div>
          <div className="overview-value" aria-label={`${it.label} value`}>{formatNumber(it.value)}</div>
        </div>
      ))}
    </div>
  );
}

function accentClass(accent) {
  switch (accent) {
    case 'primary':
      return 'accent-primary';
    case 'secondary':
      return 'accent-secondary';
    case 'error':
      return 'accent-error';
    default:
      return 'accent-muted';
  }
}


