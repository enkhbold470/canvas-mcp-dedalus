import { test, expect, beforeEach, afterEach } from "bun:test";
import { loadConfig, Logger } from "../src/config";

import { config as loadEnv } from 'dotenv';

// Load environment variables
loadEnv();

const originalEnv = { ...process.env };

beforeEach(() => {
  // Reset env
  process.env = { ...originalEnv };
});

afterEach(() => {
  process.env = originalEnv;
});

test("loadConfig with default values", () => {
  const config = loadConfig();
  expect(config.debug).toBe(false);
  expect(config.canvasApiKey).toBe(process.env.CANVAS_API_KEY);
  expect(config.canvasBaseUrl).toBe("https://deanza.instructure.com");
  expect(config.port).toBe(8080);
  expect(config.isProduction).toBe(false);
});

test("loadConfig with environment variables", () => {
  process.env.DEBUG = "true";
  process.env.CANVAS_API_KEY = "test_key";
  process.env.CANVAS_BASE_URL = "https://test.canvas.com";
  process.env.GRADESCOPE_EMAIL = "test@example.com";
  process.env.GRADESCOPE_PASSWORD = "password";
  process.env.PORT = "3000";
  process.env.NODE_ENV = "production";

  const config = loadConfig();
  expect(config.debug).toBe(true);
  expect(config.canvasApiKey).toBe("test_key");
  expect(config.canvasBaseUrl).toBe("https://test.canvas.com");
  expect(config.gradescopeEmail).toBe("test@example.com");
  expect(config.gradescopePassword).toBe("password");
  expect(config.port).toBe(3000);
  expect(config.isProduction).toBe(true);
});

test("Logger logs messages", () => {
  const logger = new Logger();
  // Since we can't capture console output easily, just test that methods exist and don't throw
  expect(() => logger.log("test")).not.toThrow();
  expect(() => logger.error("test")).not.toThrow();
  expect(() => logger.warn("test")).not.toThrow();
});

test("Logger debug mode", () => {
  const logger = new Logger(true);
  expect(() => logger.debug("test")).not.toThrow();
});

test("Logger debug off", () => {
  const logger = new Logger(false);
  expect(() => logger.debug("test")).not.toThrow();
});