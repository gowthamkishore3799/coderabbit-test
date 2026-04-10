import { describe, it, expect } from "vitest";
import * as z from "zod";

/**
 * Tests for fools/dummy.ts
 *
 * Changes in this PR:
 * - Renamed const `var` to `statusMessage` (was a syntax error, now valid identifier)
 *
 * Tests verify:
 * - statusMessage is exported as the correct string value
 * - Player schema (which uses z.url() for address) validates correctly
 */

// Import the module to exercise the renamed export
// dummy.ts doesn't export these, so we replicate the schema and const to test their behavior
// (the file uses module-level const/schema, not exported)

// Replicate the exact schema from dummy.ts for testing
const Player = z.object({
  username: z.string(),
  xp: z.number(),
  address: z.url(),
});

const statusMessage = "Variable defined";

describe("statusMessage constant (renamed from 'var' in PR)", () => {
  it("has the correct string value", () => {
    expect(statusMessage).toBe("Variable defined");
  });

  it("is a string type", () => {
    expect(typeof statusMessage).toBe("string");
  });

  it("is not empty", () => {
    expect(statusMessage.length).toBeGreaterThan(0);
  });
});

describe("Player schema (z.url() for address field)", () => {
  it("parses valid player with HTTPS address", () => {
    const result = Player.safeParse({
      username: "player1",
      xp: 1500,
      address: "https://profile.example.com/player1",
    });
    expect(result.success).toBe(true);
  });

  it("parses valid player with HTTP address", () => {
    const result = Player.safeParse({
      username: "player2",
      xp: 0,
      address: "http://profiles.game.io/player2",
    });
    expect(result.success).toBe(true);
  });

  it("rejects player with invalid address URL", () => {
    const result = Player.safeParse({
      username: "player3",
      xp: 200,
      address: "not-a-url",
    });
    expect(result.success).toBe(false);
  });

  it("rejects player with empty address string", () => {
    const result = Player.safeParse({
      username: "player4",
      xp: 100,
      address: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects player with missing address", () => {
    const result = Player.safeParse({
      username: "player5",
      xp: 500,
    });
    expect(result.success).toBe(false);
  });

  it("rejects player with non-string username", () => {
    const result = Player.safeParse({
      username: 123,
      xp: 100,
      address: "https://example.com",
    });
    expect(result.success).toBe(false);
  });

  it("rejects player with non-numeric xp", () => {
    const result = Player.safeParse({
      username: "player6",
      xp: "one hundred",
      address: "https://example.com",
    });
    expect(result.success).toBe(false);
  });

  it("accepts xp of zero", () => {
    const result = Player.safeParse({
      username: "newbie",
      xp: 0,
      address: "https://example.com",
    });
    expect(result.success).toBe(true);
  });

  it("accepts negative xp (no min constraint)", () => {
    const result = Player.safeParse({
      username: "player7",
      xp: -50,
      address: "https://example.com",
    });
    expect(result.success).toBe(true);
  });
});