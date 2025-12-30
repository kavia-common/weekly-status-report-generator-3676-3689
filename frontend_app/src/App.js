import React, { useState, useEffect } from 'react';
import './App.css';
import './styles/theme.css';
import { AppStateProvider } from './context/AppStateContext';
import UploadArea from './components/UploadArea';
import RuleConfig from './components/RuleConfig';
import ReportPreview from './components/ReportPreview';
import ExportPanel from './components/ExportPanel';
import { TourProvider } from './tour/TourProvider';
import useTour from './tour/useTour';
import './styles/tour.css';

/**
 * PUBLIC_INTERFACE
 * App - Root component wiring provider and all feature sections.
 */
function HeaderStartTourButton() {
  // PUBLIC_INTERFACE
  /**
   * Accessible Start Tour button that uses the TourProvider context.
   * Renders nothing if TourProvider is not available to avoid runtime errors.
   */
  try {
    const tour = useTour();
    if (!tour) return null;
    const label = tour.completed ? 'Replay onboarding tour' : 'Start onboarding tour';
    return (
      <button
        className="op-btn secondary"
        type="button"
        onClick={() => tour.resetAndStart?.() || tour.start?.()}
        aria-label={label}
        title={label}
        style={{ height: 40 }}
      >
        {tour.completed ? 'Replay Tour' : 'Start Tour'}
      </button>
    );
  } catch {
    // TourProvider not mounted; render nothing
    return null;
  }
}

function App() {
  const [theme, setTheme] = useState('light');
  const [compact, setCompact] = useState(false);

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
        {/* Header with brand gradient accent and actions cluster */}
        <header className="op-header brand-bg" role="banner">
          <div className="brand-strip" aria-hidden="true" />
          <div className="op-container" style={{ paddingTop: 16, paddingBottom: 16 }}>
            <div className="header-row">
              <div>
                <h1 style={{ margin: 0, color: '#ffffff' }}>Weekly Status Report Generator</h1>
                <p className="op-status" aria-live="polite" id="app-subtitle" style={{ color: 'rgba(255,255,255,0.9)' }}>
                  Upload • Configure • Preview • Export
                </p>
              </div>
              <div className="header-actions" aria-label="Header actions">
                <button
                  className="theme-toggle"
                  onClick={toggleTheme}
                  aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
                  title="Toggle theme"
                >
                  {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
                </button>
                <HeaderStartTourButton />
              </div>
            </div>
          </div>
        </header>

        <main id="main" className="op-container" role="main" tabIndex={-1}>
          <AppStateProvider>
            {/* Top grid: Upload (left) and Rules (right) on desktop */}
            <div className="op-grid" style={{ marginBottom: 16 }}>
              <section aria-labelledby="upload-title-section">
                <h2 id="upload-title-section" className="sr-only">Upload</h2>
                <UploadArea />
              </section>
              <section aria-labelledby="rules-title-section">
                <h2 id="rules-title-section" className="sr-only">Rule Configuration</h2>
                <RuleConfig />
              </section>
            </div>

            {/* Full-width below: Preview with density toggle */}
            <section aria-labelledby="preview-title-wrap">
              <h2 id="preview-title-wrap" className="sr-only">Report Preview</h2>
              <div className="op-section report-wrapper">
                <div className="op-toolbar" style={{ marginBottom: 8 }}>
                  <h3 className="op-title" style={{ margin: 0 }}>Report Preview</h3>
                  <div className="op-spacer" />
                  <label htmlFor="density-toggle" className="op-status" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input
                      id="density-toggle"
                      type="checkbox"
                      checked={compact}
                      onChange={(e) => setCompact(e.target.checked)}
                      aria-label="Toggle compact table density"
                    />
                    Compact
                  </label>
                </div>
                <div className={compact ? 'table-compact' : ''}>
                  <ReportPreview />
                </div>
              </div>
            </section>

            {/* Full-width bottom: Export */}
            <section aria-labelledby="export-title-wrap" style={{ marginTop: 16 }}>
              <h2 id="export-title-wrap" className="sr-only">Export Panel</h2>
              <ExportPanel />
            </section>
          </AppStateProvider>
        </main>
      </TourProvider>
    </div>
  );
}

export default App;
