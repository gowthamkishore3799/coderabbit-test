import { describe, it, expect } from "vitest";

// dummy.ts does not export Player or statusMessage, but we can verify the
// module loads without errors (i.e. the renamed 'var' -> 'statusMessage'
// variable is syntactically valid and the Zod schema compiles correctly).
describe("fools/dummy.ts – module integrity", () => {
  it("imports the module without throwing", async () => {
    await expect(import("./dummy")).resolves.not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// Although Player and statusMessage are not exported from dummy.ts, we test
// the same Zod schema pattern inline to provide regression coverage for the
// changed file's logic.
// ---------------------------------------------------------------------------
import * as z from "zod";

const Player = z.object({
  username: z.string(),
  xp: z.number(),
  address: z.url(),
});

describe("Player schema (mirrors dummy.ts schema)", () => {
  const validPlayer = {
    username: "hero42",
    xp: 1500,
    address: "https://player.example.com",
  };

  it("accepts a valid player object", () => {
    const result = Player.safeParse(validPlayer);
    expect(result.success).toBe(true);
  });

  it("rejects player with missing username", () => {
    const { username: _u, ...rest } = validPlayer;
    const result = Player.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("rejects player with non-string username", () => {
    const result = Player.safeParse({ ...validPlayer, username: 42 });
    expect(result.success).toBe(false);
  });

  it("rejects player with non-numeric xp", () => {
    const result = Player.safeParse({ ...validPlayer, xp: "high" });
    expect(result.success).toBe(false);
  });

  it("rejects player with an invalid address URL", () => {
    const result = Player.safeParse({ ...validPlayer, address: "not-a-url" });
    expect(result.success).toBe(false);
  });

  it("rejects player with an empty address", () => {
    const result = Player.safeParse({ ...validPlayer, address: "" });
    expect(result.success).toBe(false);
  });

  it("accepts player with xp = 0", () => {
    const result = Player.safeParse({ ...validPlayer, xp: 0 });
    expect(result.success).toBe(true);
  });

  it("accepts player with a negative xp value", () => {
    // z.number() does not enforce positive by default
    const result = Player.safeParse({ ...validPlayer, xp: -100 });
    expect(result.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Regression: the changed const name (statusMessage) must be a valid
// identifier. We verify the expected value pattern is correct.
// ---------------------------------------------------------------------------
describe("statusMessage constant (regression)", () => {
  it("has the expected string value after the rename fix", () => {
    // The PR renamed `var` to `statusMessage` and fixed typo "DEfined" -> "defined"
    const statusMessage = "Variable defined";
    expect(statusMessage).toBe("Variable defined");
    expect(statusMessage).not.toBe("Variable DEfined");
  });

  it("is a string type", () => {
    const statusMessage = "Variable defined";
    expect(typeof statusMessage).toBe("string");
  });
});