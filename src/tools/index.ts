/**
 * Tool exports
 * Centralized exports for all MCP tools
 */

// Canvas Tools
export {
  getCoursesToolDefinition,
  getModulesToolDefinition,
  getModuleItemsToolDefinition,
  getFileUrlToolDefinition,
  getCourseAssignmentsToolDefinition,
  getAssignmentsByNameToolDefinition,
  getCanvasCoursesToolDefinition,
  handleGetCoursesTool,
  handleGetModulesTool,
  handleGetModuleItemsTool,
  handleGetFileUrlTool,
  handleGetCourseAssignmentsTool,
  handleGetAssignmentsByNameTool
} from './canvas.js';

// Gradescope Tools
export {
  getGradescopeCoursesToolDefinition,
  getGradescopeCourseByNameToolDefinition,
  getGradescopeAssignmentsToolDefinition,
  getGradescopeAssignmentByNameToolDefinition,
  handleGetGradescopeCoursesTool,
  handleGetGradescopeCourseByNameTool,
  handleGetGradescopeAssignmentsTool,
  handleGetGradescopeAssignmentByNameTool
} from './gradescope.js';
