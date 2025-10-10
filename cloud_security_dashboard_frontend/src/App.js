import React, { useState, useEffect } from 'react';
import logo from './logo.svg';
import './App.css';

/**
 * PUBLIC_INTERFACE
 * App - Root of the Cloud Security Dashboard frontend showcasing base theme scaffolding.
 * Manages a simple theme toggle state (light/dark attribute for future use) and renders a
 * demo card with our Ocean Professional styling tokens.
 */
function App() {
  const [theme, setTheme] = useState('light');

  // Apply theme attribute for future dark-mode support (scoped to documentElement)
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // PUBLIC_INTERFACE
  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  return (
    <div className="App">
      <header className="App-header">
        <button
          className="theme-toggle"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
        </button>

        <img src={logo} className="App-logo" alt="logo" />

        <div className="App-card">
          <p>
            Edit <code>src/App.js</code> and save to reload.
          </p>
          <p>
            Current theme: <strong className="text-primary">{theme}</strong>
          </p>
          <a
            className="App-link"
            href="https://reactjs.org"
            target="_blank"
            rel="noopener noreferrer"
          >
            Learn React
          </a>
        </div>
      </header>
    </div>
  );
}

export default App;
