import React, { useMemo } from 'react';
import { useAppState } from '../../context/AppStateContext';

/**
 * PUBLIC_INTERFACE
 * ReportPreview - Shows grouped preview data with charts and print/PDF friendly wrapper.
 */
export default function ReportPreview() {
  const { reportPreview, loading, error, rules } = useAppState();
  const data = reportPreview || [];

  // Derive flat items for charts
  const flatItems = useMemo(() => {
    const items = [];
    (data || []).forEach((g) => {
      (g.items || []).forEach((it) => items.push(it));
    });
    return items;
  }, [data]);

  // Totals + status counts
  const totals = useMemo(() => {
    const totalGroups = data.length || 0;
    const totalHours = (data || []).reduce((acc, g) => acc + (g.totalHours || 0), 0);
    const statusCounts = {};
    flatItems.forEach((it) => {
      const s = it.status || 'Unknown';
      statusCounts[s] = (statusCounts[s] || 0) + 1;
    });
    const totalTasks = flatItems.length;
    return { totalGroups, totalHours, totalTasks, statusCounts };
  }, [data, flatItems]);

  // Trend derivation (by day using a naive distribution from hours or assume equal weight if no date)
  // If items contain CompletedDate/StartDate/DueDate, prefer CompletedDate then DueDate then StartDate.
  const trend = useMemo(() => {
    const map = new Map();
    const add = (dateStr) => {
      if (!dateStr) return;
      const d = new Date(dateStr);
      if (Number.isNaN(d.getTime())) return;
      const key = d.toISOString().slice(0, 10);
      map.set(key, (map.get(key) || 0) + 1);
    };
    flatItems.forEach((it) => {
      // Try fields gracefully
      const date = it.CompletedDate || it.DueDate || it.StartDate || null;
      if (date) {
        add(date);
      }
    });
    // Fallback: if no dates found, synthesize a simple sequence with a single bucket
    if (map.size === 0 && flatItems.length > 0) {
      const today = new Date();
      const key = today.toISOString().slice(0, 10);
      map.set(key, flatItems.length);
    }
    // Sort by date
    const points = Array.from(map.entries())
      .sort((a, b) => (a[0] < b[0] ? -1 : 1))
      .map(([date, count]) => ({ date, count }));
    return points;
  }, [flatItems]);

  // Colors aligned with theme vars
  const colorDone = 'var(--op-success)';
  const colorInProgress = 'var(--op-primary)';
  const colorBlocked = 'var(--op-error)';
  const colorOther = 'var(--op-secondary)';

  // Build status distribution segments for donut or bar
  const statusEntries = useMemo(() => {
    const entries = Object.entries(totals.statusCounts || {});
    // Stable order: Done, In Progress, Blocked, Others
    const order = ['Done', 'In Progress', 'Blocked'];
    const known = entries.filter(([k]) => order.includes(k)).sort((a, b) => order.indexOf(a[0]) - order.indexOf(b[0]));
    const others = entries.filter(([k]) => !order.includes(k));
    return [...known, ...others];
  }, [totals.statusCounts]);

  const statusColor = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'done' || s === 'completed') return colorDone;
    if (s === 'in progress' || s === 'in_progress' || s === 'doing') return colorInProgress;
    if (s === 'blocked') return colorBlocked;
    return colorOther;
  };

  const dateRangeLabel = useMemo(() => {
    switch (rules?.timeframe) {
      case 'this_week': return 'This Week';
      case 'last_week':
      default: return 'Last Week';
    }
  }, [rules]);

  // Accessible inline Donut chart using SVG
  function DonutChart({ entries, total }) {
    const size = 140;
    const stroke = 16;
    const r = (size - stroke) / 2;
    const c = 2 * Math.PI * r;
    let offset = 0;
    const parts = entries.map(([name, count]) => {
      const frac = total ? count / total : 0;
      const len = frac * c;
      const seg = { name, count, len, dash: `${len} ${c - len}`, offset };
      offset += len;
      return seg;
    });

    return (
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label="Status distribution donut chart"
        className="chart-donut"
      >
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--op-border)" strokeWidth={stroke} />
        {parts.map((p, i) => (
          <circle
            key={p.name + i}
            cx={size/2}
            cy={size/2}
            r={r}
            fill="none"
            stroke={statusColor(p.name)}
            strokeWidth={stroke}
            strokeDasharray={p.dash}
            strokeDashoffset={-p.offset}
            transform={`rotate(-90 ${size/2} ${size/2})`}
          >
            <title>{`${p.name}: ${p.count} (${total ? Math.round((p.count/total)*100) : 0}%)`}</title>
          </circle>
        ))}
        <text
          x="50%"
          y="50%"
          textAnchor="middle"
          dominantBaseline="middle"
          style={{ fontSize: 16, fontWeight: 700, fill: 'var(--op-text)' }}
        >
          {total}
        </text>
      </svg>
    );
  }

  // Accessible simple bar chart (horizontal) for distribution when donut too small on mobile
  function BarDistribution({ entries, total }) {
    const max = Math.max(1, ...entries.map(([, c]) => c));
    return (
      <div className="chart-bars" role="img" aria-label="Status distribution bar chart">
        {entries.map(([name, count]) => {
          const w = `${(count / max) * 100}%`;
          const pct = total ? Math.round((count / total) * 100) : 0;
          return (
            <div key={name} className="chart-bar-row">
              <div className="chart-bar-label">{name}</div>
              <div className="chart-bar-track" aria-hidden="true">
                <div className="chart-bar-fill" style={{ width: w, background: statusColor(name) }} />
              </div>
              <div className="chart-bar-meta" aria-hidden="true">{count} • {pct}%</div>
              <span className="sr-only">{name}: {count} items, {pct}%</span>
            </div>
          );
        })}
      </div>
    );
  }

  // Simple trend line/area using SVG
  function TrendChart({ points }) {
    const width = 320;
    const height = 140;
    const pad = 24;
    const innerW = width - pad * 2;
    const innerH = height - pad * 2;

    if (!points || points.length === 0) {
      return (
        <div className="op-status" role="status" aria-live="polite">No date data available to show trend.</div>
      );
    }

    const maxY = Math.max(1, ...points.map(p => p.count));
    const stepX = points.length > 1 ? innerW / (points.length - 1) : 0;

    const toX = (i) => pad + i * stepX;
    const toY = (v) => pad + innerH - (v / maxY) * innerH;

    const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${toX(i)} ${toY(p.count)}`).join(' ');
    const area = `M ${toX(0)} ${toY(0)} ${points.map((p, i) => `L ${toX(i)} ${toY(p.count)}`).join(' ')} L ${toX(points.length - 1)} ${toY(0)} Z`;

    return (
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label="Trend chart of task throughput over time"
        className="chart-trend"
      >
        <rect x="0" y="0" width={width} height={height} fill="transparent" />
        {/* axes */}
        <line x1={pad} y1={height - pad} x2={width - pad} y2={height - pad} stroke="var(--op-border)" />
        <line x1={pad} y1={pad} x2={pad} y2={height - pad} stroke="var(--op-border)" />
        {/* area */}
        <path d={area} fill="rgba(37,99,235,0.12)" />
        {/* line */}
        <path d={path} fill="none" stroke="var(--op-primary)" strokeWidth="2" />
        {/* points */}
        {points.map((p, i) => (
          <g key={p.date}>
            <circle cx={toX(i)} cy={toY(p.count)} r="3" fill="var(--op-primary)">
              <title>{`${p.date}: ${p.count}`}</title>
            </circle>
          </g>
        ))}
        {/* x labels (sparse for readability) */}
        {points.map((p, i) => (i === 0 || i === points.length - 1 || i % Math.ceil(points.length / 4) === 0) ? (
          <text key={`lbl-${p.date}`} x={toX(i)} y={height - pad + 14} textAnchor="middle" className="chart-axis-text">{p.date.slice(5)}</text>
        ) : null)}
        {/* y max label */}
        <text x={pad - 6} y={pad} textAnchor="end" className="chart-axis-text">{maxY}</text>
        <text x={pad - 6} y={height - pad} textAnchor="end" className="chart-axis-text">0</text>
      </svg>
    );
  }

  const totalDone = totals.statusCounts['Done'] || 0;
  const totalInProgress = totals.statusCounts['In Progress'] || 0;
  const totalBlocked = totals.statusCounts['Blocked'] || 0;

  return (
    <section className="report-wrapper" aria-labelledby="preview-title" aria-describedby="preview-desc" data-tour-id="preview">
      <h2 id="preview-title" className="sr-only">Report Preview</h2>
      <p id="preview-desc" className="sr-only">A quick look at how your report will be structured, including charts and tables.</p>

      {/* Branded header area visible for print */}
      <header className="report-header" role="presentation" aria-hidden="true">
        <div className="report-header-strip" />
        <div className="report-header-content">
          <div className="report-header-left">
            <div className="report-appname">Weekly Status Report</div>
            <div className="report-meta">
              <span>Ocean Professional</span>
              <span aria-hidden="true">•</span>
              <span>{dateRangeLabel}</span>
            </div>
          </div>
          <div className="report-header-right">
            <div className="report-org">Generated by Weekly Status Report Generator</div>
            <div className="report-date">{new Date().toLocaleString()}</div>
          </div>
        </div>
      </header>

      {/* Report title and meta summary (screen + print) */}
      <div className="op-card report-intro">
        <div className="report-title">Weekly Status Summary</div>
        <div className="report-summary">
          <div><strong>Grouping:</strong> {rules?.grouping || 'assignee'}</div>
          <div><strong>Timeframe:</strong> {dateRangeLabel}</div>
          <div><strong>Totals:</strong> {totals.totalGroups} groups • {totals.totalHours}h</div>
        </div>
      </div>

      {/* Metrics chips */}
      <div className="op-toolbar chart-metrics" role="group" aria-label="Summary metrics">
        <div className="metric-chip">
          <div className="metric-label">Total Tasks</div>
          <div className="metric-value">{totals.totalTasks}</div>
        </div>
        <div className="metric-chip">
          <div className="metric-label">Completed</div>
          <div className="metric-value" style={{ color: colorDone }}>{totalDone}</div>
        </div>
        <div className="metric-chip">
          <div className="metric-label">In Progress</div>
          <div className="metric-value" style={{ color: colorInProgress }}>{totalInProgress}</div>
        </div>
        <div className="metric-chip">
          <div className="metric-label">Blocked</div>
          <div className="metric-value" style={{ color: colorBlocked }}>{totalBlocked}</div>
        </div>
      </div>

      {/* Chart area */}
      <div className="op-card charts-wrap" aria-labelledby="charts-title">
        <h3 id="charts-title" className="sr-only">Report visualizations</h3>

        {/* Responsive split: donut + bars stacked on mobile, side-by-side on desktop */}
        <div className="charts-grid">
          <section className="chart-panel" aria-labelledby="dist-title">
            <h4 id="dist-title" className="chart-title">Status distribution</h4>
            {loading ? (
              <div className="op-status" role="status" aria-live="polite">Loading chart…</div>
            ) : (!error && totals.totalTasks > 0) ? (
              <>
                <div className="chart-distribution">
                  <div className="donut-wrap" aria-hidden="true">
                    <DonutChart entries={statusEntries} total={totals.totalTasks} />
                  </div>
                  <div className="bar-wrap">
                    <BarDistribution entries={statusEntries} total={totals.totalTasks} />
                  </div>
                </div>
                <div className="chart-legend" role="list" aria-label="Status legend">
                  {statusEntries.map(([name]) => (
                    <div key={name} role="listitem" className="legend-item">
                      <span className="legend-swatch" style={{ background: statusColor(name) }} aria-hidden="true" />
                      <span className="legend-label">{name}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="op-status" role="status" aria-live="polite">No data to display.</div>
            )}
          </section>

          <section className="chart-panel" aria-labelledby="trend-title">
            <h4 id="trend-title" className="chart-title">Throughput over time</h4>
            {loading ? (
              <div className="op-status" role="status" aria-live="polite">Loading chart…</div>
            ) : (!error && trend.length > 0) ? (
              <TrendChart points={trend} />
            ) : (
              <div className="op-status" role="status" aria-live="polite">No date data available.</div>
            )}
          </section>
        </div>
      </div>

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
          {data.map((group, i) => (
            <div key={group.group} className="op-card report-group" data-report-group-index={i}>
              <div className="report-group-title">
                <span className="report-group-name">{group.group}</span>
                <span className="report-group-hours">{group.totalHours}h</span>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table className="op-table report-table" aria-label={`Items for ${group.group}`}>
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

      {/* Branded footer for print */}
      <footer className="report-footer" role="contentinfo" aria-label="Report footer">
        <div className="report-footer-content">
          <span>Generated by Weekly Status Report Generator</span>
          <span aria-hidden="true">•</span>
          <span className="print-timestamp">{new Date().toLocaleString()}</span>
          <span aria-hidden="true">•</span>
          <span className="print-page-number">Page <span className="pageNumber"></span></span>
        </div>
      </footer>
    </section>
  );
}
