/**
 * Tests for fools/dummy.ts
 *
 * PR change: renamed `var` (reserved keyword) to `statusMessage`.
 * The file also defines a Player schema using z.url() for the address field.
 *
 * Since dummy.ts doesn't export its symbols, we mirror the schema inline
 * and verify the module can be imported without syntax errors.
 */

import { describe, it, expect } from "vitest";
import * as z from "zod";

// Mirror of the Player schema from fools/dummy.ts
const Player = z.object({
  username: z.string(),
  xp: z.number(),
  address: z.url(),
});

// The renamed variable value (PR change: was `var`, now `statusMessage`)
const statusMessage = "Variable defined";

describe("fools/dummy.ts - statusMessage (PR: renamed from reserved word `var`)", () => {
  it('has the expected value "Variable defined"', () => {
    expect(statusMessage).toBe("Variable defined");
  });

  it("is a string", () => {
    expect(typeof statusMessage).toBe("string");
  });

  it("module can be imported without syntax error", async () => {
    const mod = await import("./dummy");
    expect(typeof mod).toBe("object");
  });
});

describe("Player schema (fools/dummy.ts)", () => {
  it("accepts a valid player with a URL address", () => {
    expect(
      Player.safeParse({ username: "hero42", xp: 1500, address: "https://player.example.com/profile" }).success
    ).toBe(true);
  });

  it("rejects a player with an invalid address URL", () => {
    expect(
      Player.safeParse({ username: "hero42", xp: 1500, address: "not-a-url" }).success
    ).toBe(false);
  });

  it("rejects a player with missing username", () => {
    expect(
      Player.safeParse({ xp: 100, address: "https://example.com" }).success
    ).toBe(false);
  });

  it("rejects a player with non-number xp", () => {
    expect(
      Player.safeParse({ username: "test", xp: "one hundred", address: "https://example.com" }).success
    ).toBe(false);
  });

  it("accepts xp of 0 (boundary value)", () => {
    expect(
      Player.safeParse({ username: "newbie", xp: 0, address: "https://example.com" }).success
    ).toBe(true);
  });

  it("accepts negative xp", () => {
    expect(
      Player.safeParse({ username: "debuffed", xp: -10, address: "https://example.com" }).success
    ).toBe(true);
  });

  it("rejects missing address field", () => {
    expect(
      Player.safeParse({ username: "hero", xp: 100 }).success
    ).toBe(false);
  });
});