import React from 'react';
import { useAppState } from '../../context/AppStateContext';

/**
 * PUBLIC_INTERFACE
 * ReportPreview - Shows grouped preview data.
 */
export default function ReportPreview() {
  const { reportPreview, loading, error } = useAppState();
  const data = reportPreview || [];

  return (
    <section className="" aria-labelledby="preview-title" aria-describedby="preview-desc" data-tour-id="preview">
      <h2 id="preview-title" className="sr-only">Report Preview</h2>
      <p id="preview-desc" className="sr-only">A quick look at how your report will be structured.</p>

      {loading && (
        <div className="op-card" role="status" aria-live="polite">
          <p className="op-status">Loading preview…</p>
        </div>
      )}

      {!loading && error && (
        <div className="op-card" role="alert">
          <p className="op-status error">Error loading preview. {error}</p>
        </div>
      )}

      {!loading && !error && (!data || data.length === 0) ? (
        <div className="op-card" style={{ color: 'var(--op-muted)' }} role="status" aria-live="polite">
          No data yet. Upload files to see a preview.
        </div>
      ) : null}

      {!loading && !error && data && data.length > 0 && (
        <div style={{ display: 'grid', gap: 12 }}>
          {data.map((group) => (
            <div key={group.group} className="op-card">
              <div style={{ fontWeight: 700, marginBottom: 6 }}>
                {group.group} — {group.totalHours}h
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table className="op-table" aria-label={`Items for ${group.group}`}>
                  <caption className="sr-only">Tasks grouped by {group.group}</caption>
                  <thead>
                    <tr>
                      <th scope="col">ID</th>
                      <th scope="col">Summary</th>
                      <th scope="col">Hours</th>
                      <th scope="col">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.items.map((item) => (
                      <tr key={item.id}>
                        <td><span style={{ color: 'var(--op-muted)' }}>{item.id}</span></td>
                        <td>{item.summary}</td>
                        <td>{item.hours}h</td>
                        <td>{item.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
