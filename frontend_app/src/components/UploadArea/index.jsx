import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAppState } from '../../context/AppStateContext';

/**
 * PUBLIC_INTERFACE
 * UploadArea - Robust, accessible file upload for CSV/XLSX with validation and parsing integration.
 * - Supports drag-and-drop and click-to-select.
 * - Accepts .csv and .xlsx only with size/type validation.
 * - Shows selected file meta, allows replace/remove, sample file shortcut.
 * - Announces state changes and integrates with parseFile/generatePreview.
 */
export default function UploadArea() {
  const {
    parseFile,
    generatePreview,
    loading,
    error: ctxError,
    statusMessage,
    loadSampleData,
  } = useAppState();

  // Local UI state
  const [localError, setLocalError] = useState('');
  const [localStatus, setLocalStatus] = useState('Idle');
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null); // keep one primary file for UX
  const [lastParsedKey, setLastParsedKey] = useState(''); // prevent duplicate parsing
  const [showErrorDetails, setShowErrorDetails] = useState(false);

  // Refs and a simple live region announcer
  const inputRef = useRef(null);
  const liveRef = useRef(null);

  // Constants
  const MAX_BYTES = 10 * 1024 * 1024; // 10MB
  const ACCEPTED = useMemo(() => ([
    'text/csv',
    'application/vnd.ms-excel', // legacy CSV
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  ]), []);

  const acceptAttr = '.csv,.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv,application/vnd.ms-excel';

  // Helpers
  const isSupportedExtension = (name = '') => {
    const lower = String(name).toLowerCase();
    return lower.endsWith('.csv') || lower.endsWith('.xlsx');
  };

  const isSupportedType = (file) => {
    if (!file) return false;
    if (file.type && ACCEPTED.includes(file.type)) return true;
    // Some browsers give empty type; fall back to extension
    return isSupportedExtension(file.name);
  };

  const formatSize = (bytes = 0) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    };

  const fileKey = (file) => {
    if (!file) return '';
    // Create a simple identity key to block duplicate parsing
    return `${file.name}|${file.size}|${file.lastModified}`;
  };

  const announce = (msg) => {
    try {
      if (liveRef.current) {
        liveRef.current.textContent = msg;
      }
    } catch {
      // ignore
    }
  };

  // Core processing
  const beginParse = useCallback(async (files) => {
    if (!files || files.length === 0) return;
    setLocalError('');
    setShowErrorDetails(false);

    // Enforce single file primary UX (parseFile supports multiple but here UX is single)
    const file = files[0];

    // Validate type
    if (!isSupportedType(file)) {
      setLocalError('Unsupported file type. Please choose a .csv or .xlsx file.');
      setLocalStatus('Error');
      announce('Upload error: unsupported file type');
      return;
    }
    // Validate size
    if (file.size > MAX_BYTES) {
      setLocalError('File is too large. The limit is 10 MB.');
      setLocalStatus('Error');
      announce('Upload error: file too large');
      return;
    }

    // Prevent duplicate parsing of same file
    const key = fileKey(file);
    if (key && key === lastParsedKey) {
      // Keep same selection but do not re-parse; allow Replace to force change
      setSelectedFile(file);
      setLocalStatus('File already loaded');
      announce('Same file selected again; already processed.');
      return;
    }

    setSelectedFile(file);
    setLocalStatus('Processing…');
    announce('Processing file');

    try {
      await parseFile([file]);
      // Ensure preview auto-generation per requirement
      await generatePreview();
      setLocalStatus('File ready');
      setLastParsedKey(key);
      announce('File processed, preview ready');
    } catch (e) {
      setLocalError('Failed to process the file.');
      setLocalStatus('Error');
      announce('Upload error: parsing failed');
    }
  }, [generatePreview, lastParsedKey, parseFile]);

  // Event handlers
  const onFileInputChange = (e) => {
    const list = e.target.files;
    beginParse(Array.from(list || []));
    // Reset the input value to allow selecting the same file to Replace intentionally
    e.target.value = '';
  };

  const onDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    const dtFiles = e.dataTransfer?.files;
    if (!dtFiles || dtFiles.length === 0) return;
    beginParse(Array.from(dtFiles));
  };

  const onDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!dragOver) setDragOver(true);
  };

  const onDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  };

  const onBrowseClick = () => {
    inputRef.current?.click();
  };

  const onRemoveFile = () => {
    setSelectedFile(null);
    setLocalStatus('Idle');
    setLocalError('');
    announce('File removed');
    // Note: We keep previously parsed data intact; user can re-upload or replace.
  };

  const onReplaceFile = () => {
    onBrowseClick();
  };

  const onUseSample = async (e) => {
    // Ensure this never bubbles to any click handlers that might trigger the file picker
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    if (e && typeof e.stopPropagation === 'function') e.stopPropagation();

    setLocalError('');
    setShowErrorDetails(false);
    setLocalStatus('Loading sample…');
    announce('Loading sample data');

    try {
      await loadSampleData();
      // Set a synthetic selection indicator for UI purposes only
      setSelectedFile({
        name: 'Sample data',
        size: 0,
        lastModified: Date.now(),
      });
      setLocalStatus('File ready');
      announce('Sample loaded, preview ready');
    } catch {
      setLocalError('Unable to load the sample data.');
      setLocalStatus('Error');
      announce('Sample data failed to load');
    }
  };

  // Announce external context status transitions as well
  useEffect(() => {
    if (loading) announce('Working…');
  }, [loading]);

  // Derived display bits
  const helperText = 'Accepted: .csv, .xlsx (up to 10 MB)';
  const hasError = Boolean(ctxError || localError);
  const errorText = ctxError || localError || '';
  const isProcessing = loading || localStatus === 'Processing…';

  return (
    <section
      className="op-section"
      aria-labelledby="upload-title"
      aria-describedby="upload-desc"
      data-tour-id="upload"
    >
      <h2 id="upload-title" className="op-title">Upload</h2>
      <p id="upload-desc" className="op-subtitle">Upload a CSV or Excel (.xlsx) file to begin.</p>

      {/* Live region for announcements */}
      <div ref={liveRef} aria-live="polite" className="sr-only" />

      {/* Drop area */}
      <div
        className={`op-file${dragOver ? ' is-focus' : ''}`}
        role="button"
        tabIndex={0}
        onClick={onBrowseClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onBrowseClick();
          }
        }}
        onDragOver={onDragOver}
        onDragEnter={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        aria-label="Upload area: drag and drop or press Enter to browse"
        aria-describedby="upload-help upload-hint"
      >
        <div className="op-dropzone">
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8, maxWidth: '100%' }}>
            {dragOver ? 'Drop the file to upload' : 'Drag & drop your file here'}
          </div>
          <div className="op-status" style={{ opacity: 0.9, marginBottom: 12 }}>
            or
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
            <button className="op-btn" type="button" onClick={onBrowseClick} aria-label="Browse for a file">
              Browse
            </button>
            <button
              className="op-btn secondary"
              type="button"
              onClick={onUseSample}
              aria-label="Use Sample Data (loads demo CSV and generates preview)"
              title="Use Sample Data"
            >
              Use Sample Data
            </button>
          </div>
        </div>

        <p id="upload-help" className="sr-only">
          Press Enter or Space to open the file picker. You can also drag and drop a file over this area.
        </p>
        <p id="upload-hint" className="sr-only">
          {helperText}
        </p>

        <input
          ref={inputRef}
          type="file"
          accept={acceptAttr}
          onChange={onFileInputChange}
          aria-label="File input for CSV or Excel files"
          style={{ display: 'none' }}
        />
      </div>

      {/* Helper text under drop area */}
      <div className="op-toolbar" style={{ marginTop: 8, alignItems: 'flex-start', maxWidth: '100%' }}>
        <span className="op-status op-ellipsis" aria-live="polite" style={{ maxWidth: '100%' }}>
          {isProcessing ? 'Processing…' : (statusMessage || localStatus || 'Idle')}
        </span>
        <div className="op-spacer" />
      </div>
      <div className="op-status op-ellipsis" style={{ marginTop: 4, maxWidth: '100%' }}>{helperText}</div>
      <div className="op-status" style={{ marginTop: 2 }}>
        Tip: “Use Sample Data” loads a bundled demo CSV from /assets.
      </div>

      {/* Selected file meta and actions */}
      {selectedFile && (
        <div className="op-card" style={{ marginTop: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <div className="op-filemeta op-ellipsis" style={{ fontWeight: 600, maxWidth: '100%' }} title={selectedFile.name}>
              {selectedFile.name}
            </div>
            <div className="op-status">• {formatSize(selectedFile.size)}</div>
            <div className="op-status">
              • Last modified {new Date(selectedFile.lastModified).toLocaleString()}
            </div>
            <div className="op-spacer" />
            <button
              type="button"
              className="op-btn secondary"
              onClick={onReplaceFile}
              aria-label="Replace file"
              title="Choose a different file"
            >
              Replace file
            </button>
            <button
              type="button"
              className="op-btn ghost"
              onClick={onRemoveFile}
              aria-label="Remove file"
              title="Remove the selected file"
            >
              Remove
            </button>
          </div>
          {isProcessing && (
            <div className="op-status op-scroll-y op-maxh-40vh" role="status" aria-live="polite" style={{ marginTop: 8 }}>
              Processing… please wait
            </div>
          )}
          {!isProcessing && !hasError && localStatus === 'File ready' && (
            <div className="op-status success" role="status" aria-live="polite" style={{ marginTop: 8 }}>
              File ready. Preview has been generated.
            </div>
          )}
        </div>
      )}

      {/* Error state */}
      {hasError && (
        <div className="op-card" role="alert" style={{ marginTop: 12 }}>
          <div className="op-status error">
            {errorText} {ctxError ? '' : '' }
          </div>
          <div className="op-toolbar" style={{ marginTop: 8 }}>
            <button
              type="button"
              className="op-btn secondary"
              onClick={onBrowseClick}
              aria-label="Try again"
              title="Try again"
            >
              Try again
            </button>
            <button
              type="button"
              className="op-btn ghost"
              onClick={() => setShowErrorDetails((v) => !v)}
              aria-expanded={showErrorDetails}
              aria-controls="upload-error-details"
              title="View details"
            >
              View details
            </button>
          </div>
          {showErrorDetails && (
            <pre
              id="upload-error-details"
              className="op-prewrap op-scroll-y op-maxh-50vh"
              style={{
                marginTop: 8,
                background: '#0f172a0d',
                borderRadius: 8,
                padding: 8,
              }}
            >
{String(errorText)}
            </pre>
          )}
        </div>
      )}

      {/* Empty state prompt */}
      {!selectedFile && !hasError && !isProcessing && (
        <div className="op-card" role="status" aria-live="polite" style={{ marginTop: 12 }}>
          <p className="op-status">No file selected yet.</p>
        </div>
      )}
    </section>
  );
}
