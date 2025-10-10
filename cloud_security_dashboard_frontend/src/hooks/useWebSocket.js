/**
 * React hook for managing a WebSocket connection with auto-reconnect,
 * heartbeat, and safe JSON message parsing.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createWSClient } from '../services/wsClient';
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
 * @typedef {Object} UseWebSocketOptions
 * @property {boolean} [autoReconnect=true]
 * @property {number} [heartbeatInterval=30000]
 * @property {number} [bufferSize=200] - Max number of messages retained in the messages array
 * @property {(msg: ParsedMessage) => void} [onMessage] - Optional external reducer/handler invoked for each message
 * @property {string} [url] - Override WebSocket URL; defaults to WS_URL
 */

/**
 * PUBLIC_INTERFACE
 * useWebSocket - Hook that manages a WebSocket connection and exposes helpful state and actions.
 * - Connects on mount, cleans up on unmount
 * - Auto-reconnect with capped backoff (10s)
 * - Heartbeat ping and stale detection handled by wsClient
 * - Safely parses incoming messages to {type, payload, ts}
 *
 * @param {UseWebSocketOptions} [options]
 * @returns {{
 *   connectionStatus: ConnectionStatus,
 *   lastMessage: ParsedMessage | null,
 *   messages: ParsedMessage[],
 *   send: (data: any) => void,
 *   disconnect: () => void
 * }}
 */
export default function useWebSocket(options = {}) {
  const {
    autoReconnect = true,
    heartbeatInterval = 30000,
    bufferSize = 200,
    onMessage,
    url = WS_URL,
  } = options;

  const [connectionStatus, setConnectionStatus] = useState('idle');
  const [lastMessage, setLastMessage] = useState(null);
  const [messages, setMessages] = useState([]);
  const clientRef = useRef(null);
  const mountedRef = useRef(true);

  // stable onMessage ref
  const onMessageRef = useRef(onMessage);
  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  // Memoize client factory options
  const clientOptions = useMemo(
    () => ({
      url,
      autoReconnect,
      heartbeatInterval,
      maxBackoffMs: 10000, // cap at 10s
    }),
    [url, autoReconnect, heartbeatInterval]
  );

  // Initialize client and manage lifecycle
  useEffect(() => {
    mountedRef.current = true;

    const client = createWSClient(clientOptions);
    clientRef.current = client;

    const offStatus = client.onStatusChange((s) => {
      if (!mountedRef.current) return;
      setConnectionStatus(s);
    });

    const offMsg = client.onMessage((msg) => {
      if (!mountedRef.current) return;
      setLastMessage(msg);
      setMessages((prev) => {
        const next = [...prev, msg];
        if (next.length > bufferSize) {
          next.splice(0, next.length - bufferSize);
        }
        return next;
      });
      if (onMessageRef.current) {
        try { onMessageRef.current(msg); } catch (_) {}
      }
    });

    client.connect();

    return () => {
      mountedRef.current = false;
      offStatus();
      offMsg();
      client.disconnect();
      clientRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientOptions.url, clientOptions.autoReconnect, clientOptions.heartbeatInterval, bufferSize]);

  const send = useCallback((data) => {
    if (!clientRef.current) return;
    try {
      clientRef.current.send(data);
    } catch (_) {
      // ignore send errors, user can check connectionStatus
    }
  }, []);

  const disconnect = useCallback(() => {
    if (!clientRef.current) return;
    clientRef.current.disconnect();
  }, []);

  return {
    connectionStatus,
    lastMessage,
    messages,
    send,
    disconnect,
  };
}
