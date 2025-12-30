import React, { useState } from 'react';
import { useAppState } from '../../context/AppStateContext';

/**
 * PUBLIC_INTERFACE
 * ExportPanel - Provides export/download actions for the generated report.
 */
export default function ExportPanel() {
  const { reportPreview, exportExcel, loading, error, statusMessage } = useAppState();
  const current = reportPreview || [];
  const [downloading, setDownloading] = useState(false);
  const disabled = !current || current.length === 0 || downloading || loading;

  // PUBLIC_INTERFACE
  const onExport = async () => {
    setDownloading(true);
    try {
      const url = await exportExcel();
      if (!url) return;
      const a = document.createElement('a');
      a.href = url;
      a.download = `weekly-status-report_${new Date().toISOString().slice(0, 10)}.txt`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(false);
    }
  };

  const hasData = current && current.length > 0;

  return (
    <section className="op-section" aria-labelledby="export-title" aria-describedby="export-desc">
      <h2 id="export-title" className="op-title">Export</h2>
      <p id="export-desc" className="op-subtitle">Download your weekly status report.</p>

      <div className="op-toolbar">
        <button
          className="op-btn"
          onClick={onExport}
          disabled={disabled}
          aria-disabled={disabled}
          aria-live="polite"
          aria-label="Download weekly status report"
          type="button"
        >
          {downloading ? 'Preparing…' : 'Download Report'}
        </button>
        <button
          className="op-btn secondary"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          type="button"
          aria-label="Back to top"
        >
          Back to Top
        </button>
        <div className="op-spacer" />
        <span className={`op-status${error ? ' error' : ''}`} aria-live="polite">
          {loading ? 'Working…' : (error || statusMessage)}
        </span>
      </div>

      {!hasData && !loading && !error && (
        <div className="op-card" role="status" aria-live="polite">
          <p className="op-status">Nothing to export yet. Upload data and configure rules first.</p>
        </div>
      )}

      {error && (
        <div className="op-card" role="alert">
          <p className="op-status error">Export not available: {error}</p>
          <div className="op-toolbar" style={{ marginTop: 8 }}>
            <button
              className="op-btn secondary"
              type="button"
              onClick={onExport}
              aria-label="Retry export"
              disabled={!hasData}
            >
              Retry Export
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
