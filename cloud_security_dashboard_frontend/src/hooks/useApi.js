/**
 * Lightweight data fetching hook over the apiClient with loading/error/refetch.
 * - Triggers on mount and when dependencies change
 * - Aborts in-flight request on unmount or when re-firing
 * - Normalizes errors to { message, status, details }
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { request } from '../services/apiClient';

/**
 * @template T
 * @typedef {Object} UseApiState
 * @property {T|null} data
 * @property {boolean} loading
 * @property {import('../services/apiClient').NormalizedError| null} error
 * @property {() => Promise<void>} refetch
 */

/**
 * PUBLIC_INTERFACE
 * useApi - React hook for fetching data from REST endpoints.
 * @template T
 * @param {string} path - Relative API path (e.g., '/api/alerts')
 * @param {{options?: RequestInit & { timeoutMs?: number }, deps?: any[]}} [config]
 * @returns {UseApiState<T>}
 */
export default function useApi(path, config = {}) {
  const { options, deps = [] } = config;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(Boolean(path));
  const [error, setError] = useState(null);

  const abortRef = useRef(null);
  const mountedRef = useRef(true);

  // Cleanup on unmount: ensure no state updates and abort in-flight
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (abortRef.current) {
        abortRef.current.abort();
        abortRef.current = null;
      }
    };
  }, []);

  const doFetch = useCallback(async () => {
    if (!path) return;
    setLoading(true);
    setError(null);

    // Abort previous if exists
    if (abortRef.current) {
      abortRef.current.abort();
    }
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await request(path, { ...(options || {}), signal: controller.signal });
      if (!mountedRef.current) return;
      setData(res);
    } catch (err) {
      if (!mountedRef.current) return;
      // err is normalized by apiClient.request
      setError(err);
    } finally {
      if (!mountedRef.current) return;
      setLoading(false);
    }
  }, [path, JSON.stringify(options || {})]); // stable deps for options content

  // Run on mount and when deps change
  useEffect(() => {
    doFetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doFetch, ...deps]);

  /** PUBLIC_INTERFACE: refetch to manually re-trigger the request */
  const refetch = useCallback(async () => {
    await doFetch();
  }, [doFetch]);

  return { data, loading, error, refetch };
}
