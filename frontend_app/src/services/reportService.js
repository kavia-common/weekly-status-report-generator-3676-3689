const API_BASE = process.env.REACT_APP_API_BASE || process.env.REACT_APP_BACKEND_URL || '';

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
 * @returns {Promise<string>} blob URL to download
 */
export async function exportReport(previewData) {
  await new Promise((r) => setTimeout(r, 200));
  const content = `Weekly Status Report\nGroups: ${previewData.length}\nGenerated: ${new Date().toISOString()}\n`;
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  return URL.createObjectURL(blob);
}
