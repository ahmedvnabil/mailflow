import { describe, expect, it } from "vitest";
import { schemaStatements } from "./schema";

describe("schemaStatements", () => {
  it("returns complete semicolon-delimited SQL statements", () => {
    const statements = schemaStatements();

    expect(statements.length).toBeGreaterThan(3);
    expect(statements[0]).toContain("CREATE TABLE IF NOT EXISTS rules");
    expect(statements.every((statement) => statement.includes("(") || statement.includes("INDEX"))).toBe(true);
    expect(statements.some((statement) => statement.trim() === "CREATE TABLE IF NOT EXISTS rules (")).toBe(false);
  });
});
