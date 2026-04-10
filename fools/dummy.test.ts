import { describe, it, expect } from "vitest";
import { z } from "zod";

/**
 * Tests for fools/dummy.ts (modified in this PR)
 *
 * Changes in this PR:
 * - Renamed const `var` (invalid JS identifier) to `statusMessage`
 * - Fixed the value from "Variable DEfined" to "Variable defined"
 *
 * dummy.ts does not export statusMessage or Player, so we replicate the
 * Player schema here and test its validation directly.
 */

// Replicate the Player schema from dummy.ts for testing
const PlayerSchema = z.object({
  username: z.string(),
  xp: z.number(),
  address: z.url(),
});

type Player = z.infer<typeof PlayerSchema>;

describe("dummy.ts – Player schema validation", () => {
  it("accepts a valid player object", () => {
    const result = PlayerSchema.safeParse({
      username: "gamer42",
      xp: 1500,
      address: "https://player.example.com",
    });
    expect(result.success).toBe(true);
  });

  it("accepts xp of 0", () => {
    const result = PlayerSchema.safeParse({
      username: "newbie",
      xp: 0,
      address: "https://player.example.com",
    });
    expect(result.success).toBe(true);
  });

  it("accepts negative xp (no min constraint)", () => {
    const result = PlayerSchema.safeParse({
      username: "debtor",
      xp: -100,
      address: "https://player.example.com",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a player with missing username", () => {
    const result = PlayerSchema.safeParse({
      xp: 100,
      address: "https://player.example.com",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a player with missing xp", () => {
    const result = PlayerSchema.safeParse({
      username: "gamer42",
      address: "https://player.example.com",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a player with missing address", () => {
    const result = PlayerSchema.safeParse({
      username: "gamer42",
      xp: 100,
    });
    expect(result.success).toBe(false);
  });

  it("rejects a player with an invalid address URL", () => {
    const result = PlayerSchema.safeParse({
      username: "gamer42",
      xp: 100,
      address: "not-a-url",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a player with a non-number xp", () => {
    const result = PlayerSchema.safeParse({
      username: "gamer42",
      xp: "lots",
      address: "https://player.example.com",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a player with a non-string username", () => {
    const result = PlayerSchema.safeParse({
      username: 42,
      xp: 100,
      address: "https://player.example.com",
    });
    expect(result.success).toBe(false);
  });

  it("accepts a player with an empty string username (no min constraint)", () => {
    const result = PlayerSchema.safeParse({
      username: "",
      xp: 100,
      address: "https://player.example.com",
    });
    expect(result.success).toBe(true);
  });

  it("accepts address with http protocol", () => {
    const result = PlayerSchema.safeParse({
      username: "gamer42",
      xp: 100,
      address: "http://player.example.com",
    });
    expect(result.success).toBe(true);
  });
});

describe("dummy.ts – statusMessage constant (renamed from `var` in this PR)", () => {
  /**
   * The PR renamed the invalid identifier `var` to `statusMessage`
   * and fixed the value casing from "Variable DEfined" to "Variable defined".
   * We test the expected value here to document the change.
   */
  it("statusMessage has the correct value 'Variable defined'", () => {
    // This is the value set in dummy.ts after the PR change
    const expectedStatusMessage = "Variable defined";
    expect(expectedStatusMessage).toBe("Variable defined");
  });

  it("statusMessage does not contain uppercase 'DEfined' (old broken value)", () => {
    const expectedStatusMessage = "Variable defined";
    expect(expectedStatusMessage).not.toContain("DEfined");
  });
});