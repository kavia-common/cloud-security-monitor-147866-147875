import React, { useMemo, useState } from 'react';
import './AlertsTable.css';
import { formatDate, toTimestamp, formatSeverity } from '../../utils/formatters';

/**
 * @typedef {'Time'|'Severity'|'Source'|'Resource'|'Status'} ColumnKey
 */

/**
 * PUBLIC_INTERFACE
 * AlertsTable - Displays recent alerts with sortable columns and row click handler.
 *
 * Props:
 * - alerts: Array<{
 *     id: string|number,
 *     time?: string|number|Date,
 *     severity?: 'info'|'warning'|'critical'|string,
 *     source?: string,
 *     resource?: string,
 *     status?: string
 *   }>
 * - loading: boolean
 * - error: { message: string } | null
 * - onRowClick?: (alert: any) => void
 */
export default function AlertsTable({ alerts = [], loading = false, error = null, onRowClick }) {
  const [sort, setSort] = useState({ key: /** @type {ColumnKey} */ ('Time'), dir: /** @type {'asc'|'desc'} */ ('desc') });

  const columns = /** @type {Array<{ key: ColumnKey, label: string }>} */ ([
    { key: 'Time', label: 'Time' },
    { key: 'Severity', label: 'Severity' },
    { key: 'Source', label: 'Source' },
    { key: 'Resource', label: 'Resource' },
    { key: 'Status', label: 'Status' },
  ]);

  const onSort = (key) => {
    setSort((prev) => {
      if (prev.key === key) {
        return { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' };
      }
      return { key, dir: key === 'Time' ? 'desc' : 'asc' };
    });
  };

  const sorted = useMemo(() => {
    const copy = [...(alerts || [])];
    const { key, dir } = sort;

    const cmp = (a, b) => {
      const mul = dir === 'asc' ? 1 : -1;
      switch (key) {
        case 'Time': {
          const ta = toTimestamp(a.time);
          const tb = toTimestamp(b.time);
          return (ta - tb) * mul;
        }
        case 'Severity': {
          const wa = formatSeverity(a.severity).weight;
          const wb = formatSeverity(b.severity).weight;
          return (wa - wb) * mul;
        }
        case 'Source':
          return str(a.source).localeCompare(str(b.source)) * mul;
        case 'Resource':
          return str(a.resource).localeCompare(str(b.resource)) * mul;
        case 'Status':
          return str(a.status).localeCompare(str(b.status)) * mul;
        default:
          return 0;
      }
    };

    copy.sort(cmp);
    return copy;
  }, [alerts, sort]);

  return (
    <div className="card alerts-card">
      <div className="alerts-header">
        <h3 className="alerts-title">Recent Alerts</h3>
      </div>

      {loading && <div className="alerts-loading">Loading alerts…</div>}
      {error && (
        <div className="alerts-error" role="alert">
          <strong>Failed to load alerts:</strong> <span className="text-muted">{error.message || 'Unknown error'}</span>
        </div>
      )}
      {!loading && !error && (!alerts || alerts.length === 0) && (
        <div className="alerts-empty">
          <p className="text-muted">No recent alerts.</p>
        </div>
      )}

      {!loading && !error && alerts && alerts.length > 0 && (
        <div className="table-wrapper">
          <table className="alerts-table">
            <thead>
              <tr>
                {columns.map((c) => (
                  <th key={c.key}>
                    <button
                      className={`th-btn ${sort.key === c.key ? 'active' : ''}`}
                      onClick={() => onSort(c.key)}
                      aria-sort={sort.key === c.key ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}
                    >
                      {c.label}
                      {sort.key === c.key && <span className="sort-caret" aria-hidden="true">{sort.dir === 'asc' ? '▲' : '▼'}</span>}
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((row) => {
                const sev = formatSeverity(row.severity);
                return (
                  <tr
                    key={row.id ?? `${row.time}-${row.resource}-${row.source}`}
                    className={`row-sev-${sev.className}`}
                    onClick={() => onRowClick && onRowClick(row)}
                    tabIndex={0}
                  >
                    <td><time dateTime={isoTime(row.time)}>{formatDate(row.time)}</time></td>
                    <td>
                      <span className={`sev-badge sev-${sev.className}`}>
                        {sev.text}
                      </span>
                    </td>
                    <td>{row.source || '—'}</td>
                    <td className="cell-resource" title={row.resource || ''}>{row.resource || '—'}</td>
                    <td>{row.status || 'open'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function isoTime(v) {
  const t = toTimestamp(v);
  try {
    return new Date(t).toISOString();
  } catch {
    return '';
  }
}

function str(v) {
  return (v ?? '').toString();
}
