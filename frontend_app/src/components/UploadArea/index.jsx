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
      <h2 id="upload-title" className="op-title">Upload</h2>
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
      >
        <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Drag & drop files here</div>
        <div className="op-status" style={{ color: '#fff', opacity: 0.9, marginBottom: 12 }}>
          or use the button below
        </div>
        <div>
          <button className="op-btn" onClick={() => inputRef.current?.click()} type="button" aria-label="Browse files">Browse</button>
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

      <div className="op-toolbar" style={{ marginTop: 8 }}>
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

      <div className="op-card" style={{ marginTop: 8 }}>
        <div className="op-status">
          Need sample data? <a href="#" onClick={(e) => e.preventDefault()} style={{ color: '#fff', textDecoration: 'underline' }} aria-label="Open sample data info">View a sample CSV</a>
        </div>
      </div>

      {!loading && !ctxError && status === 'Idle' && (
        <div className="op-card" role="status" aria-live="polite">
          <p className="op-status">No file uploaded yet.</p>
        </div>
      )}
    </section>
  );
}
