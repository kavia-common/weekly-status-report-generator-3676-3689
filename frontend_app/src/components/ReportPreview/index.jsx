import React from 'react';
import { useAppState } from '../../context/AppStateContext';

/**
 * PUBLIC_INTERFACE
 * ReportPreview - Shows grouped preview data.
 */
export default function ReportPreview() {
  const { reportPreview } = useAppState();
  const data = reportPreview || [];

  return (
    <section className="op-section">
      <h2 className="op-title">Report Preview</h2>
      <p className="op-subtitle">A quick look at how your report will be structured.</p>

      {(!data || data.length === 0) ? (
        <div className="op-card" style={{ color: 'var(--op-muted)' }}>
          No data yet. Upload files to see a preview.
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {data.map((group) => (
            <div key={group.group} className="op-card">
              <div style={{ fontWeight: 700, marginBottom: 6 }}>
                {group.group} — {group.totalHours}h
              </div>
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                {group.items.map((item) => (
                  <li key={item.id} style={{ marginBottom: 4 }}>
                    <span style={{ color: 'var(--op-muted)' }}>{item.id}</span> — {item.summary} ({item.hours}h, {item.status})
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
