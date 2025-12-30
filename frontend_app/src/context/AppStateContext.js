import React, { createContext, useContext, useMemo, useState, useCallback } from 'react';
import {
  parseFiles as svcParseFiles,
  generatePreview as svcGeneratePreview,
  exportReport as svcExportReport,
} from '../services/reportService';

/**
 * PUBLIC_INTERFACE
 * AppStateProvider wraps the app and exposes shared state and actions.
 *
 * Exposed State (stable):
 * - uploadedFiles: File[]
 * - normalizedTasks: Task[]
 * - rules: RuleConfig
 * - reportPreview: ReportPreviewData
 * - loading: boolean
 * - error: string
 * - statusMessage: string
 *
 * Exposed Actions (stable):
 * - parseFile(fileList: FileList|File[]): Promise<void>
 * - updateRules(partialRules: Partial<RuleConfig>): void
 * - generatePreview(): Promise<void>
 * - exportExcel(): Promise<string|null>
 *
 * JSDoc typedefs are defined in src/types/index.js and referenced here:
 * @typedef {import('../types').Task} Task
 * @typedef {import('../types').RuleConfig} RuleConfig
 * @typedef {import('../types').ReportPreviewData} ReportPreviewData
 */
const AppStateContext = createContext(null);

// PUBLIC_INTERFACE
export function AppStateProvider({ children }) {
  /** @type {[File[], React.Dispatch<React.SetStateAction<File[]>>]} */
  const [uploadedFiles, setUploadedFiles] = useState([]);
  /** @type {[Task[], React.Dispatch<React.SetStateAction<Task[]>>]} */
  const [normalizedTasks, setNormalizedTasks] = useState([]);
  /** @type {[RuleConfig, React.Dispatch<React.SetStateAction<RuleConfig>>]} */
  const [rules, setRules] = useState({
    grouping: 'assignee',
    timeframe: 'last_week',
    includeBlocked: true,
  });
  /** @type {[ReportPreviewData, React.Dispatch<React.SetStateAction<ReportPreviewData>>]} */
  const [reportPreview, setReportPreview] = useState([]);
  /** @type {[boolean, React.Dispatch<React.SetStateAction<boolean>>]} */
  const [loading, setLoading] = useState(false);
  /** @type {[string, React.Dispatch<React.SetStateAction<string>>]} */
  const [error, setError] = useState('');
  /** @type {[string, React.Dispatch<React.SetStateAction<string>>]} */
  const [statusMessage, setStatusMessage] = useState('Ready');

  /**
   * PUBLIC_INTERFACE
   * parseFile - Parses selected files to normalized task rows and prepares preview with current rules.
   * @param {FileList|File[]} fileList
   * @returns {Promise<void>}
   */
  const parseFile = useCallback(async (fileList) => {
    setError('');
    setStatusMessage('Parsing file…');
    setLoading(true);
    try {
      const files = Array.from(fileList || []);
      setUploadedFiles(files);
      /** @type {Task[]} */
      const rows = await svcParseFiles(files);
      setNormalizedTasks(rows);
      // Update preview to keep UI in sync on upload
      const groups = await svcGeneratePreview(rows, rules);
      setReportPreview(groups);
      setStatusMessage('Preview ready');
    } catch (e) {
      setError('Failed to parse files.');
      setStatusMessage('Parsing failed');
    } finally {
      setLoading(false);
    }
  }, [rules]);

  /**
   * PUBLIC_INTERFACE
   * updateRules - Merge partial rule updates and regenerate preview if tasks exist.
   * @param {Partial<RuleConfig>} partialRules
   */
  const updateRules = useCallback((partialRules) => {
    setRules((prev) => {
      const next = { ...prev, ...partialRules };
      if (normalizedTasks && normalizedTasks.length > 0) {
        setStatusMessage('Updating preview…');
        svcGeneratePreview(normalizedTasks, next)
          .then((g) => { setReportPreview(g); setStatusMessage('Preview updated'); })
          .catch(() => { setStatusMessage('Preview update failed'); });
      }
      return next;
    });
  }, [normalizedTasks]);

  /**
   * PUBLIC_INTERFACE
   * generatePreview - Recompute preview data from normalizedTasks + rules.
   * @returns {Promise<void>}
   */
  const generatePreview = useCallback(async () => {
    setError('');
    setStatusMessage('Generating preview…');
    setLoading(true);
    try {
      const groups = await svcGeneratePreview(normalizedTasks || [], rules);
      setReportPreview(groups);
      setStatusMessage('Preview ready');
    } catch (e) {
      setError('Failed to generate preview.');
      setStatusMessage('Preview generation failed');
    } finally {
      setLoading(false);
    }
  }, [normalizedTasks, rules]);

  /**
   * PUBLIC_INTERFACE
   * exportExcel - Triggers report export using the current preview data.
   * Returns a blob URL used by callers for download, if needed.
   * @returns {Promise<string|null>}
   */
  const exportExcel = useCallback(async () => {
    setError('');
    setStatusMessage('Preparing export…');
    setLoading(true);
    try {
      if (!reportPreview || reportPreview.length === 0) {
        setStatusMessage('Nothing to export');
        return null;
      }
      const url = await svcExportReport(reportPreview);
      setStatusMessage('Export ready');
      return url;
    } catch (e) {
      setError('Failed to export report.');
      setStatusMessage('Export failed');
      return null;
    } finally {
      setLoading(false);
    }
  }, [reportPreview]);

  const value = useMemo(
    () => ({
      // Stable state
      uploadedFiles,
      normalizedTasks,
      rules,
      reportPreview,
      loading,
      error,
      statusMessage,
      // Backward compatibility setters for current components (will be removed later)
      setUploadedFiles,
      setRules,
      setPreview: setReportPreview,
      preview: reportPreview,
      // Stable actions
      parseFile,
      updateRules,
      generatePreview,
      exportExcel,
    }),
    [
      uploadedFiles,
      normalizedTasks,
      rules,
      reportPreview,
      loading,
      error,
      statusMessage,
      parseFile,
      updateRules,
      generatePreview,
      exportExcel,
    ]
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

// PUBLIC_INTERFACE
export function useAppState() {
  /**
   * Returns the app state context or throws if missing.
   * Provides state, setters (for backward compatibility), and typed actions.
   */
  const ctx = useContext(AppStateContext);
  if (!ctx) {
    throw new Error('useAppState must be used within AppStateProvider');
  }
  return ctx;
}
