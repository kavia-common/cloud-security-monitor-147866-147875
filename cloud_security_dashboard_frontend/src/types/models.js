//
// Central JSDoc typedefs for data models used across the dashboard.
// These typedefs assist editors and provide inline documentation.
// No runtime code is emitted; this file is import-safe for tooling.
//

/**
 * @typedef {'info'|'warning'|'critical'|string} Severity
 */

/**
 * PUBLIC_INTERFACE
 * @typedef {Object} Alert
 * @property {string|number} id - Unique identifier for the alert
 * @property {Date|number|string} [time] - Creation time (Date, epoch ms, or ISO string)
 * @property {Severity} [severity] - Severity level
 * @property {string} [source] - Source system/provider (e.g., AWS, GCP, Azure)
 * @property {string} [resource] - Affected resource identifier/name
 * @property {string} [status] - Workflow status (open|acknowledged|resolved|other)
 * @property {string} [title] - Short title for the alert
 * @property {string} [description] - Detailed description
 * @property {any} [payload] - Optional raw payload or metadata
 */

/**
 * PUBLIC_INTERFACE
 * @typedef {Object} AlertSummary
 * @property {number} [totalAlerts]
 * @property {number} [critical]
 * @property {number} [warning]
 * @property {number} [info]
 * @property {number} [open]
 * @property {number} [resolved]
 */

/**
 * PUBLIC_INTERFACE
 * @typedef {Object} TrendPoint
 * @property {number} ts - Timestamp (ms since epoch)
 * @property {number} value - Count/value for the bucket
 */

// Barrel exports for tooling (no runtime impact in CRA)
export {};
