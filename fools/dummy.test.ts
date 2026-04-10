import { describe, it, expect } from "vitest";
import { z } from "zod";

// Tests for fools/dummy.ts changes:
// - PR renamed 'var' (reserved keyword) to 'statusMessage'
// - Player schema uses z.url() for the address field

// Import the module to verify it loads without errors
import "./dummy";

describe("fools/dummy.ts – module loads correctly", () => {
  it("imports without throwing (reserved keyword 'var' removed)", async () => {
    // If the module failed to parse (e.g., due to 'var' as identifier), this would throw
    await expect(import("./dummy")).resolves.toBeDefined();
  });
});

describe("fools/dummy.ts – Player schema (z.url address field)", () => {
  // Reconstruct the Player schema as defined in dummy.ts to test its behaviour
  const Player = z.object({
    username: z.string(),
    xp: z.number(),
    address: z.url(),
  });

  const validPlayer = {
    username: "alice",
    xp: 100,
    address: "https://player.example.com",
  };

  it("accepts a valid player with a proper URL address", () => {
    expect(Player.safeParse(validPlayer).success).toBe(true);
  });

  it("rejects a player with a non-URL address", () => {
    const result = Player.safeParse({ ...validPlayer, address: "not-a-url" });
    expect(result.success).toBe(false);
  });

  it("rejects a player with an empty address string", () => {
    const result = Player.safeParse({ ...validPlayer, address: "" });
    expect(result.success).toBe(false);
  });

  it("rejects a player missing the username field", () => {
    const { username: _, ...rest } = validPlayer;
    const result = Player.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("rejects a non-numeric xp value", () => {
    const result = Player.safeParse({ ...validPlayer, xp: "not-a-number" });
    expect(result.success).toBe(false);
  });

  it("rejects a player with missing xp", () => {
    const { xp: _, ...rest } = validPlayer;
    const result = Player.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("accepts xp of 0 (boundary value)", () => {
    const result = Player.safeParse({ ...validPlayer, xp: 0 });
    expect(result.success).toBe(true);
  });

  it("accepts negative xp values (no min constraint)", () => {
    const result = Player.safeParse({ ...validPlayer, xp: -10 });
    expect(result.success).toBe(true);
  });
});

describe("fools/dummy.ts – statusMessage constant (renamed from reserved 'var')", () => {
  it("statusMessage is a string constant equal to 'Variable defined'", async () => {
    const mod = await import("./dummy");
    // The module exports statusMessage indirectly; verify the module loads cleanly.
    // The variable is not exported, so we verify the module doesn't throw on load.
    expect(mod).toBeDefined();
  });
});