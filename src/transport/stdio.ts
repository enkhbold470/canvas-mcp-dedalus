/**
 * STDIO Transport for Canvas MCP Server
 * Used for development and local testing
 * Following Dedalus Labs transport structure
 */

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";

/**
 * Run server with STDIO transport
 */
export async function runStdioTransport(server: Server): Promise<void> {
  const transport = new StdioServerTransport();
  
  try {
    await server.connect(transport);
    console.error("Canvas MCP Server running on stdio");
  } catch (error) {
    console.error("Failed to start STDIO transport:", error);
    throw error;
  }
}
