import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import App from '../App';

/**
 * PUBLIC_INTERFACE
 * AppRoutes - Wraps the App with BrowserRouter and provides minimal route stubs.
 * Routes:
 * - "/" -> App (dashboard composition with internal section switching)
 * - "/alerts" -> redirects to "/" for now (stub for future dedicated alerts page)
 * - "/assets", "/policies", "/settings" -> stubs redirecting to "/"
 */
export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        {/* Stubs for future top-level routes to match sidebar/header intents */}
        <Route path="/alerts" element={<Navigate to="/" replace />} />
        <Route path="/assets" element={<Navigate to="/" replace />} />
        <Route path="/policies" element={<Navigate to="/" replace />} />
        <Route path="/settings" element={<Navigate to="/" replace />} />
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
