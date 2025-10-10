import React, { useMemo, useState } from 'react';
import './AlertsTable.css';

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
          const ta = toTs(a.time);
          const tb = toTs(b.time);
          return (ta - tb) * mul;
        }
        case 'Severity': {
          const wa = severityWeight(a.severity);
          const wb = severityWeight(b.severity);
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
              {sorted.map((row) => (
                <tr
                  key={row.id ?? `${row.time}-${row.resource}-${row.source}`}
                  className={`row-sev-${sevClass(row.severity)}`}
                  onClick={() => onRowClick && onRowClick(row)}
                  tabIndex={0}
                >
                  <td><time dateTime={isoTime(row.time)}>{fmtTime(row.time)}</time></td>
                  <td>
                    <span className={`sev-badge sev-${sevClass(row.severity)}`}>
                      {String(row.severity || 'info').toUpperCase()}
                    </span>
                  </td>
                  <td>{row.source || '—'}</td>
                  <td className="cell-resource" title={row.resource || ''}>{row.resource || '—'}</td>
                  <td>{row.status || 'open'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function toTs(v) {
  if (v instanceof Date) return v.getTime();
  if (typeof v === 'number') return v;
  if (typeof v === 'string') {
    const t = Date.parse(v);
    if (!Number.isNaN(t)) return t;
  }
  return 0;
}

function isoTime(v) {
  const t = toTs(v);
  try {
    return new Date(t).toISOString();
  } catch {
    return '';
  }
}

function fmtTime(v) {
  const t = toTs(v);
  try {
    return new Intl.DateTimeFormat(undefined, { dateStyle: 'short', timeStyle: 'short' }).format(new Date(t));
  } catch {
    return String(v ?? '');
  }
}

function severityWeight(sev) {
  const s = String(sev || '').toLowerCase();
  if (s === 'critical') return 3;
  if (s === 'warning') return 2;
  if (s === 'info') return 1;
  return 0;
}

function sevClass(sev) {
  const s = String(sev || '').toLowerCase();
  if (s === 'critical') return 'critical';
  if (s === 'warning') return 'warning';
  return 'info';
}

function str(v) {
  return (v ?? '').toString();
}
