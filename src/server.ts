/**
 * Server instance creation and configuration
 * Following Dedalus Labs server structure
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  InitializedNotificationSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { CanvasApi, GradescopeApi } from './client/index.js';
import { Logger, Config } from './config.js';
import { cache } from './cache.js';
import {
  // Canvas tools
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
  handleGetAssignmentsByNameTool,
  // Gradescope tools
  getGradescopeCoursesToolDefinition,
  getGradescopeCourseByNameToolDefinition,
  getGradescopeAssignmentsToolDefinition,
  getGradescopeAssignmentByNameToolDefinition,
  handleGetGradescopeCoursesTool,
  handleGetGradescopeCourseByNameTool,
  handleGetGradescopeAssignmentsTool,
  handleGetGradescopeAssignmentByNameTool
} from './tools/index.js';

/**
 * Create a standalone MCP server instance
 */
export function createStandaloneServer(config: Config): Server {
  const serverInstance = new Server(
    {
      name: "enkhbold470/canvas-mcp-dedalus",
      version: "1.0.0",
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // Initialize logger and APIs
  const logger = new Logger(config.debug);
  const canvasApi = new CanvasApi({
    apiKey: config.canvasApiKey,
    baseUrl: config.canvasBaseUrl,
    logger
  });
  const hasCanvasConfig = Boolean(config.canvasApiKey);

  // Initialize Gradescope API only if credentials are provided
  let gradescopeApi: GradescopeApi | null = null;
  if (config.gradescopeEmail && config.gradescopePassword) {
    gradescopeApi = new GradescopeApi({
      email: config.gradescopeEmail,
      password: config.gradescopePassword,
      logger
    });
  } else {
    logger.warn("Gradescope credentials not provided - Gradescope tools will not be available");
  }

  // Notification handlers
  serverInstance.setNotificationHandler(InitializedNotificationSchema, async () => {
    logger.log(`Canvas MCP Server initialized with ${gradescopeApi ? 'Canvas and Gradescope' : 'Canvas only'} support`);
  });

  // List tools handler
  serverInstance.setRequestHandler(ListToolsRequestSchema, async () => {
    const tools = [
      // Canvas tools (always available)
      getCoursesToolDefinition,
      getModulesToolDefinition,
      getModuleItemsToolDefinition,
      getFileUrlToolDefinition,
      getCourseAssignmentsToolDefinition,
      getAssignmentsByNameToolDefinition,
      getCanvasCoursesToolDefinition,
    ];

    // Add Gradescope tools if available
    if (gradescopeApi) {
      tools.push(
        getGradescopeCoursesToolDefinition,
        getGradescopeCourseByNameToolDefinition,
        getGradescopeAssignmentsToolDefinition,
        getGradescopeAssignmentByNameToolDefinition
      );
    }

    // Add utility tools
    tools.push(
      {
        name: "get_cache_stats",
        description: "Get statistics about the current cache state for debugging purposes",
        inputSchema: {
          type: "object",
          properties: {},
          required: []
        }
      },
      {
        name: "clear_cache",
        description: "Clear all cached data to force fresh API requests",
        inputSchema: {
          type: "object",
          properties: {},
          required: []
        }
      }
    );

    return { tools };
  });

  // Call tool handler
  serverInstance.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    // Check if Canvas is configured for Canvas tools
    const canvasTools = [
      "get_courses", "get_modules", "get_module_items", 
      "get_file_url", "get_course_assignments", "get_assignments_by_course_name", 
      "get_canvas_courses"
    ];
    
    if (canvasTools.includes(name) && !hasCanvasConfig) {
      return {
        content: [{
          type: "text",
          text: "Canvas is not configured. Set CANVAS_API_KEY (and optionally CANVAS_BASE_URL) to enable Canvas tools."
        }],
        isError: true
      };
    }

    // Route to appropriate handler
    try {
      switch (name) {
        // Canvas tools
        case "get_courses":
        case "get_canvas_courses":
          return await handleGetCoursesTool(canvasApi, args);
        
        case "get_modules":
          return await handleGetModulesTool(canvasApi, args);
        
        case "get_module_items":
          return await handleGetModuleItemsTool(canvasApi, args);
        
        case "get_file_url":
          return await handleGetFileUrlTool(canvasApi, args);
        
        case "get_course_assignments":
          return await handleGetCourseAssignmentsTool(canvasApi, args);
        
        case "get_assignments_by_course_name":
          return await handleGetAssignmentsByNameTool(canvasApi, args);
        
        // Gradescope tools
        case "get_gradescope_courses":
          if (!gradescopeApi) {
            return {
              content: [{
                type: "text",
                text: "Gradescope is not configured. Set GRADESCOPE_EMAIL and GRADESCOPE_PASSWORD to enable Gradescope tools."
              }],
              isError: true
            };
          }
          return await handleGetGradescopeCoursesTool(gradescopeApi, args);
        
        case "get_gradescope_course_by_name":
          if (!gradescopeApi) {
            return {
              content: [{
                type: "text",
                text: "Gradescope is not configured. Set GRADESCOPE_EMAIL and GRADESCOPE_PASSWORD to enable Gradescope tools."
              }],
              isError: true
            };
          }
          return await handleGetGradescopeCourseByNameTool(gradescopeApi, args);
        
        case "get_gradescope_assignments":
          if (!gradescopeApi) {
            return {
              content: [{
                type: "text",
                text: "Gradescope is not configured. Set GRADESCOPE_EMAIL and GRADESCOPE_PASSWORD to enable Gradescope tools."
              }],
              isError: true
            };
          }
          return await handleGetGradescopeAssignmentsTool(gradescopeApi, args);
        
        case "get_gradescope_assignment_by_name":
          if (!gradescopeApi) {
            return {
              content: [{
                type: "text",
                text: "Gradescope is not configured. Set GRADESCOPE_EMAIL and GRADESCOPE_PASSWORD to enable Gradescope tools."
              }],
              isError: true
            };
          }
          return await handleGetGradescopeAssignmentByNameTool(gradescopeApi, args);
        
        // Utility tools
        case "get_cache_stats":
          const stats = cache.getStats();
          return {
            content: [{
              type: "text",
              text: JSON.stringify(stats, null, 2)
            }],
            isError: false
          };
        
        case "clear_cache":
          cache.clear();
          return {
            content: [{
              type: "text",
              text: "Cache cleared successfully"
            }],
            isError: false
          };
        
        default:
          return {
            content: [{ type: "text", text: `Unknown tool: ${name}` }],
            isError: true
          };
      }
    } catch (error) {
      logger.error(`Error handling tool ${name}:`, error);
      return {
        content: [{
          type: "text",
          text: `Error: ${error instanceof Error ? error.message : String(error)}`
        }],
        isError: true
      };
    }
  });

  return serverInstance;
}

/**
 * Canvas MCP Server class for managing server instances
 */
export class CanvasMCPServer {
  private config: Config;

  constructor(config: Config) {
    this.config = config;
  }

  getServer(): Server {
    return createStandaloneServer(this.config);
  }
}
