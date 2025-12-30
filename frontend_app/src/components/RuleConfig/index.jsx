import React from 'react';
import { useAppState } from '../../context/AppStateContext';

/**
 * PUBLIC_INTERFACE
 * RuleConfig - Starter controls for rule configuration.
 * @typedef {import('../../types').RuleConfig} RuleConfig
 */
export default function RuleConfig() {
  const { rules, updateRules, loading } = useAppState();

  const update = (key, value) => {
    updateRules?.({ [key]: value });
  };

  const current = rules || /** @type {RuleConfig} */ ({
    grouping: 'assignee',
    timeframe: 'last_week',
    includeBlocked: true,
  });

  return (
    <section className="op-section" aria-labelledby="rules-title" aria-describedby="rules-desc">
      <h2 id="rules-title" className="op-title">Rule Configuration</h2>
      <p id="rules-desc" className="op-subtitle">Adjust how your weekly report is generated.</p>

      <div className="op-card" style={{ display: 'grid', gap: 12 }}>
        <label htmlFor="grouping">
          <div style={{ fontSize: 12, color: 'var(--op-muted)', marginBottom: 4 }}>Grouping</div>
          <select
            id="grouping"
            className="op-input"
            value={current.grouping}
            onChange={(e) => update('grouping', e.target.value)}
            aria-describedby="grouping-help"
            disabled={loading}
          >
            <option value="assignee">By Assignee</option>
            <option value="status">By Status</option>
          </select>
          <span id="grouping-help" className="sr-only">Choose how tasks are grouped in the preview.</span>
        </label>

        <label htmlFor="timeframe">
          <div style={{ fontSize: 12, color: 'var(--op-muted)', marginBottom: 4 }}>Timeframe</div>
          <select
            id="timeframe"
            className="op-input"
            value={current.timeframe}
            onChange={(e) => update('timeframe', e.target.value)}
            aria-describedby="timeframe-help"
            disabled={loading}
          >
            <option value="last_week">Last Week</option>
            <option value="this_week">This Week</option>
          </select>
          <span id="timeframe-help" className="sr-only">Select which week to include in the report.</span>
        </label>

        <label htmlFor="includeBlocked" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            id="includeBlocked"
            type="checkbox"
            checked={!!current.includeBlocked}
            onChange={(e) => update('includeBlocked', e.target.checked)}
            disabled={loading}
          />
          <span>Include Blocked Tasks</span>
        </label>
      </div>
    </section>
  );
}
