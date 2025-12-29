import React, { createContext, useContext, useMemo, useState, useCallback } from 'react';
import '../types/index.js';
import { parseFiles, generatePreview as svcGeneratePreview, exportReport as svcExportReport } from '../services/reportService';

/**
 * PUBLIC_INTERFACE
 * AppStateProvider wraps the app and exposes shared state and actions:
 *
 * State:
 * - uploadedFiles: original data files uploaded by the user
 * - normalizedTasks: parsed/normalized task rows
 * - rules: rule configuration object for report generation
 * - preview: grouped report preview data
 * - loading: indicates async work in progress
 * - error: error message if any operation fails
 *
 * Actions:
 * - parseFile(fileList): parses files and updates uploadedFiles and normalizedTasks
 * - updateRules(partialRules): merges rule updates into the rules state
 * - generatePreview(): transforms normalizedTasks using rules into preview
 * - exportExcel(): triggers mock export with current preview
 *
 * JSDoc typedefs are defined in src/types/index.js and referenced here:
 * @typedef {import('../types/index').Task} Task
 * @typedef {import('../types/index').RuleConfig} RuleConfig
 * @typedef {import('../types/index').ReportPreviewData} ReportPreviewData
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
  const [preview, setPreview] = useState([]);
  /** @type {[boolean, React.Dispatch<React.SetStateAction<boolean>>]} */
  const [loading, setLoading] = useState(false);
  /** @type {[string, React.Dispatch<React.SetStateAction<string>>]} */
  const [error, setError] = useState('');

  /**
   * PUBLIC_INTERFACE
   * parseFile - Parses selected files to normalized task rows and prepares preview with current rules.
   * @param {FileList|File[]} fileList
   * @returns {Promise<void>}
   */
  const parseFile = useCallback(async (fileList) => {
    setError('');
    setLoading(true);
    try {
      const files = Array.from(fileList || []);
      setUploadedFiles(files);
      /** @type {Task[]} */
      const rows = await parseFiles(files);
      setNormalizedTasks(rows);
      // Keep existing components working by also updating preview here
      const groups = await svcGeneratePreview(rows, rules);
      setPreview(groups);
    } catch (e) {
      setError('Failed to parse files.');
    } finally {
      setLoading(false);
    }
  }, [rules]);

  /**
   * PUBLIC_INTERFACE
   * updateRules - Merge partial rule updates and optionally regenerate preview.
   * @param {Partial<RuleConfig>} partial
   */
  const updateRules = useCallback((partial) => {
    setRules((prev) => {
      const next = { ...prev, ...partial };
      // Optimistically regenerate preview if tasks exist
      if (normalizedTasks && normalizedTasks.length > 0) {
        svcGeneratePreview(normalizedTasks, next).then(setPreview).catch(() => {});
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
    setLoading(true);
    try {
      const groups = await svcGeneratePreview(normalizedTasks || [], rules);
      setPreview(groups);
    } catch (e) {
      setError('Failed to generate preview.');
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
    setLoading(true);
    try {
      if (!preview || preview.length === 0) return null;
      const url = await svcExportReport(preview);
      return url;
    } catch (e) {
      setError('Failed to export report.');
      return null;
    } finally {
      setLoading(false);
    }
  }, [preview]);

  const value = useMemo(
    () => ({
      // State
      uploadedFiles,
      setUploadedFiles, // kept for backward compatibility
      normalizedTasks,
      rules,
      setRules, // kept for backward compatibility with RuleConfig
      preview,
      setPreview, // kept for backward compatibility with Upload/Preview components
      loading,
      error,
      // Actions
      parseFile,
      updateRules,
      generatePreview,
      exportExcel,
    }),
    [
      uploadedFiles,
      normalizedTasks,
      rules,
      preview,
      loading,
      error,
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
