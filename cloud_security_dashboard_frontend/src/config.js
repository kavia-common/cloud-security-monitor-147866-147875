//
// Configuration module for environment-dependent endpoints.
//
// This file centralizes the API and WebSocket base URLs and
// provides sensible defaults for local development.
//
// Environment variables expected (Create React App convention):
// - REACT_APP_API_BASE_URL
// - REACT_APP_WS_URL
//

// PUBLIC_INTERFACE
/**
 * Base URL for REST API calls.
 * Falls back to http://localhost:8080 if REACT_APP_API_BASE_URL is not set.
 * @type {string}
 */
export const API_BASE_URL =
  (typeof process !== 'undefined' &&
    process.env &&
    process.env.REACT_APP_API_BASE_URL) ||
  'http://localhost:8080';

// PUBLIC_INTERFACE
/**
 * Base URL for WebSocket connections.
 * Falls back to ws://localhost:8080/ws if REACT_APP_WS_URL is not set.
 * @type {string}
 */
export const WS_URL =
  (typeof process !== 'undefined' &&
    process.env &&
    process.env.REACT_APP_WS_URL) ||
  'ws://localhost:8080/ws';

// PUBLIC_INTERFACE
/**
 * getConfig
 * Returns a snapshot of the resolved configuration values.
 * Useful for services and utilities to import a single object.
 * @returns {{ API_BASE_URL: string, WS_URL: string }} An object containing API and WebSocket URLs.
 */
export function getConfig() {
  return {
    API_BASE_URL,
    WS_URL,
  };
}
