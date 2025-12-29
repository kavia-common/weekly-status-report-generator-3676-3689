import React, { useCallback, useRef, useState } from 'react';
import { useAppState } from '../../context/AppStateContext';
import { parseFiles } from '../../services/reportService';

/**
 * PUBLIC_INTERFACE
 * UploadArea - Allows selecting CSV/Jira export files and parses them via service.
 */
export default function UploadArea() {
  const { setUploadedFiles, setPreview, rules } = useAppState();
  const [status, setStatus] = useState('Idle');
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  const handleFiles = useCallback(
    async (fileList) => {
      setError('');
      setStatus('Parsing...');
      try {
        const files = Array.from(fileList || []);
        setUploadedFiles(files);
        const rows = await parseFiles(files);
        const groups = await (await import('../../services/reportService')).generatePreview(rows, rules);
        setPreview(groups);
        setStatus(`Parsed ${files.length} file(s)`);
      } catch (e) {
        setError('Failed to parse files.');
        setStatus('Idle');
      }
    },
    [setUploadedFiles, setPreview, rules]
  );

  // PUBLIC_INTERFACE
  const onSelect = (e) => {
    handleFiles(e.target.files);
  };

  const onDrop = (e) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  };

  const onDragOver = (e) => e.preventDefault();

  return (
    <section className="op-section">
      <h2 className="op-title">Upload Data</h2>
      <p className="op-subtitle">Upload CSV or Jira export files to begin.</p>

      <div
        className="op-file"
        onDragOver={onDragOver}
        onDrop={onDrop}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter') inputRef.current?.click();
        }}
        aria-label="Upload files via click or drag-and-drop"
        style={{
          background: 'var(--op-gradient)',
        }}
      >
        Drag & drop files here, or
        <div style={{ marginTop: 8 }}>
          <button className="op-btn" onClick={() => inputRef.current?.click()}>Browse</button>
        </div>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".csv, text/csv, application/vnd.ms-excel"
          onChange={onSelect}
          style={{ display: 'none' }}
        />
      </div>

      <div className="op-divider" />

      <div className="op-toolbar" aria-live="polite">
        <span style={{ color: 'var(--op-muted)' }}>{status}</span>
        <div className="op-spacer" />
        {error ? <span style={{ color: 'var(--op-error)' }}>{error}</span> : null}
      </div>
    </section>
  );
}
