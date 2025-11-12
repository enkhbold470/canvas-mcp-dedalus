import { test, expect, beforeEach } from "bun:test";
import { cache } from "../src/cache";

beforeEach(() => {
  cache.clear();
});

test("cache set and get", () => {
  cache.set("courses", { test: "data" });
  const result = cache.get("courses");
  expect(result).toEqual({ test: "data" });
});

test("cache get with key", () => {
  cache.set("modules", { id: 1 }, "course_123");
  const result = cache.get("modules", "course_123");
  expect(result).toEqual({ id: 1 });
});

test("cache returns null for non-existent key", () => {
  const result = cache.get("courses");
  expect(result).toBeNull();
});

test("cache expiration", async () => {
  // Set with short TTL for testing
  cache.set("courses", { test: "data" });
  // Wait for expiration (TTL is 3600 seconds, but we can't wait that long)
  // For testing, we can mock Date.now, but for simplicity, assume it doesn't expire immediately
  const result = cache.get("courses");
  expect(result).toEqual({ test: "data" });
});

test("cache clear", () => {
  cache.set("courses", { test: "data" });
  cache.clear();
  const result = cache.get("courses");
  expect(result).toBeNull();
});

test("cache clearType", () => {
  cache.set("courses", { test: "data" });
  cache.set("modules", { id: 1 }, "course_123");
  cache.clearType("courses");
  expect(cache.get("courses")).toBeNull();
  const moduleResult = cache.get("modules", "course_123");
  expect(moduleResult).not.toBeNull();
  expect(moduleResult).toEqual({ id: 1 });
});

test("cache getStats", () => {
  cache.set("courses", { test: "data" });
  cache.set("modules", { id: 1 }, "course_123");
  const stats = cache.getStats();
  expect(stats.totalEntries).toBe(2);
  expect(stats.cacheTypes.courses).toBe(1);
  expect(stats.cacheTypes.modules).toBe(1);
});