/**
 * HTTP Transport for Canvas MCP Server
 * Supports both StreamableHTTP and SSE transports
 * Following Dedalus Labs transport structure
 */

import { createServer, IncomingMessage, ServerResponse } from 'http';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { randomUUID } from 'crypto';
import { createStandaloneServer } from '../server.js';
import { Config } from '../config.js';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';

interface Session {
  transport: StreamableHTTPServerTransport;
  server: Server;
}

const sessions = new Map<string, Session>();

/**
 * Start HTTP transport server
 */
export function startHttpTransport(config: Config): void {
  const httpServer = createServer();

  httpServer.on('request', async (req, res) => {
    const url = new URL(req.url!, `http://${req.headers.host}`);

    switch (url.pathname) {
      case '/mcp':
        await handleMcpRequest(req, res, config);
        break;
      case '/sse':
        await handleSSERequest(req, res, config);
        break;
      case '/health':
        handleHealthCheck(res);
        break;
      default:
        handleNotFound(res);
    }
  });

  const host = config.isProduction ? '0.0.0.0' : 'localhost';
  
  httpServer.listen(config.port, host, () => {
    logServerStart(config);
  });
}

/**
 * Handle MCP requests (StreamableHTTP)
 */
async function handleMcpRequest(
  req: IncomingMessage,
  res: ServerResponse,
  config: Config
): Promise<void> {
  const sessionId = req.headers['mcp-session-id'] as string | undefined;

  if (sessionId) {
    const session = sessions.get(sessionId);
    if (!session) {
      res.statusCode = 404;
      res.end('Session not found');
      return;
    }
    return await session.transport.handleRequest(req, res);
  }

  if (req.method === 'POST') {
    await createNewSession(req, res, config);
    return;
  }

  res.statusCode = 400;
  res.end('Invalid request');
}

/**
 * Handle SSE requests (Server-Sent Events)
 */
async function handleSSERequest(
  req: IncomingMessage,
  res: ServerResponse,
  config: Config
): Promise<void> {
  const serverInstance = createStandaloneServer(config);
  const transport = new SSEServerTransport('/sse', res);
  
  try {
    await serverInstance.connect(transport);
    console.log('SSE connection established');
  } catch (error) {
    console.error('SSE connection error:', error);
    res.statusCode = 500;
    res.end('SSE connection failed');
  }
}

/**
 * Create a new MCP session
 */
async function createNewSession(
  req: IncomingMessage,
  res: ServerResponse,
  config: Config
): Promise<void> {
  const serverInstance = createStandaloneServer(config);
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: () => randomUUID(),
    onsessioninitialized: (sessionId) => {
      sessions.set(sessionId, { transport, server: serverInstance });
      console.log('New Canvas MCP session created:', sessionId);
    }
  });

  transport.onclose = () => {
    if (transport.sessionId) {
      sessions.delete(transport.sessionId);
      console.log('Canvas MCP session closed:', transport.sessionId);
    }
  };

  try {
    await serverInstance.connect(transport);
    await transport.handleRequest(req, res);
  } catch (error) {
    console.error('Streamable HTTP connection error:', error);
    res.statusCode = 500;
    res.end('Internal server error');
  }
}

/**
 * Health check endpoint
 */
function handleHealthCheck(res: ServerResponse): void {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'canvas-mcp-dedalus',
    version: '1.0.0'
  }));
}

/**
 * 404 handler
 */
function handleNotFound(res: ServerResponse): void {
  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not Found');
}

/**
 * Log server startup information
 */
function logServerStart(config: Config): void {
  const displayUrl = config.isProduction 
    ? `Port ${config.port}` 
    : `http://localhost:${config.port}`;
  
  console.log(`Canvas MCP Server listening on ${displayUrl}`);

  if (!config.isProduction) {
    console.log('Put this in your MCP client config:');
    console.log(JSON.stringify({
      "mcpServers": {
        "canvas-mcp": {
          "url": `http://localhost:${config.port}/mcp`
        }
      }
    }, null, 2));
    console.log('For backward compatibility, you can also use the /sse endpoint.');
  }
}
