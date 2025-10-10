//
// WebSocket client wrapper with auto-reconnect, heartbeat, and message parsing
//

import { WS_URL } from '../config';

/**
 * @typedef {'idle'|'connecting'|'open'|'closing'|'closed'|'error'} ConnectionStatus
 */

/**
 * @typedef {Object} ParsedMessage
 * @property {string} type
 * @property {any} payload
 * @property {number} ts
 */

/**
 * Safely parse incoming data to a {type, payload, ts} shape.
 * Accepts JSON strings or already parsed objects; falls back to raw payload.
 * @param {any} data
 * @returns {ParsedMessage}
 */
function parseMessage(data) {
  const now = Date.now();
  try {
    let obj = data;
    if (typeof data === 'string') {
      try {
        obj = JSON.parse(data);
      } catch {
        // Not JSON, wrap in payload
        return { type: 'text', payload: data, ts: now };
      }
    }
    if (obj && typeof obj === 'object') {
      const type = typeof obj.type === 'string' ? obj.type : 'message';
      const payload = 'payload' in obj ? obj.payload : obj;
      const ts = typeof obj.ts === 'number' ? obj.ts : now;
      return { type, payload, ts };
    }
    // Primitive payload
    return { type: 'message', payload: obj, ts: now };
  } catch {
    return { type: 'message', payload: data, ts: now };
  }
}

/**
 * Exponential backoff utility with cap.
 * @param {number} attempt - current reconnect attempt number (starting at 1)
 * @param {number} baseMs - base delay in ms
 * @param {number} capMs - max cap in ms
 * @returns {number}
 */
function backoffDelay(attempt, baseMs = 500, capMs = 10000) {
  const exp = Math.min(capMs, baseMs * Math.pow(2, attempt - 1));
  // Add small jitter (+/- 20%)
  const jitter = exp * (Math.random() * 0.4 - 0.2);
  return Math.max(0, Math.floor(exp + jitter));
}

/**
 * @typedef {Object} WSClientOptions
 * @property {string} [url] - WebSocket URL; defaults to WS_URL
 * @property {boolean} [autoReconnect=true]
 * @property {number} [maxBackoffMs=10000]
 * @property {number} [heartbeatInterval=30000] - Interval to send ping
 * @property {number} [staleThreshold=45000] - If no pong or message within this window, consider stale and reconnect
 */

/**
 * PUBLIC_INTERFACE
 * Factory to create a WebSocket client wrapper with auto-reconnect, heartbeat, and subscriptions.
 * @param {WSClientOptions} [config]
 * @returns {{
 *   connect: () => void,
 *   disconnect: () => void,
 *   send: (data: any) => void,
 *   onMessage: (handler: (msg: ParsedMessage) => void) => () => void,
 *   onStatusChange: (handler: (status: ConnectionStatus) => void) => () => void
 * }}
 */
export function createWSClient(config = {}) {
  const {
    url = WS_URL,
    autoReconnect = true,
    maxBackoffMs = 10000,
    heartbeatInterval = 30000,
    staleThreshold = 45000,
  } = config;

  /** @type {WebSocket|null} */
  let ws = null;
  /** @type {ConnectionStatus} */
  let status = 'idle';
  let reconnectAttempt = 0;
  /** @type {number|undefined} */
  let reconnectTimer;
  /** @type {number|undefined} */
  let heartbeatTimer;
  /** @type {number|undefined} */
  let staleCheckTimer;
  /** @type {number} */
  let lastActivityTs = 0;
  /** @type {Set<(msg: ParsedMessage) => void>} */
  const messageHandlers = new Set();
  /** @type {Set<(s: ConnectionStatus) => void>} */
  const statusHandlers = new Set();
  /** @type {boolean} */
  let intentionalClose = false;

  function setStatus(next) {
    status = next;
    statusHandlers.forEach((h) => {
      try { h(status); } catch (_) {}
    });
  }

  function clearTimers() {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = undefined;
    }
    if (heartbeatTimer) {
      clearInterval(heartbeatTimer);
      heartbeatTimer = undefined;
    }
    if (staleCheckTimer) {
      clearInterval(staleCheckTimer);
      staleCheckTimer = undefined;
    }
  }

  function scheduleReconnect() {
    if (!autoReconnect || intentionalClose) return;
    reconnectAttempt += 1;
    const delay = Math.min(backoffDelay(reconnectAttempt), maxBackoffMs);
    reconnectTimer = setTimeout(() => {
      connect();
    }, delay);
  }

  function startHeartbeat() {
    lastActivityTs = Date.now();
    if (heartbeatInterval > 0) {
      heartbeatTimer = setInterval(() => {
        try {
          if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping', ts: Date.now() }));
          }
        } catch (_) {
          // ignore
        }
      }, heartbeatInterval);
    }
    if (staleThreshold > 0) {
      staleCheckTimer = setInterval(() => {
        const now = Date.now();
        if (now - lastActivityTs > staleThreshold) {
          // Consider connection stale; force reconnect
          try {
            if (ws) {
              ws.close(4000, 'stale');
            }
          } catch (_) {
            // ignore
          }
        }
      }, Math.min(Math.max(heartbeatInterval, 5000), staleThreshold));
    }
  }

  function handleMessage(ev) {
    lastActivityTs = Date.now();
    const parsed = parseMessage(ev.data);
    // Respond to server pings if any
    if (parsed.type === 'ping') {
      try {
        ws && ws.readyState === WebSocket.OPEN && ws.send(JSON.stringify({ type: 'pong', ts: Date.now() }));
      } catch (_) {}
    }
    messageHandlers.forEach((h) => {
      try { h(parsed); } catch (_) {}
    });
  }

  function connect() {
    if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
      return; // already connected/connecting
    }
    intentionalClose = false;
    setStatus('connecting');

    try {
      ws = new WebSocket(url);
    } catch (e) {
      setStatus('error');
      scheduleReconnect();
      return;
    }

    ws.addEventListener('open', () => {
      setStatus('open');
      reconnectAttempt = 0;
      lastActivityTs = Date.now();
      startHeartbeat();
    });

    ws.addEventListener('message', handleMessage);

    ws.addEventListener('error', () => {
      setStatus('error');
      // Let close handler manage reconnection
    });

    ws.addEventListener('close', () => {
      setStatus('closed');
      clearTimers();
      ws = null;
      if (!intentionalClose) {
        scheduleReconnect();
      }
    });
  }

  function disconnect() {
    intentionalClose = true;
    clearTimers();
    if (ws) {
      try {
        setStatus('closing');
        ws.close(1000, 'client disconnect');
      } catch (_) {
        // ignore
      } finally {
        ws = null;
        setStatus('closed');
      }
    } else {
      setStatus('closed');
    }
  }

  function send(data) {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket is not open');
    }
    try {
      if (typeof data === 'string') {
        ws.send(data);
      } else {
        ws.send(JSON.stringify(data));
      }
    } catch (e) {
      // swallow to avoid crashing callers; they can decide to handle via status/error events
      // Optionally we could rethrow
      // console.warn('WS send failed', e);
    }
  }

  // PUBLIC_INTERFACE
  function onMessage(handler) {
    messageHandlers.add(handler);
    return () => messageHandlers.delete(handler);
  }

  // PUBLIC_INTERFACE
  function onStatusChange(handler) {
    handler(status); // emit current on subscribe
    statusHandlers.add(handler);
    return () => statusHandlers.delete(handler);
  }

  return {
    connect,
    disconnect,
    send,
    onMessage,
    onStatusChange,
  };
}

export default createWSClient;
