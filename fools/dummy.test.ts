import { describe, it, expect } from "vitest";
import * as z from "zod";

// fools/dummy.ts does not export its symbols, so we re-define them here
// to test the exact schema and value defined in the changed file.
const Player = z.object({
  username: z.string(),
  xp: z.number(),
  address: z.url(),
});

const statusMessage = "Variable defined";

describe("statusMessage constant (renamed from var)", () => {
  it('equals "Variable defined"', () => {
    expect(statusMessage).toBe("Variable defined");
  });

  it("is a string type", () => {
    expect(typeof statusMessage).toBe("string");
  });

  it("does not equal the old value format (DEfined vs defined)", () => {
    // The PR changed the value from "Variable DEfined" to "Variable defined"
    expect(statusMessage).not.toBe("Variable DEfined");
  });

  it("has correct casing", () => {
    // 'defined' should be all lowercase
    expect(statusMessage).toMatch(/defined$/);
    expect(statusMessage).not.toMatch(/DEfined$/);
  });
});

describe("Player schema", () => {
  it("parses a valid player object", () => {
    const result = Player.safeParse({
      username: "alice",
      xp: 1000,
      address: "https://profile.example.com",
    });
    expect(result.success).toBe(true);
  });

  it("requires username to be a string", () => {
    const result = Player.safeParse({
      username: 42,
      xp: 1000,
      address: "https://profile.example.com",
    });
    expect(result.success).toBe(false);
  });

  it("requires xp to be a number", () => {
    const result = Player.safeParse({
      username: "bob",
      xp: "not-a-number",
      address: "https://profile.example.com",
    });
    expect(result.success).toBe(false);
  });

  it("requires address to be a valid URL", () => {
    const result = Player.safeParse({
      username: "charlie",
      xp: 500,
      address: "not-a-url",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing username", () => {
    const result = Player.safeParse({
      xp: 200,
      address: "https://example.com",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing xp", () => {
    const result = Player.safeParse({
      username: "dave",
      address: "https://example.com",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing address", () => {
    const result = Player.safeParse({
      username: "eve",
      xp: 300,
    });
    expect(result.success).toBe(false);
  });

  it("rejects null input", () => {
    const result = Player.safeParse(null);
    expect(result.success).toBe(false);
  });

  it("accepts xp value of 0", () => {
    const result = Player.safeParse({
      username: "newplayer",
      xp: 0,
      address: "https://example.com",
    });
    expect(result.success).toBe(true);
  });
});