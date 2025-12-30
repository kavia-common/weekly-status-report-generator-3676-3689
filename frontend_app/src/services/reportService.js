const API_BASE = process.env.REACT_APP_API_BASE || process.env.REACT_APP_BACKEND_URL || '';

/**
 * Compute ISO week number for a date.
 * Returns { year, week } using ISO-8601 standard (week starts Monday).
 */
function getISOWeekInfo(date = new Date()) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  // Thursday in current week decides the year
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return { year: d.getUTCFullYear(), week };
}

/**
 * PUBLIC_INTERFACE
 * buildExportBaseName - Build standardized export base file name (without extension).
 * Pattern: WeeklyStatus_{TeamOrProject}_{YYYY-MM-DD}_W{ISOWeek}
 * @param {{ teamOrProject?: string; date?: Date }} [opts]
 * @returns {string}
 */
export function buildExportBaseName(opts = {}) {
  const date = opts.date || new Date();
  const { week } = getISOWeekInfo(date);
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const safeName = (opts.teamOrProject || 'Project')
    .toString()
    .trim()
    .replace(/[^a-z0-9-_]+/gi, '_')
    .replace(/^_+|_+$/g, '');
  return `WeeklyStatus_${safeName}_${yyyy}-${mm}-${dd}_W${String(week).padStart(2, '0')}`;
}

/**
 * PUBLIC_INTERFACE
 * parseFiles - mock parse CSV/Jira export files into normalized rows.
 * @param {File[]} files
 * @returns {Promise<import('../types').Task[]>}
 */
export async function parseFiles(files) {
  // Mocked delay and sample data
  await new Promise((r) => setTimeout(r, 300));
  return [
    { id: 'T-101', assignee: 'Alice', status: 'Done', hours: 8, summary: 'Implement login' },
    { id: 'T-102', assignee: 'Bob', status: 'In Progress', hours: 5, summary: 'Build API' },
  ];
}

/**
 * PUBLIC_INTERFACE
 * generatePreview - mock transformation of parsed rows with applied rules.
 * @param {import('../types').Task[]} rows
 * @param {import('../types').RuleConfig} rules
 * @returns {Promise<import('../types').ReportPreviewData>}
 */
export async function generatePreview(rows, rules) {
  await new Promise((r) => setTimeout(r, 200));
  // Simple grouping mock based on rules.grouping
  const by = rules?.grouping || 'assignee';
  const groups = {};
  rows.forEach((r) => {
    const key = r[by] || 'Unknown';
    groups[key] = groups[key] || { group: key, items: [], totalHours: 0 };
    groups[key].items.push(r);
    groups[key].totalHours += r.hours || 0;
  });
  return Object.values(groups);
}

/**
 * PUBLIC_INTERFACE
 * exportReport - mock export action that would call backend to produce Excel.
 * Returns a Blob URL or triggers download client-side in future.
 * @param {import('../types').ReportPreviewData} previewData
 * @param {{ filename?: string }} [options]
 * @returns {Promise<string>} blob URL to download
 */
export async function exportReport(previewData, options = {}) {
  await new Promise((r) => setTimeout(r, 200));
  const content = `Weekly Status Report\nGroups: ${previewData.length}\nGenerated: ${new Date().toISOString()}\n`;
  const blob = new Blob([content], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  // Note: caller is responsible for setting the anchor download attribute using their computed filename
  return url;
}
