import React, { createContext, useContext, useMemo, useState } from 'react';

/**
 * PUBLIC_INTERFACE
 * AppStateProvider wraps the app and exposes shared state for:
 * - uploadedFiles: original data files uploaded by the user
 * - rules: rule configuration object for report generation
 * - preview: mock preview data of the generated report
 * - actions: helper functions for updating state
 */
const AppStateContext = createContext(null);

// PUBLIC_INTERFACE
export function AppStateProvider({ children }) {
  /** @type {[File[], Function]} */
  const [uploadedFiles, setUploadedFiles] = useState([]);
  /** @type {[Record<string, any>, Function]} */
  const [rules, setRules] = useState({
    grouping: 'assignee',
    timeframe: 'last_week',
    includeBlocked: true,
  });
  /** @type {[Array<any>, Function]} */
  const [preview, setPreview] = useState([]);

  const value = useMemo(
    () => ({
      uploadedFiles,
      setUploadedFiles,
      rules,
      setRules,
      preview,
      setPreview,
    }),
    [uploadedFiles, rules, preview]
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

// PUBLIC_INTERFACE
export function useAppState() {
  /** Returns the app state context or throws if missing. */
  const ctx = useContext(AppStateContext);
  if (!ctx) {
    throw new Error('useAppState must be used within AppStateProvider');
  }
  return ctx;
}
