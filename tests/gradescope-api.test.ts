import { test, expect } from "bun:test";
import { GradescopeApi } from "../src/gradescope-api";
import { Logger } from "../src/config";

test("GradescopeApi can be instantiated", () => {
  const logger = new Logger();
  const config = {
    email: "test@example.com",
    password: "password",
    logger
  };
  const api = new GradescopeApi(config);
  expect(api).toBeInstanceOf(GradescopeApi);
});

// Note: Full testing of API methods would require mocking HTTP requests
// For now, this tests basic instantiation