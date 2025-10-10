//
// Formatting helpers for dates, numbers, severities, and statuses.
// All helpers include unit-safe fallbacks to avoid runtime errors and preserve UX.
//

// PUBLIC_INTERFACE
/**
 * formatDate
 * Formats a date/time value using Intl.DateTimeFormat.
 * - Accepts Date | number | string
 * - Returns locale-aware short date+time by default
 * @param {Date|number|string|null|undefined} v - Input date/time
 * @param {Intl.DateTimeFormatOptions} [options] - Intl formatting options
 * @returns {string} Formatted date string or a safe fallback
 */
export function formatDate(v, options = { dateStyle: 'short', timeStyle: 'short' }) {
  const t = toTimestamp(v);
  if (t <= 0) return String(v ?? '');
  try {
    return new Intl.DateTimeFormat(undefined, options).format(new Date(t));
  } catch {
    try {
      return new Date(t).toISOString();
    } catch {
      return String(v ?? '');
    }
  }
}

// PUBLIC_INTERFACE
/**
 * formatTimeAgo
 * Returns a human-friendly "time ago" string (e.g., "2m ago", "just now").
 * @param {Date|number|string|null|undefined} v
 * @returns {string}
 */
export function formatTimeAgo(v) {
  const now = Date.now();
  const t = toTimestamp(v);
  if (t <= 0) return '';
  const diff = Math.max(0, now - t);

  const sec = Math.floor(diff / 1000);
  if (sec < 10) return 'just now';
  if (sec < 60) return `${sec}s ago`;

  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;

  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;

  const day = Math.floor(hr / 24);
  return `${day}d ago`;
}

// PUBLIC_INTERFACE
/**
 * formatNumber
 * Safely formats a number with grouping.
 * @param {number|string|null|undefined} n
 * @param {Intl.NumberFormatOptions} [options]
 * @returns {string}
 */
export function formatNumber(n, options) {
  const num = toNumber(n);
  if (!Number.isFinite(num)) return String(n ?? '');
  try {
    return new Intl.NumberFormat(undefined, options).format(num);
  } catch {
    return String(num);
  }
}

// PUBLIC_INTERFACE
/**
 * formatSeverity
 * Normalizes severity strings and returns:
 * - text: normalized label ("INFO" | "WARNING" | "CRITICAL" | original uppercased)
 * - className: class suffix for CSS ("info" | "warning" | "critical")
 * - weight: numeric weight for sorting (critical:3, warning:2, info:1, other:0)
 * @param {string|null|undefined} sev
 * @returns {{ text: string, className: 'info'|'warning'|'critical', weight: number, raw: string }}
 */
export function formatSeverity(sev) {
  const raw = String(sev || 'info');
  const s = raw.toLowerCase();
  if (s === 'critical') return { text: 'CRITICAL', className: 'critical', weight: 3, raw };
  if (s === 'warning') return { text: 'WARNING', className: 'warning', weight: 2, raw };
  return { text: 'INFO', className: 'info', weight: 1, raw };
}

// PUBLIC_INTERFACE
/**
 * formatStatus
 * Normalizes status strings and returns canonical text value.
 * Known statuses: "open", "acknowledged", "resolved"
 * Unrecognized values pass through uppercased text for display.
 * @param {string|null|undefined} status
 * @returns {{ text: string, raw: string, key: 'open'|'acknowledged'|'resolved'|'other' }}
 */
export function formatStatus(status) {
  const raw = String(status || 'open');
  const s = raw.toLowerCase();
  if (s === 'open') return { text: 'Open', raw, key: 'open' };
  if (s === 'acknowledged' || s === 'ack') return { text: 'Acknowledged', raw, key: 'acknowledged' };
  if (s === 'resolved' || s === 'closed') return { text: 'Resolved', raw, key: 'resolved' };
  return { text: raw.toUpperCase(), raw, key: 'other' };
}

/**
 * Convert a date-like input to a timestamp (ms). Returns 0 on failure.
 * @param {Date|number|string|null|undefined} v
 * @returns {number}
 */
export function toTimestamp(v) {
  if (v instanceof Date) return v.getTime();
  if (typeof v === 'number') {
    if (!Number.isFinite(v)) return 0;
    return v;
  }
  if (typeof v === 'string') {
    const t = Date.parse(v);
    if (!Number.isNaN(t)) return t;
  }
  return 0;
}

/**
 * Convert to a finite number or NaN if not possible.
 * @param {number|string|null|undefined} n
 * @returns {number}
 */
export function toNumber(n) {
  if (typeof n === 'number') return n;
  if (typeof n === 'string') {
    const parsed = Number(n);
    return parsed;
  }
  return NaN;
}
