import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css'; // Global resets, typography, theme tokens import
import './App.css';   // App-level scaffolding styles
import AppRoutes from './routes/index';

/**
 * PUBLIC_INTERFACE
 * Entrypoint: renders the App with Router and global styles applied.
 */
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <AppRoutes />
  </React.StrictMode>
);
