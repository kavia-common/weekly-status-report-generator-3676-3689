/**
 * Shared JSDoc typedefs for the Weekly Status Report Generator.
 * Import this file where type references are needed via JSDoc comments.
 * This file defines the stable, public shape of core data structures used
 * across components and the app state context.
 */

/**
 * PUBLIC_INTERFACE
 * @typedef {Object} Task
 * @property {string} id - Unique task identifier (e.g., JIRA key).
 * @property {string} assignee - Person responsible for the task.
 * @property {string} status - Current workflow status (e.g., Done, In Progress).
 * @property {number} hours - Time spent in hours (numeric).
 * @property {string} summary - Short summary/description of the task.
 */

/**
 * PUBLIC_INTERFACE
 * RuleConfig defines how reports should be generated.
 * Maintain this as the stable public interface for rule settings.
 * @typedef {Object} RuleConfig
 * @property {"assignee"|"status"} grouping - Field to group tasks by.
 * @property {"last_week"|"this_week"} timeframe - Which time window to include.
 * @property {boolean} [includeBlocked] - Whether to include blocked tasks.
 */

/**
 * PUBLIC_INTERFACE
 * ReportPreviewItem is a single task entry inside a group within the preview.
 * @typedef {Object} ReportPreviewItem
 * @property {string} id
 * @property {string} summary
 * @property {number} hours
 * @property {string} status
 */

/**
 * PUBLIC_INTERFACE
 * ReportPreviewGroup represents one group of items and aggregated hours.
 * @typedef {Object} ReportPreviewGroup
 * @property {string} group - Group key (value of grouping field).
 * @property {ReportPreviewItem[]} items - Items in this group.
 * @property {number} totalHours - Aggregated hours for the group.
 */

/**
 * PUBLIC_INTERFACE
 * ReportPreviewData is a list of grouped preview data.
 * This is the type used by the AppStateContext 'preview' value.
 * @typedef {ReportPreviewGroup[]} ReportPreviewData
 */

/**
 * PUBLIC_INTERFACE
 * These runtime no-op exports exist solely so that IDEs and tooling can import
 * the typedef names from this module in JS projects.
 */
// eslint-disable-next-line no-unused-vars
export const Task = undefined;
// eslint-disable-next-line no-unused-vars
export const RuleConfig = undefined;
// eslint-disable-next-line no-unused-vars
export const ReportPreviewItem = undefined;
// eslint-disable-next-line no-unused-vars
export const ReportPreviewGroup = undefined;
// eslint-disable-next-line no-unused-vars
export const ReportPreviewData = undefined;
