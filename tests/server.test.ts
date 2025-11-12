import { test, expect } from "bun:test";
import { createStandaloneServer, CanvasMCPServer } from "../src/server";
import { loadConfig } from "../src/config";

test("createStandaloneServer creates a server instance", () => {
  const config = loadConfig();
  const server = createStandaloneServer(config);
  expect(server).toBeDefined();
  // Server is from MCP SDK, we can check it has the expected methods
  expect(typeof server.setRequestHandler).toBe("function");
});

test("CanvasMCPServer can be instantiated", () => {
  const config = loadConfig();
  const mcpServer = new CanvasMCPServer(config);
  expect(mcpServer).toBeInstanceOf(CanvasMCPServer);
  const server = mcpServer.getServer();
  expect(server).toBeDefined();
});