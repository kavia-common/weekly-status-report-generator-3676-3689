import React, { useState } from 'react';
import { useAppState } from '../../context/AppStateContext';

/**
 * PUBLIC_INTERFACE
 * ExportPanel - Provides export/download actions for the generated report.
 */
export default function ExportPanel() {
  const { reportPreview, preview, exportExcel } = useAppState();
  const current = reportPreview || preview || [];
  const [downloading, setDownloading] = useState(false);
  const disabled = !current || current.length === 0 || downloading;

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

  return (
    <section className="op-section">
      <h2 className="op-title">Export</h2>
      <p className="op-subtitle">Download your weekly status report.</p>

      <div className="op-toolbar">
        <button className="op-btn" onClick={onExport} disabled={disabled} aria-disabled={disabled}>
          {downloading ? 'Preparing...' : 'Download Report'}
        </button>
        <button
          className="op-btn secondary"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          type="button"
        >
          Back to Top
        </button>
      </div>
    </section>
  );
}
