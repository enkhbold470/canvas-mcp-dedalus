/**
 * Canvas LMS tool definitions and handlers
 * Following Dedalus Labs structure for tool organization
 */

import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { CanvasApi } from '../client/index.js';
import type {
  GetCoursesArgs,
  GetModulesArgs,
  GetModuleItemsArgs,
  GetFileUrlArgs,
  GetCourseAssignmentsArgs,
  GetAssignmentsByNameArgs
} from '../types.js';

// ============ Tool Definitions ============

export const getCoursesToolDefinition: Tool = {
  name: "get_courses",
  description: "Use this tool to retrieve all available Canvas courses for the current user. This tool returns a dictionary mapping course names to their corresponding IDs. Use this when you need to find course IDs based on names, display all available courses, or when needing to access any course-related information.",
  inputSchema: {
    type: "object",
    properties: {},
    required: []
  }
};

export const getModulesToolDefinition: Tool = {
  name: "get_modules",
  description: "Use this tool to retrieve all modules within a specific Canvas course. This tool returns a list of module objects containing module details like ID, name, and status. Use this when exploring or navigating course content structure.",
  inputSchema: {
    type: "object",
    properties: {
      course_id: {
        type: "string",
        description: "The Canvas course ID (required)"
      }
    },
    required: ["course_id"]
  }
};

export const getModuleItemsToolDefinition: Tool = {
  name: "get_module_items",
  description: "Use this tool to retrieve all items within a specific module in a Canvas course. This tool returns a list of module item objects containing details like title, type, and URLs. Use this when you need to access specific learning materials, assignments, or other content within a module.",
  inputSchema: {
    type: "object",
    properties: {
      course_id: {
        type: "string",
        description: "The Canvas course ID (required)"
      },
      module_id: {
        type: "string",
        description: "The Canvas module ID (required)"
      }
    },
    required: ["course_id", "module_id"]
  }
};

export const getFileUrlToolDefinition: Tool = {
  name: "get_file_url",
  description: "Use this tool to get the direct download URL for a file stored in Canvas. This tool returns a URL string that can be used to access or download the file. Use this when you need direct access to file content rather than just the Canvas page URL.",
  inputSchema: {
    type: "object",
    properties: {
      course_id: {
        type: "string",
        description: "The Canvas course ID"
      },
      file_id: {
        type: "string",
        description: "The Canvas file ID"
      }
    },
    required: ["course_id", "file_id"]
  }
};

export const getCourseAssignmentsToolDefinition: Tool = {
  name: "get_course_assignments",
  description: "Use this tool to retrieve all assignments for a specific Canvas course, with optional filtering by status. This tool returns assignment details including name, description, due date, and submission status. Use this when helping users manage their coursework, check due dates, or find assignment details.",
  inputSchema: {
    type: "object",
    properties: {
      course_id: {
        type: "string",
        description: "The Canvas course ID"
      },
      bucket: {
        type: "string",
        description: "Optional filter - past, overdue, undated, ungraded, unsubmitted, upcoming, future"
      }
    },
    required: ["course_id"]
  }
};

export const getAssignmentsByNameToolDefinition: Tool = {
  name: "get_assignments_by_course_name",
  description: "Use this tool to retrieve all assignments for a Canvas course using its name rather than ID. This tool returns assignment details the same as get_course_assignments. Use this when you have the course name but not the ID, or when helping users find assignments across multiple courses.",
  inputSchema: {
    type: "object",
    properties: {
      course_name: {
        type: "string",
        description: "The name of the course as it appears in Canvas (partial matches supported)"
      },
      bucket: {
        type: "string",
        description: "Optional filter - past, overdue, undated, ungraded, unsubmitted, upcoming, future"
      }
    },
    required: ["course_name"]
  }
};

export const getCanvasCoursesToolDefinition: Tool = {
  name: "get_canvas_courses",
  description: "Use this tool to retrieve all available Canvas courses for the current user. This is an alias for get_courses. Use this when you need to find course IDs based on names or display all available courses.",
  inputSchema: {
    type: "object",
    properties: {},
    required: []
  }
};

// ============ Type Guards ============

