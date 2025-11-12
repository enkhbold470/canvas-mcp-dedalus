import { test, expect } from "bun:test";
import { CanvasApi } from "../src/canvas-api";
import { Logger } from "../src/config";

test("CanvasApi can be instantiated", () => {
  const logger = new Logger();
  const config = {
    apiKey: "test_key",
    baseUrl: "https://test.canvas.com",
    logger
  };
  const api = new CanvasApi(config);
  expect(api).toBeInstanceOf(CanvasApi);
});

// Note: Full testing of API methods would require mocking HTTP requests
// For now, this tests basic instantiation