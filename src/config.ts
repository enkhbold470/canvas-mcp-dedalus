/**
 * Configuration management for Canvas MCP
 * Handles environment variables and settings
 */

import { config } from 'dotenv';
import { z } from 'zod';

// Load environment variables
config();

// Configuration schema validation
export const configSchema = z.object({
  debug: z.boolean().default(false).describe("Enable debug logging"),
  canvasApiKey: z.string().describe("Canvas API key"),
  canvasBaseUrl: z.string().default("https://canvas.asu.edu").describe("Canvas base URL"),
  gradescopeEmail: z.string().optional().describe("Gradescope email"),
  gradescopePassword: z.string().optional().describe("Gradescope password")
});

export type Config = z.infer<typeof configSchema>;

/**
 * Get configuration from environment variables
 */
export function getConfig(): Config {
  const config = {
    debug: process.env.DEBUG === 'true',
    canvasApiKey: process.env.CANVAS_API_KEY || '',
    canvasBaseUrl: process.env.CANVAS_BASE_URL || 'https://canvas.asu.edu',
    gradescopeEmail: process.env.GRADESCOPE_EMAIL,
    gradescopePassword: process.env.GRADESCOPE_PASSWORD
  };

  // Validate required fields
  if (!config.canvasApiKey) {
    throw new Error('CANVAS_API_KEY environment variable is required');
  }

  return configSchema.parse(config);
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