function isGetModulesArgs(args: unknown): args is GetModulesArgs {
  return (
    typeof args === "object" &&
    args !== null &&
    "course_id" in args &&
    typeof (args as { course_id: unknown }).course_id === "string"
  );
}

function isGetModuleItemsArgs(args: unknown): args is GetModuleItemsArgs {
  return (
    typeof args === "object" &&
    args !== null &&
    "course_id" in args &&
    "module_id" in args &&
    typeof (args as { course_id: unknown }).course_id === "string" &&
    typeof (args as { module_id: unknown }).module_id === "string"
  );
}

function isGetFileUrlArgs(args: unknown): args is GetFileUrlArgs {
  return (
    typeof args === "object" &&
    args !== null &&
    "course_id" in args &&
    "file_id" in args &&
    typeof (args as { course_id: unknown }).course_id === "string" &&
    typeof (args as { file_id: unknown }).file_id === "string"
  );
}

function isGetCourseAssignmentsArgs(args: unknown): args is GetCourseAssignmentsArgs {
  return (
    typeof args === "object" &&
    args !== null &&
    "course_id" in args &&
    typeof (args as { course_id: unknown }).course_id === "string"
  );
}

function isGetAssignmentsByNameArgs(args: unknown): args is GetAssignmentsByNameArgs {
  return (
    typeof args === "object" &&
    args !== null &&
    "course_name" in args &&
    typeof (args as { course_name: unknown }).course_name === "string"
  );
}

// ============ Tool Handlers ============

export async function handleGetCoursesTool(
  canvasApi: CanvasApi,
  args: unknown
): Promise<CallToolResult> {
  try {
    const courses = await canvasApi.getCourses();
    return {
      content: [{
        type: "text",
        text: courses ? JSON.stringify(courses, null, 2) : "Failed to retrieve courses"
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

export async function handleGetModulesTool(
  canvasApi: CanvasApi,
  args: unknown
): Promise<CallToolResult> {
  try {
    if (!args) {
      throw new Error("No arguments provided");
    }

    if (!isGetModulesArgs(args)) {
      throw new Error("Invalid arguments for get_modules");
    }

    const modules = await canvasApi.getModules(args.course_id);
    return {
      content: [{
        type: "text",
        text: modules ? JSON.stringify(modules, null, 2) : "Failed to retrieve modules"
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

export async function handleGetModuleItemsTool(
  canvasApi: CanvasApi,
  args: unknown
): Promise<CallToolResult> {
  try {
    if (!args) {
      throw new Error("No arguments provided");
    }

    if (!isGetModuleItemsArgs(args)) {
      throw new Error("Invalid arguments for get_module_items");
    }

    const items = await canvasApi.getModuleItems(args.course_id, args.module_id);
    return {
      content: [{
        type: "text",
        text: items ? JSON.stringify(items, null, 2) : "Failed to retrieve module items"
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

export async function handleGetFileUrlTool(
  canvasApi: CanvasApi,
  args: unknown
): Promise<CallToolResult> {
  try {
    if (!args) {
      throw new Error("No arguments provided");
    }

    if (!isGetFileUrlArgs(args)) {
      throw new Error("Invalid arguments for get_file_url");
    }

    const url = await canvasApi.getFileUrl(args.course_id, args.file_id);
    return {
      content: [{
        type: "text",
        text: url || "Failed to retrieve file URL"
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

export async function handleGetCourseAssignmentsTool(
  canvasApi: CanvasApi,
  args: unknown
): Promise<CallToolResult> {
  try {
    if (!args) {
      throw new Error("No arguments provided");
    }

    if (!isGetCourseAssignmentsArgs(args)) {
      throw new Error("Invalid arguments for get_course_assignments");
    }

    const assignments = await canvasApi.getCourseAssignments(args.course_id, args.bucket);
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

export async function handleGetAssignmentsByNameTool(
  canvasApi: CanvasApi,
  args: unknown
): Promise<CallToolResult> {
  try {
    if (!args) {
      throw new Error("No arguments provided");
    }

    if (!isGetAssignmentsByNameArgs(args)) {
      throw new Error("Invalid arguments for get_assignments_by_course_name");
    }

    const assignments = await canvasApi.getAssignmentsByCourseName(args.course_name, args.bucket);
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
