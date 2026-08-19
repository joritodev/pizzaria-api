import { describe, expect, test } from "bun:test";
import { createDb } from "./index";

describe("createDb", () => {
  test("throws when DATABASE_URL is missing", () => {
    const previous = process.env.DATABASE_URL;
    delete process.env.DATABASE_URL;

    try {
      expect(() => createDb()).toThrow("DATABASE_URL is not set");
    } finally {
      if (previous !== undefined) {
        process.env.DATABASE_URL = previous;
      }
    }
  });
});
