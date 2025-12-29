import React from 'react';
import { useAppState } from '../../context/AppStateContext';

/**
 * PUBLIC_INTERFACE
 * RuleConfig - Starter controls for rule configuration.
 */
export default function RuleConfig() {
  const { rules, setRules } = useAppState();

  const update = (key, value) => {
    setRules((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <section className="op-section">
      <h2 className="op-title">Rule Configuration</h2>
      <p className="op-subtitle">Adjust how your weekly report is generated.</p>

      <div className="op-card" style={{ display: 'grid', gap: 12 }}>
        <label>
          <div style={{ fontSize: 12, color: 'var(--op-muted)', marginBottom: 4 }}>Grouping</div>
          <select
            className="op-input"
            value={rules.grouping}
            onChange={(e) => update('grouping', e.target.value)}
          >
            <option value="assignee">By Assignee</option>
            <option value="status">By Status</option>
          </select>
        </label>

        <label>
          <div style={{ fontSize: 12, color: 'var(--op-muted)', marginBottom: 4 }}>Timeframe</div>
          <select
            className="op-input"
            value={rules.timeframe}
            onChange={(e) => update('timeframe', e.target.value)}
          >
            <option value="last_week">Last Week</option>
            <option value="this_week">This Week</option>
          </select>
        </label>

        <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            type="checkbox"
            checked={!!rules.includeBlocked}
            onChange={(e) => update('includeBlocked', e.target.checked)}
          />
          <span>Include Blocked Tasks</span>
        </label>
      </div>
    </section>
  );
}
