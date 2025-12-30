import React, { useCallback, useRef, useState } from 'react';
import { useAppState } from '../../context/AppStateContext';

/**
 * PUBLIC_INTERFACE
 * UploadArea - Allows selecting CSV/Jira export files and parses them via service.
 * @typedef {import('../../types').Task} Task
 */
export default function UploadArea() {
  // Use stable action; keep no direct service usage here.
  const { parseFile, loading, error: ctxError, statusMessage } = useAppState();
  const [status, setStatus] = useState('Idle');
  const [error, setError] = useState('');
  const inputRef = useRef(null);
  const dropRef = useRef(null);
  const [isFocus, setIsFocus] = useState(false);

  const handleFiles = useCallback(
    async (fileList) => {
      setError('');
      setStatus('Parsing file…');
      try {
        const files = Array.from(fileList || []);
        await parseFile(files);
        setStatus(`Parsed ${files.length} file(s)`);
      } catch (e) {
        setError('Failed to parse files.');
        setStatus('Idle');
      }
    },
    [parseFile]
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
    <section className="op-section" aria-labelledby="upload-title" aria-describedby="upload-desc" data-tour-id="upload">
      <h2 id="upload-title" className="op-title">Upload Data</h2>
      <p id="upload-desc" className="op-subtitle">Upload CSV or Jira export files to begin.</p>

      <div
        ref={dropRef}
        className={`op-file${isFocus ? ' is-focus' : ''}`}
        onDragOver={onDragOver}
        onDrop={onDrop}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onFocus={() => setIsFocus(true)}
        onBlur={() => setIsFocus(false)}
        aria-label="Upload files via click or drag-and-drop"
        aria-describedby="upload-help"
        style={{
          background: 'var(--op-gradient)',
        }}
      >
        Drag & drop files here, or
        <div style={{ marginTop: 8 }}>
          <button className="op-btn" onClick={() => inputRef.current?.click()} type="button">Browse</button>
        </div>
        <p id="upload-help" className="sr-only">Press Enter or Space to open the file picker. You can also drag and drop files over this area.</p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".csv, text/csv, application/vnd.ms-excel"
          onChange={onSelect}
          aria-label="File input for CSV or Jira export files"
          style={{ display: 'none' }}
        />
      </div>

      <div className="op-divider" />

      <div className="op-toolbar">
        <span className={`op-status${ctxError ? ' error' : ''}`} aria-live="polite">
          {loading ? 'Parsing file…' : (ctxError || status)}
        </span>
        <div className="op-spacer" />
        {ctxError || error ? (
          <button
            className="op-btn secondary"
            type="button"
            onClick={() => inputRef.current?.click()}
            aria-label="Retry uploading files"
          >
            Retry
          </button>
        ) : null}
      </div>

      {!loading && !ctxError && status === 'Idle' && (
        <div className="op-card" role="status" aria-live="polite">
          <p className="op-status">No file uploaded yet.</p>
        </div>
      )}
    </section>
  );
}
