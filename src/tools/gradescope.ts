/**
 * Gradescope tool definitions and handlers
 * Following Dedalus Labs structure for tool organization
 */

import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { GradescopeApi } from '../client/index.js';
import type {
  GetGradescopeCoursesArgs,
  GetGradescopeCourseByNameArgs,
  GetGradescopeAssignmentsArgs,
  GetGradescopeAssignmentByNameArgs
} from '../types.js';

// ============ Tool Definitions ============

export const getGradescopeCoursesToolDefinition: Tool = {
  name: "get_gradescope_courses",
  description: "Use this tool to retrieve all available Gradescope courses for the current user. This tool returns a dictionary of courses organized by user role. Use this when helping users access or manage their Gradescope course information.",
  inputSchema: {
    type: "object",
    properties: {},
    required: []
  }
};

export const getGradescopeCourseByNameToolDefinition: Tool = {
  name: "get_gradescope_course_by_name",
  description: "Use this tool to find a specific Gradescope course by name (partial matches supported). This tool returns the course object if found. Use this when you need to get course details or ID when only the name is known.",
  inputSchema: {
    type: "object",
    properties: {
      course_name: {
        type: "string",
        description: "The name or partial name of the Gradescope course to search for"
      }
    },
    required: ["course_name"]
  }
};

export const getGradescopeAssignmentsToolDefinition: Tool = {
  name: "get_gradescope_assignments",
  description: "Use this tool to retrieve all assignments for a specific Gradescope course, including the student's submission information (grades, status, due dates). This tool returns comprehensive assignment and submission details for the authenticated student. Use this when helping students manage their Gradescope coursework.",
  inputSchema: {
    type: "object",
    properties: {
      course_id: {
        type: "string",
        description: "The Gradescope course ID"
      }
    },
    required: ["course_id"]
  }
};

export const getGradescopeAssignmentByNameToolDefinition: Tool = {
  name: "get_gradescope_assignment_by_name",
  description: "Use this tool to find a specific Gradescope assignment by name within a course. This tool returns the assignment object if found, including the student's submission information (grade, status, due dates). Use this when you need assignment details when only the name and course are known.",
  inputSchema: {
    type: "object",
    properties: {
      course_id: {
        type: "string",
        description: "The Gradescope course ID"
      },
      assignment_name: {
        type: "string",
        description: "The name or partial name of the assignment to search for"
      }
    },
    required: ["course_id", "assignment_name"]
  }
};

// ============ Type Guards ============

function isGetGradescopeCourseByNameArgs(args: unknown): args is GetGradescopeCourseByNameArgs {
  return (
    typeof args === "object" &&
    args !== null &&
    "course_name" in args &&
    typeof (args as { course_name: unknown }).course_name === "string"
  );
}

function isGetGradescopeAssignmentsArgs(args: unknown): args is GetGradescopeAssignmentsArgs {
  return (
    typeof args === "object" &&
    args !== null &&
    "course_id" in args &&
    typeof (args as { course_id: unknown }).course_id === "string"
  );
}

function isGetGradescopeAssignmentByNameArgs(args: unknown): args is GetGradescopeAssignmentByNameArgs {
  return (
    typeof args === "object" &&
    args !== null &&
    "course_id" in args &&
    "assignment_name" in args &&
    typeof (args as { course_id: unknown }).course_id === "string" &&
    typeof (args as { assignment_name: unknown }).assignment_name === "string"
  );
}

// ============ Tool Handlers ============

export async function handleGetGradescopeCoursesTool(
  gradescopeApi: GradescopeApi,
  args: unknown
): Promise<CallToolResult> {
  try {
    const courses = await gradescopeApi.getGradescopeCourses();
    return {
      content: [{
        type: "text",
        text: courses ? JSON.stringify(courses, null, 2) : "Failed to retrieve Gradescope courses"
      }],
      isError: false
    };
  } catch (error) {
    return {
      content: [{
        type: "text",
        text: `Error: ${error instanceof Error ? error.message : String(error)}`
      }],
      isError: true
    };
  }
}

export async function handleGetGradescopeCourseByNameTool(
  gradescopeApi: GradescopeApi,
  args: unknown
): Promise<CallToolResult> {
  try {
    if (!args) {
      throw new Error("No arguments provided");
    }

    if (!isGetGradescopeCourseByNameArgs(args)) {
      throw new Error("Invalid arguments for get_gradescope_course_by_name");
    }

    const course = await gradescopeApi.getGradescopeCourseByName(args.course_name);
    return {
      content: [{
        type: "text",
        text: course ? JSON.stringify(course, null, 2) : "Course not found"
      }],
      isError: false
    };
  } catch (error) {
    return {
      content: [{
        type: "text",
        text: `Error: ${error instanceof Error ? error.message : String(error)}`
      }],
      isError: true
    };
  }
}

export async function handleGetGradescopeAssignmentsTool(
  gradescopeApi: GradescopeApi,
  args: unknown
): Promise<CallToolResult> {
  try {
    if (!args) {
      throw new Error("No arguments provided");
    }

    if (!isGetGradescopeAssignmentsArgs(args)) {
      throw new Error("Invalid arguments for get_gradescope_assignments");
    }

    const assignments = await gradescopeApi.getGradescopeAssignments(args.course_id);
    return {
      content: [{
        type: "text",
        text: assignments ? JSON.stringify(assignments, null, 2) : "Failed to retrieve assignments"
      }],
      isError: false
    };
  } catch (error) {
    return {
      content: [{
        type: "text",
        text: `Error: ${error instanceof Error ? error.message : String(error)}`
      }],
      isError: true
    };
  }
}

export async function handleGetGradescopeAssignmentByNameTool(
  gradescopeApi: GradescopeApi,
  args: unknown
): Promise<CallToolResult> {
  try {
    if (!args) {
      throw new Error("No arguments provided");
    }

    if (!isGetGradescopeAssignmentByNameArgs(args)) {
      throw new Error("Invalid arguments for get_gradescope_assignment_by_name");
    }

    const assignment = await gradescopeApi.getGradescopeAssignmentByName(
      args.course_id,
      args.assignment_name
    );
    return {
      content: [{
        type: "text",
        text: assignment ? JSON.stringify(assignment, null, 2) : "Assignment not found"
      }],
      isError: false
    };
  } catch (error) {
    return {
      content: [{
        type: "text",
        text: `Error: ${error instanceof Error ? error.message : String(error)}`
      }],
      isError: true
    };
  }
}
