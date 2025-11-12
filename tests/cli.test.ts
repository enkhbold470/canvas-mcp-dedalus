import { test, expect, beforeEach, afterEach } from "bun:test";
import { parseArgs } from "../src/cli";

const originalArgv = process.argv;

beforeEach(() => {
  process.argv = [...originalArgv];
});

afterEach(() => {
  process.argv = originalArgv;
});

test("parseArgs with no arguments", () => {
  process.argv = ["node", "script.js"];
  const options = parseArgs();
  expect(options).toEqual({});
});

test("parseArgs with --port", () => {
  process.argv = ["node", "script.js", "--port", "3000"];
  const options = parseArgs();
  expect(options.port).toBe(3000);
});

test("parseArgs with --stdio", () => {
  process.argv = ["node", "script.js", "--stdio"];
  const options = parseArgs();
  expect(options.stdio).toBe(true);
});

test("parseArgs with multiple options", () => {
  process.argv = ["node", "script.js", "--port", "3000", "--stdio"];
  const options = parseArgs();
  expect(options.port).toBe(3000);
  expect(options.stdio).toBe(true);
});

test("parseArgs with --port missing value", () => {
  process.argv = ["node", "script.js", "--port"];
  expect(() => parseArgs()).toThrow("--port flag requires a value");
});