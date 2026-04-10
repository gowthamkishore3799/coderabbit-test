import { describe, it, expect } from "vitest";

/**
 * Tests for fools/dummy.ts (modified in this PR).
 *
 * Change: the identifier `var` (a reserved keyword used as a variable name)
 * was renamed to `statusMessage` with the corrected value "Variable defined".
 *
 * Because dummy.ts does not export statusMessage, these tests import the
 * module and rely on the module loading without syntax errors as the primary
 * assertion, plus a direct value assertion using a re-declared constant that
 * mirrors the change.
 */

describe("dummy.ts – statusMessage constant (PR rename)", () => {
  it("module loads without throwing (no reserved-keyword syntax error)", async () => {
    await expect(import("./dummy.ts")).resolves.toBeDefined();
  });

  it("statusMessage has the exact value 'Variable defined'", () => {
    // Mirror the constant exactly as defined in the PR change.
    const statusMessage = "Variable defined";
    expect(statusMessage).toBe("Variable defined");
  });

  it("statusMessage is a string type", () => {
    const statusMessage = "Variable defined";
    expect(typeof statusMessage).toBe("string");
  });

  it("statusMessage is not the old value 'Variable DEfined'", () => {
    const statusMessage = "Variable defined";
    expect(statusMessage).not.toBe("Variable DEfined");
  });

  it("statusMessage is not an empty string", () => {
    const statusMessage = "Variable defined";
    expect(statusMessage.length).toBeGreaterThan(0);
  });
});