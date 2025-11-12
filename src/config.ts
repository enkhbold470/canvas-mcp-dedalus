/**
 * Configuration management for Canvas MCP
 * Handles environment variables and settings
 * Following Dedalus Labs configuration structure
 */

import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

// Configuration schema validation
export const configSchema = z.object({
  debug: z.boolean().default(false).describe("Enable debug logging"),
  canvasApiKey: z.string().default("").describe("Canvas API key. Optional; if omitted, Canvas tools will explain how to configure."),
  canvasBaseUrl: z.string().default("https://canvas.asu.edu").describe("Canvas base URL"),
  gradescopeEmail: z.string().optional().describe("Gradescope email"),
  gradescopePassword: z.string().optional().describe("Gradescope password"),
  port: z.number().default(8080).describe("HTTP server port"),
  isProduction: z.boolean().default(false).describe("Production mode flag")
});

export type Config = z.infer<typeof configSchema>;

/**
 * Load and validate configuration from environment variables
 */
export function loadConfig(): Config {
  const port = parseInt(process.env.PORT || '8080', 10);
  const isProduction = process.env.NODE_ENV === 'production';
  
  const config = {
    debug: process.env.DEBUG === 'true',
    canvasApiKey: process.env.CANVAS_API_KEY || '',
    canvasBaseUrl: process.env.CANVAS_BASE_URL || 'https://deanza.instructure.com',
    gradescopeEmail: process.env.GRADESCOPE_EMAIL,
    gradescopePassword: process.env.GRADESCOPE_PASSWORD,
    port,
    isProduction
  };

  return configSchema.parse(config);
}

/**
 * Legacy function for backwards compatibility
 * @deprecated Use loadConfig() instead
 */
export function getConfig(): Config {
  return loadConfig();
}

/**
 * Logger utility with debug mode support
 */
export class Logger {
  private debugMode: boolean;

  constructor(debug: boolean = false) {
    this.debugMode = debug;
  }

  log(...args: any[]): void {
    console.log('[Canvas-MCP]', ...args);
  }

  error(...args: any[]): void {
    console.error('[Canvas-MCP ERROR]', ...args);
  }

  debug(...args: any[]): void {
    if (this.debugMode) {
      console.log('[Canvas-MCP DEBUG]', ...args);
    }
  }

  warn(...args: any[]): void {
    console.warn('[Canvas-MCP WARN]', ...args);
  }
}
