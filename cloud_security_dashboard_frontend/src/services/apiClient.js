import { API_BASE_URL } from '../config';

/**
 * @typedef {Object} NormalizedError
 * @property {string} message - Human-readable message describing the error.
 * @property {number|undefined} status - HTTP status code if available.
 * @property {any} [details] - Optional additional details (e.g., server-provided error payload).
 */

/**
 * Normalize errors to a consistent shape across network and server failures.
 * @param {any} err
 * @returns {NormalizedError}
 */
function normalizeError(err) {
  // Fetch throws TypeError on network failure; Response paths handled below
  if (err && err.__normalized) return err;

  if (err && err.name === 'AbortError') {
    return { message: 'Request aborted', status: undefined, details: { reason: 'aborted' }, __normalized: true };
  }

  if (err && typeof err === 'object' && 'status' in err && 'message' in err) {
    return { message: err.message || 'Request failed', status: err.status, details: err.details, __normalized: true };
  }

  return {
    message: (err && err.message) || 'Network error',
    status: undefined,
    details: err,
    __normalized: true,
  };
}

/**
 * Build an absolute URL from API_BASE_URL and a path.
 * Ensures single slash between segments.
 * @param {string} path
 */
function buildUrl(path) {
  if (!path) return API_BASE_URL;
  const base = API_BASE_URL.replace(/\/+$/, '');
  const p = path.replace(/^\/+/, '');
  return `${base}/${p}`;
}

/**
 * Merge headers ensuring JSON defaults while allowing overrides.
 * @param {HeadersInit|undefined} headers
 * @param {boolean} hasBody
 * @returns {HeadersInit}
 */
function mergeHeaders(headers, hasBody) {
  const base = {
    Accept: 'application/json',
  };
  if (hasBody) {
    base['Content-Type'] = 'application/json';
  }
  return { ...base, ...(headers || {}) };
}

/**
 * Execute a fetch with timeout and JSON parsing.
 * - Automatically stringifies body for JSON requests
 * - Parses JSON responses when content-type includes application/json
 * - Rejects non-2xx as normalized error
 * - Supports AbortController and external signal
 *
 * PUBLIC_INTERFACE
 * @template T
 * @param {string} path - Relative API path (e.g., '/api/alerts')
 * @param {RequestInit & { timeoutMs?: number }} [options] - Fetch options and timeout.
 * @returns {Promise<T>} - Parsed JSON body on success.
 */
export async function request(path, options = {}) {
  const {
    method = 'GET',
    headers,
    body,
    timeoutMs = 15000,
    signal: externalSignal,
    ...rest
  } = options;

  const hasBody = typeof body !== 'undefined' && body !== null;
  const url = buildUrl(path);

  // Setup timeout with AbortController; link with external signal if provided
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  // If consumer passes a signal, abort our controller when theirs aborts
  if (externalSignal) {
    if (externalSignal.aborted) controller.abort();
    else externalSignal.addEventListener('abort', () => controller.abort(), { once: true });
  }

  try {
    const res = await fetch(url, {
      method,
      headers: mergeHeaders(headers, hasBody),
      body: hasBody && typeof body !== 'string' ? JSON.stringify(body) : body,
      signal: controller.signal,
      ...rest,
    });

    const contentType = res.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');

    if (!res.ok) {
      let errPayload;
      try {
        errPayload = isJson ? await res.json() : await res.text();
      } catch {
        // ignore parsing error
      }
      const normalized = normalizeError({
        message: (errPayload && (errPayload.message || errPayload.error)) || `Request failed with status ${res.status}`,
        status: res.status,
        details: errPayload,
        __normalized: true,
      });
      throw normalized;
    }

    if (isJson) {
      return /** @type {Promise<any>} */ (res.json());
    }
    // For non-JSON, return raw text
    const text = await res.text();
    // @ts-ignore - caller defines expected type
    return text;
  } catch (err) {
    throw normalizeError(err);
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * PUBLIC_INTERFACE
 * Perform a GET request
 * @template T
 * @param {string} path
 * @param {RequestInit & { timeoutMs?: number }} [options]
 * @returns {Promise<T>}
 */
export function get(path, options = {}) {
  return request(path, { ...options, method: 'GET' });
}

/**
 * PUBLIC_INTERFACE
 * Perform a POST request with JSON body
 * @template T
 * @param {string} path
 * @param {any} data
 * @param {RequestInit & { timeoutMs?: number }} [options]
 * @returns {Promise<T>}
 */
export function post(path, data, options = {}) {
  return request(path, { ...options, method: 'POST', body: data });
}

/**
 * Example API helpers related to alerts.
 * These are convenience functions built on top of the base client.
 */

/**
 * PUBLIC_INTERFACE
 * Fetch aggregated alerts summary
 * GET /api/alerts/summary
 * @returns {Promise<any>}
 */
export function getAlertsSummary() {
  return get('/api/alerts/summary');
}

/**
 * PUBLIC_INTERFACE
 * Fetch recent alerts with optional limit
 * GET /api/alerts?limit={limit}
 * @param {number} [limit=50]
 * @returns {Promise<any>}
 */
export function getRecentAlerts(limit = 50) {
  const search = new URLSearchParams({ limit: String(limit) }).toString();
  return get(`/api/alerts?${search}`);
}
