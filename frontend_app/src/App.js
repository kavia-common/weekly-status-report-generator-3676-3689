import React, { useState, useEffect } from 'react';
import './App.css';
import './styles/theme.css';
import { AppStateProvider } from './context/AppStateContext';
import UploadArea from './components/UploadArea';
import RuleConfig from './components/RuleConfig';
import ReportPreview from './components/ReportPreview';
import ExportPanel from './components/ExportPanel';

/**
 * PUBLIC_INTERFACE
 * App - Root component wiring provider and all feature sections.
 */
function App() {
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // PUBLIC_INTERFACE
  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <div className="App" style={{ background: 'var(--op-background)' }}>
      <header className="App-header" style={{ background: 'transparent', minHeight: 'auto' }}>
        <div className="op-container" style={{ paddingTop: 24, paddingBottom: 8 }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            marginBottom: 16,
            justifyContent: 'space-between'
          }}>
            <div>
              <h1 style={{ margin: 0, color: 'var(--op-text)' }}>Weekly Status Report Generator</h1>
              <div style={{ color: 'var(--op-muted)' }}>Upload • Configure • Preview • Export</div>
            </div>
            <button
              className="theme-toggle"
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
              {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
            </button>
          </div>
        </div>
      </header>

      <main className="op-container">
        <AppStateProvider>
          <div className="op-grid" style={{ marginBottom: 16 }}>
            <div style={{ display: 'grid', gap: 16 }}>
              <UploadArea />
              <RuleConfig />
            </div>
            <div style={{ display: 'grid', gap: 16 }}>
              <ReportPreview />
              <ExportPanel />
            </div>
          </div>
        </AppStateProvider>
      </main>
    </div>
  );
}

export default App;
