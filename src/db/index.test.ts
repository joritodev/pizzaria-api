import { describe, expect, test } from "bun:test";
import { createDb } from "./index";

describe("createDb", () => {
  test("throws when DATABASE_URL is missing", () => {
    expect(() => createDb(undefined)).toThrow("DATABASE_URL is not set");
  });
});
