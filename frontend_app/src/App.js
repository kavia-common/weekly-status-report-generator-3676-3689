import React, { useState, useEffect } from 'react';
import './App.css';
import './styles/theme.css';
import { AppStateProvider } from './context/AppStateContext';
import UploadArea from './components/UploadArea';
import RuleConfig from './components/RuleConfig';
import ReportPreview from './components/ReportPreview';
import ExportPanel from './components/ExportPanel';
import { TourProvider } from './tour/TourProvider';
import './styles/tour.css';

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
      <a href="#main" className="skip-link">Skip to content</a>

      <TourProvider>
        <header className="App-header" style={{ background: 'transparent', minHeight: 'auto' }} role="banner">
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
                <p className="op-status" aria-live="polite" id="app-subtitle">Upload • Configure • Preview • Export</p>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  className="theme-toggle"
                  onClick={toggleTheme}
                  aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
                >
                  {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
                </button>
              </div>
            </div>
          </div>
        </header>

      <main id="main" className="op-container" role="main" tabIndex={-1}>
        <AppStateProvider>
          <div className="op-grid" style={{ marginBottom: 16 }}>
            <section aria-labelledby="upload-config">
              <h2 id="upload-config" className="sr-only">Upload and Configuration</h2>
              <div style={{ display: 'grid', gap: 16 }}>
                <UploadArea />
                <RuleConfig />
              </div>
            </section>
            <section aria-labelledby="preview-export">
              <h2 id="preview-export" className="sr-only">Preview and Export</h2>
              <div style={{ display: 'grid', gap: 16 }}>
                <ReportPreview />
                <ExportPanel />
              </div>
            </section>
          </div>
        </AppStateProvider>
      </main>
      </TourProvider>
    </div>
  );
}

export default App;
