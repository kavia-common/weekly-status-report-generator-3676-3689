import React, { useState } from 'react';
import { useAppState } from '../../context/AppStateContext';
import { buildExportBaseName } from '../../services/reportService';

/**
 * PUBLIC_INTERFACE
 * ExportPanel - Provides export/download actions for the generated report.
 */
export default function ExportPanel() {
  const { reportPreview, exportExcel, loading, error, statusMessage, rules } = useAppState();
  const current = reportPreview || [];
  const [downloading, setDownloading] = useState(false);
  const disabled = !current || current.length === 0 || downloading || loading;

  const deriveTeamOrProject = () => {
    // Try to infer from rules or preview groups; fallback to "Project"
    const fromRules = rules?.projectName || rules?.teamName || '';
    if (fromRules && String(fromRules).trim().length > 0) return String(fromRules).trim();
    // Attempt from first group label if grouping by assignee or status
    const firstGroup = current?.[0]?.group;
    if (firstGroup && typeof firstGroup === 'string') {
      return firstGroup;
    }
    return 'Project';
  };

  // PUBLIC_INTERFACE
  const onExport = async () => {
    setDownloading(true);
    try {
      const base = buildExportBaseName({ teamOrProject: deriveTeamOrProject() });
      const filename = `${base}.xlsx`;
      const url = await exportExcel();
      if (!url) return;
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.setAttribute('data-filename', filename);
      a.title = `Download ${filename}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(false);
    }
  };

  const onPrint = () => {
    // Set a suggested PDF name via document title; most browsers use it as default
    const base = buildExportBaseName({ teamOrProject: deriveTeamOrProject() });
    const originalTitle = document.title;
    document.title = `${base}.pdf`;
    window.print();
    // Restore after print
    setTimeout(() => { document.title = originalTitle; }, 250);
  };

  const hasData = current && current.length > 0;

  return (
    <section className="op-section" aria-labelledby="export-title" aria-describedby="export-desc" data-tour-id="export">
      <h2 id="export-title" className="op-title">Export</h2>
      <p id="export-desc" className="op-subtitle">Download your weekly status report.</p>

      <div className="op-toolbar" role="group" aria-label="Export actions">
        {/* Left: status */}
        <span className={`op-status${error ? ' error' : ''}`} aria-live="polite">
          {loading ? 'Working…' : (error || statusMessage)}
        </span>

        <div className="op-spacer" />

        {/* Primary actions */}
        <button
          className="op-btn"
          onClick={onExport}
          disabled={disabled}
          aria-disabled={disabled}
          aria-live="polite"
          aria-label="Download weekly status report as Excel"
          title="Export Excel (downloads .xlsx)"
          type="button"
        >
          {downloading ? 'Preparing…' : 'Export Excel'}
        </button>
        <button
          className="op-btn ghost"
          onClick={onPrint}
          type="button"
          aria-label="Print or Save as PDF"
          title="Open print preview (Save as PDF)"
        >
          Print / PDF
        </button>

        {/* Secondary action to the right */}
        <button
          className="op-btn secondary"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          type="button"
          aria-label="Back to top"
          title="Scroll to top"
        >
          Back to Top
        </button>
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
              title="Retry export"
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
