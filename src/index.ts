#!/usr/bin/env node

/**
 * Canvas and Gradescope MCP Server
 * Main entry point following Dedalus Labs structure
 * 
 * Comprehensive implementation providing Canvas LMS and Gradescope integration
 * via Model Context Protocol (MCP)
 */

import { config as loadEnv } from 'dotenv';
loadEnv();

import { loadConfig, configSchema } from './config.js';
import { parseArgs } from './cli.js';
import { CanvasMCPServer } from './server.js';
import { runStdioTransport, startHttpTransport } from './transport/index.js';

export { configSchema };

/**
 * Transport selection logic:
 * 1. --stdio flag forces STDIO transport (for development/Claude Desktop)
 * 2. Default: HTTP transport for production compatibility (Dedalus platform)
 */
async function main() {
  try {
    const config = loadConfig();
    const cliOptions = parseArgs();
    
    if (cliOptions.stdio) {
      // STDIO transport for local development and Claude Desktop
      const serverWrapper = new CanvasMCPServer(config);
      const server = serverWrapper.getServer();
      await runStdioTransport(server);
    } else {
      // HTTP transport for production/cloud deployment (Dedalus)
      const port = cliOptions.port || config.port;
      startHttpTransport({ ...config, port });
    }
  } catch (error) {
    console.error("Fatal error running Canvas MCP server:", error);
    process.exit(1);
  }
}

main();
