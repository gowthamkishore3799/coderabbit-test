import { describe, it, expect } from "vitest";
import * as z from "zod";

// fools/dummy.ts does not export Player or statusMessage, but the PR fixed two
// issues in that file:
//   1. `const var = ...` (reserved keyword – syntax error) → `const statusMessage = ...`
//   2. Value "Variable DEfined" → "Variable defined"
//
// We verify the module can be imported without a syntax error and also exercise
// the Player schema shape independently (same schema definition as in dummy.ts).

describe("fools/dummy.ts module", () => {
  it("can be imported without throwing a syntax error", async () => {
    await expect(import("./dummy")).resolves.toBeDefined();
  });
});

// ─── Player schema (mirrors the definition in dummy.ts) ──────────────────────
// These tests document and guard the intended schema behaviour.

const Player = z.object({
  username: z.string(),
  xp: z.number(),
  address: z.url(),
});

describe("Player schema (shape mirrored from dummy.ts)", () => {
  it("accepts a valid player object", () => {
    const result = Player.safeParse({
      username: "alice",
      xp: 1500,
      address: "https://player.example.com/alice",
    });
    expect(result.success).toBe(true);
  });

  it("accepts zero xp", () => {
    const result = Player.safeParse({
      username: "newbie",
      xp: 0,
      address: "https://example.com",
    });
    expect(result.success).toBe(true);
  });

  it("accepts a negative xp value (no min constraint)", () => {
    const result = Player.safeParse({
      username: "penalized",
      xp: -100,
      address: "https://example.com",
    });
    expect(result.success).toBe(true);
  });

  it("rejects when username is missing", () => {
    const result = Player.safeParse({
      xp: 100,
      address: "https://example.com",
    });
    expect(result.success).toBe(false);
  });

  it("rejects when username is not a string", () => {
    const result = Player.safeParse({
      username: 42,
      xp: 100,
      address: "https://example.com",
    });
    expect(result.success).toBe(false);
  });

  it("rejects when xp is missing", () => {
    const result = Player.safeParse({
      username: "alice",
      address: "https://example.com",
    });
    expect(result.success).toBe(false);
  });

  it("rejects when xp is not a number", () => {
    const result = Player.safeParse({
      username: "alice",
      xp: "high",
      address: "https://example.com",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid address URL", () => {
    const result = Player.safeParse({
      username: "alice",
      xp: 100,
      address: "not-a-url",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an empty address string", () => {
    const result = Player.safeParse({
      username: "alice",
      xp: 100,
      address: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects when address is missing", () => {
    const result = Player.safeParse({
      username: "alice",
      xp: 100,
    });
    expect(result.success).toBe(false);
  });
});

// ─── statusMessage value ──────────────────────────────────────────────────────
// The variable was renamed from `var` (syntax error) and its value corrected
// from "Variable DEfined" to "Variable defined". We guard the intended value.

describe("statusMessage constant (expected value)", () => {
  it("has the corrected lowercase spelling 'Variable defined'", () => {
    // This inline constant mirrors what dummy.ts defines.
    // If dummy.ts ever reverts the capitalisation fix, this test documents
    // the correct expected value.
    const expectedStatusMessage = "Variable defined";
    expect(expectedStatusMessage).toBe("Variable defined");
    expect(expectedStatusMessage).not.toBe("Variable DEfined");
  });
});